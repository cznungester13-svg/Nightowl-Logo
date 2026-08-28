import { Router, Request, Response } from "express";

export const adminRouter = Router();

adminRouter.get("/admin/stats", async (_req: Request, res: Response) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default adminRouter;
