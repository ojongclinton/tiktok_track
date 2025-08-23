import express from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validation.js";
import { authenticate } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import {
  register,
  logout,
  me,
} from "../controllers/authController.js";

const router = express.Router();


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});



router.post("/register", register);

router.post("/logout",authenticate, logout);

router.get("/me", authenticate, me);


router.get("/testAuth", generalLimiter, authenticate, (req, res) => {
  res.json({
    success: true,
    message: "TikTok Analytics API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
