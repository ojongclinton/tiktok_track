import NodeCache from "node-cache";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

// Register
const tokenCache = new NodeCache({ stdTTL: 300 });
export const register = async (req, res) => {
  try {
    const { oauth2User } = req.body;
    console.log("THIS IS THE USER THAT ARRIVED ", oauth2User);

    // Find user
    const user = await User.findOne({ where: { email: oauth2User.email } });
    if (user) {
      return sendSuccess(res, "User Already Registered.", 200);
    }

    if (user && !user.is_active) {
      return sendError(
        res,
        "Account is deactivated. Please contact support.",
        401
      );
    }

    // Create user
    const newUser = await User.create({
      appwrite_user_id: oauth2User.appwrite_id,
      email: oauth2User.email,
      first_name: oauth2User.firstName,
      last_name: oauth2User.lastName,
      is_active: true,
      email_verified: true,
    });

    // Remove sensitive data
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      subscriptionPlan: newUser.subscription_plan,
      subscriptionExpires: newUser.subscription_expires,
    };

    sendSuccess(
      res,
      {
        user: userResponse,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    sendError(res, "Login failed. Please try again.");
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return sendError(res, "No token provided.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendError(res, "Invalid token format.");
    }

    // Remove token from cache (if present)
    if (tokenCache.has(token)) {
      tokenCache.del(token);
    }

    // On frontend you still need to call Appwrite to delete the session
    // e.g. account.deleteSession("current")

    sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    sendError(res, "Logout failed.");
  }
};

// Get current user
export const me = async (req, res) => {
  try {
    const user = req.user;

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      subscriptionPlan: user.subscription_plan,
      subscriptionExpires: user.subscription_expires,
      emailVerified: user.email_verified,
      isActive: user.is_active,
      createdAt: user.created_at,
    };

    sendSuccess(res, userResponse, "User details retrieved successfully");
  } catch (error) {
    console.error("Get user error:", error);
    sendError(res, "Failed to get user details.");
  }
};

export const getTikTokUserStats = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res
        .status(400)
        .json({ error: "Username query parameter is required" });
    }

    const url = `https://www.tiktok.com/@${username.trim()}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return res.status(404).json({ error: "User not found" });
    }

    const html = await response.text();

    // Helper to extract JSON object after a key
    const extractJSON = (key) => {
      const regex = new RegExp(`"${key}"\\s*:\\s*(\\{.*?\\})(?=,\\s*"\\w+")`, "s");
      const match = html.match(regex);
      if (!match) return null;
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    };

    const stats = extractJSON("stats");
    const statsV2 = extractJSON("statsV2");
    const shareMeta = extractJSON("shareMeta");

    // Extract avatar URLs directly
    const extractAvatar = (key) => {
      const regex = new RegExp(`"${key}"\\s*:\\s*"(.+?)"`);
      const match = html.match(regex);
      if (!match) return null;
      return match[1].replace(/\\u002F/g, "/"); // replace escaped slashes
    };

    const avatars = {
      avatarLarger: extractAvatar("avatarLarger"),
      avatarMedium: extractAvatar("avatarMedium"),
      avatarThumb: extractAvatar("avatarThumb"),
    };

    const finalData = {
      stats,
      statsV2,
      shareMeta,
      avatars,
    };
      //TODO : When saving the user on the frontend, you can download and send file to appWrite
    sendSuccess(res, finalData, "TikTok stats fetched successfully");
  } catch (err) {
    console.error("Error fetching TikTok stats:", err);
    sendError(res, "Failed to fetch TikTok stats.");
  }
};

