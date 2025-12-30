import { Request, Response } from "express";
import { z } from "zod";
import { downloadAndProcessSocialVideo } from "../services/socialMedia.service";

const bodySchema = z.object({
  url: z.string().url()
});

export const downloadSocialVideoController = async (req: Request, res: Response) => {
  const { url } = bodySchema.parse(req.body);

  const result = await downloadAndProcessSocialVideo({ originalUrl: url });

  return res.status(200).json({
    success: true,
    data: result
  });
};
