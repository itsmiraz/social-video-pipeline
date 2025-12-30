import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { downloadSocialVideoController } from "../controllers/socialMedia.controller";

const router = Router();

router.post("/download", asyncHandler(downloadSocialVideoController));

export default router;
