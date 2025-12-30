/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import fs from "fs";
import path from "path";
import AppError from "../errors/AppError";
import { uploadFileToS3 } from "../lib/s3";
import ffmpeg from "../lib/ffmpeg";
import { ensureDir } from "../utils/ensureDir";
import { getBlurHashFromFile } from "../lib/blurhash";
import { config } from "../config";

type TDownloadResult = {
  platform: "instagram" | "facebook" | "tiktok";
  originalUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  blurhash: string;
};

const detectPlatform = (url: string): { apiPath: string; platform: TDownloadResult["platform"] } => {
  const lc = url.toLowerCase();

  if (lc.includes("tiktok.com")) return { apiPath: "v2/tiktok/video", platform: "tiktok" };
  if (lc.includes("instagram.com")) return { apiPath: "v1/instagram/post", platform: "instagram" };
  if (lc.includes("facebook.com")) return { apiPath: "v1/facebook/post", platform: "facebook" };

  throw new AppError(400, "Unsupported or invalid social media URL");
};

const fetchDirectVideoUrl = async (url: string, apiPath: string): Promise<string> => {
  try {
    const apiBase = "https://api.scrapecreators.com";
    const endpoint = `${apiBase}/${apiPath}?url=${encodeURIComponent(url)}`;

    const response = await axios.get(endpoint, {
      headers: { "x-api-key": config.scrapeCreatorsApiKey }
    });

    let data: any = null;

    if (apiPath === "v1/instagram/post") data = response?.data?.data?.xdt_shortcode_media;
    else if (apiPath === "v1/facebook/post") data = response?.data;
    else if (apiPath === "v2/tiktok/video") data = response?.data?.aweme_detail;

    if (!data) throw new AppError(502, `Failed to fetch media object for ${apiPath}`);

    let possible = "";

    if (apiPath === "v1/instagram/post") possible = data?.video_url;
    else if (apiPath === "v1/facebook/post") possible = data?.video?.hd_url || data?.video?.sd_url;
    else if (apiPath === "v2/tiktok/video") {
      possible =
        data?.video?.bit_rate?.[0]?.play_addr?.url_list?.[0] ||
        data?.video?.play_addr?.url_list?.[0];
    }

    if (!possible) throw new AppError(404, "No direct video URL found in ScrapeCreators response");

    return possible;
  } catch (err: any) {
    console.error("[fetchDirectVideoUrl] Error:", err?.message || err);
    return "";
  }
};

const downloadToTemp = async (videoUrl: string): Promise<string> => {
  const tempDir = path.join(process.cwd(), "tmp");
  ensureDir(tempDir);

  const cleanBase = path.basename(videoUrl.split("?")[0]) || "video.mp4";
  const fileName = `${Date.now()}_${cleanBase}`;
  const filePath = path.join(tempDir, fileName);

  const writer = fs.createWriteStream(filePath);

  const res = await axios({
    url: videoUrl,
    method: "GET",
    responseType: "stream",
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  await new Promise<void>((resolve, reject) => {
    res.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return filePath;
};

const extractThumbnailFromLocalVideo = async (videoFilePath: string): Promise<string> => {
  const tempDir = path.join(process.cwd(), "tmp");
  ensureDir(tempDir);

  const base = path.parse(videoFilePath).name;
  const thumbPath = path.join(tempDir, `${base}_thumbnail.webp`);

  // capture at ~4 seconds
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoFilePath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .screenshots({
        timestamps: ["4"],
        filename: path.basename(thumbPath),
        folder: tempDir
      });
  });

  return thumbPath;
};

export const downloadAndProcessSocialVideo = async ({
  originalUrl
}: {
  originalUrl: string;
}): Promise<TDownloadResult> => {
  if (!originalUrl) throw new AppError(400, "URL is required");

  const { apiPath, platform } = detectPlatform(originalUrl);

  const directVideoUrl = await fetchDirectVideoUrl(originalUrl, apiPath);
  if (!directVideoUrl) throw new AppError(500, "Failed to resolve direct video URL");

  // 1) Download MP4
  const localVideoPath = await downloadToTemp(directVideoUrl);

  // 2) Upload video to S3
  const videoKey = `social-media-videos/${platform}/${path.basename(localVideoPath)}`;
  const videoUrl = await uploadFileToS3(localVideoPath, videoKey, "video/mp4");

  // 3) Extract thumbnail locally
  const localThumbPath = await extractThumbnailFromLocalVideo(localVideoPath);

  // 4) Upload thumbnail to S3
  const thumbKey = `social-media-videos/${platform}/thumbnails/${path.basename(localThumbPath)}`;
  const thumbnailUrl = await uploadFileToS3(localThumbPath, thumbKey, "image/webp");

  // 5) Blurhash from local thumbnail
  const blurhash = await getBlurHashFromFile(localThumbPath);

  // cleanup
  try { fs.unlinkSync(localVideoPath); } catch {}
  try { fs.unlinkSync(localThumbPath); } catch {}

  return {
    platform,
    originalUrl,
    videoUrl,
    thumbnailUrl,
    blurhash
  };
};
