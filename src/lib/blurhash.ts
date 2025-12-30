import fs from "fs";
import sharp from "sharp";
import { encode } from "blurhash";
import AppError from "../errors/AppError";

export const getBlurHashFromFile = async (imagePath: string): Promise<string> => {
  try {
    const buf = fs.readFileSync(imagePath);

    const { data, info } = await sharp(buf)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch (err) {
    console.error("[BlurHash] Failed:", err);
    throw new AppError(500, "Failed to generate blur hash");
  }
};
