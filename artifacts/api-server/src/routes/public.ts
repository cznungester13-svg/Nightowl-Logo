import { Router, Request, Response } from "express";

const router = Router();

// Provide full settings shape including pricing properties expected by billing.ts
export async function getOrCreateSettings() {
  return {
    id: "default",
    settings: {},
    monthlyPrice: 29.0, // Added to resolve TS2339 in billing.ts
    annualPrice: 290.0,
    updatedAt: new Date(),
  };
}

router.get("/", (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "NightOwl Logo API public endpoint is active.",
  });
});

export default router;