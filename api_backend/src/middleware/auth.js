import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { sendError } from "../utils/responseHelper.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import NodeCache from "node-cache";
import { Client, Account } from "node-appwrite";

const tokenCache = new NodeCache({ stdTTL: 300 });

const client = new Client();
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("68a613ec0030e36f4f46");

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Check cache first
    const cachedUser = tokenCache.get(token);
    if (cachedUser) {
      console.log("Found user in cache !!!")
      console.log(cachedUser)
      req.user = {...cachedUser,id: cachedUser.$id};
      return next();
    }

    // If not in cache, verify with Appwrite
    client.setJWT(token);
    const account = new Account(client);
    const user = await account.get();

    // Cache the result
    tokenCache.set(token, user);

    req.user = {...user,id: user.$id};
    next();
  } catch (err) {
    console.error("Authentication failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const checkSubscription = (requiredPlan = "free") => {
  return (req, res, next) => {
    const user = req.user;

    const planLevels = { free: 1, pro: 2, agency: 3 };
    const userLevel = planLevels[user.subscription_plan] || 0;
    const requiredLevel = planLevels[requiredPlan] || 0;

    if (userLevel < requiredLevel) {
      return sendError(
        res,
        "Upgrade your subscription to access this feature.",
        403
      );
    }

    // Check if subscription is expired (except for free tier)
    if (
      user.subscription_plan !== "free" &&
      user.subscription_expires &&
      new Date() > user.subscription_expires
    ) {
      return sendError(res, "Your subscription has expired.", 403);
    }

    next();
  };
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: {
          exclude: [
            "password",
            "password_reset_token",
            "email_verification_token",
          ],
        },
      });

      if (user && user.is_active) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};
