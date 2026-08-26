import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import publicRouter from "./public";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(billingRouter);
router.use(adminRouter);

export default router;
