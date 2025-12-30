import fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import axios from "axios";
import AppError from "../errors/AppError";
import { config } from "../config";

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
});

/**
 * Uploads local file to S3 and returns PUBLIC URL.
 * - If AWS_CDN_BASE_URL is set, returns CDN URL (encoded key).
 * - Otherwise returns S3 URL (encoded key).
 */
export const uploadFileToS3 = async (
  filePath: string,
  fileKey: string,
  contentType: string
): Promise<string> => {
  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: config.aws.bucket,
      Key: fileKey, // raw key; do not encode for S3 PutObject
      Body: fileContent,
      ContentType: contentType
    };

    console.log(`[S3 Upload] Uploading: ${params.Key}`);

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const encodedKey = encodeURI(params.Key);

    const s3Url = `https://${params.Bucket}.s3.amazonaws.com/${encodedKey}`;
    const cdnUrl = config.aws.cdnBaseUrl
      ? `${config.aws.cdnBaseUrl.replace(/\/$/, "")}/${encodedKey}`
      : "";

    if (cdnUrl) {
      // Optional: HEAD check
      try {
        const resp = await axios.head(cdnUrl);
        console.log(`[CDN Check] ${resp.status} ${cdnUrl}`);
      } catch (e: any) {
        console.warn(`[CDN Check] Not reachable yet: ${cdnUrl}`, e?.response?.status || e?.message);
      }
      return cdnUrl;
    }

    return s3Url;
  } catch (err) {
    console.error("[S3 Upload] Failed:", err);
    throw new AppError(500, "Failed to upload file to S3");
  }
};
