import { Request, Response, NextFunction } from "express";
import AppError from "./AppError";
import { ZodError } from "zod";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      issues: err.issues
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  console.error("❌ Unhandled error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
