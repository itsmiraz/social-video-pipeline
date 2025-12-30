import dotenv from "dotenv";
dotenv.config();

const must = (key: string) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return val;
};

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  scrapeCreatorsApiKey: must("SCRAPECREATORS_API_KEY"),

  aws: {
    region: must("AWS_REGION"),
    accessKeyId: must("AWS_ACCESS_KEY_ID"),
    secretAccessKey: must("AWS_SECRET_ACCESS_KEY"),
    bucket: must("AWS_S3_BUCKET"),
    cdnBaseUrl: process.env.AWS_CDN_BASE_URL || ""
  },

  ffmpegPath: must("FFMPEG_PATH")
};
