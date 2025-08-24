import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getTikTokUserStats } from "../controllers/authController.js";
import {
  addUserTrackedProfile,
  getUserTrackedProfiles,
  removeUserTrackedProfile,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/test/exists", authenticate, getTikTokUserStats);

router.post("/add", authenticate, addUserTrackedProfile);
router.post("/remove", authenticate, removeUserTrackedProfile);

router.get("/tracked", authenticate, getUserTrackedProfiles);

export default router;
