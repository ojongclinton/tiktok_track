import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getTikTokUserStats } from "../controllers/authController.js";

const router = express.Router();

router.get("/test/exists", authenticate, getTikTokUserStats);

export default router;
