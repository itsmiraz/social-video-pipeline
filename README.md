# Social Video Downloader (Express + TypeScript)

## What it does
Single API that accepts an Instagram/Facebook/TikTok URL, resolves direct MP4 via ScrapeCreators, downloads it, uploads to S3,
extracts a thumbnail via ffmpeg, uploads thumbnail to S3, generates blurhash, and returns final URLs + hash.

## Quick start

1) Install deps
```bash
npm i
```

2) Create `.env`
```bash
cp .env.example .env
```
Fill the values (ScrapeCreators key + AWS creds + bucket + ffmpeg path).

3) Run
```bash
npm run dev
```

Server runs on: http://localhost:5000

## API

### POST /api/v1/social-media/download
Body:
```json
{ "url": "https://www.instagram.com/reel/XXXX/" }
```

Response:
```json
{
  "success": true,
  "data": {
    "platform": "instagram",
    "originalUrl": "...",
    "videoUrl": "...",
    "thumbnailUrl": "...",
    "blurhash": "..."
  }
}
```

## Notes
- You must have ffmpeg installed and set `FFMPEG_PATH`.
- If your S3 bucket is private, your CDN (AWS_CDN_BASE_URL) should point to CloudFront with access.
-
