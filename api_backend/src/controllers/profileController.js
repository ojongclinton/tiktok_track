// import TikTokUser from "../models/TikTokUser.js";
// import UserTrackedProfile from "../models/UserTrackedProfile.js";
import { UserTrackedProfile, TikTokUser } from "../models/index.js";
import { addProfileToQueue } from "../redis/redisUtils.js";
import {
  fetchAnduploadProfileImageToAppWrite,
  getUserIdByAppWriteId,
} from "../utils/helpers.js";
import { sendError } from "../utils/responseHelper.js";

export const addUserTrackedProfile = async (req, res) => {
  // Implementation for adding a tracked profile for the user
  const { tiktokProfileToTrack } = req.body;
  const connectedUser = req.user;

  let connectedUserId = await getUserIdByAppWriteId(connectedUser.id);
  if (!connectedUserId) return;

  //If tiktokProfileToTrack is not provided, return error
  if (!tiktokProfileToTrack) {
    return sendError(res, "No TikTok profile provided to track.", 400);
  }

  let existingTikTokUser = null;

  //check if the TikTok profile exists in the database
  if (tiktokProfileToTrack.user_id) {
    existingTikTokUser = await TikTokUser.findOne({
      where: { user_id: tiktokProfileToTrack.user_id },
    });
  } else if (tiktokProfileToTrack.username) {
    existingTikTokUser = await TikTokUser.findOne({
      where: { username: tiktokProfileToTrack.username },
    });
  }

  if (existingTikTokUser) {
    console.log("Tiktok profile already in the system");
    //If it exists, check if the user is already tracking it
    const existingTracking = await UserTrackedProfile.findOne({
      where: {
        user_id: connectedUserId,
        profile_id: existingTikTokUser.user_id,
      },
    });

    if (existingTracking) {
      if (existingTikTokUser.is_active === false) {
        existingTikTokUser.is_active = true;
        await existingTikTokUser.save();
        return res
          .status(200)
          .json({ message: "Profile re-activated in your tracked list." });
      }

      return sendError(res, "You are already tracking this profile.", 400);
    }
    await UserTrackedProfile.create({
      user_id: connectedUserId,
      profile_id: existingTikTokUser.user_id,
      is_active: true,
    });
    return res
      .status(200)
      .json({ message: "Profile added to your tracked list." });
  } else {
    //Create the TikTokUser first
    // fetchAnduploadProfileImageToAppWrite
    let uploadedImage = null;

    if (tiktokProfileToTrack.profile_image_url) {
      uploadedImage = await fetchAnduploadProfileImageToAppWrite(
        tiktokProfileToTrack.profile_image_url,
        tiktokProfileToTrack.username
      );
    }
    const newTikTokUser = await TikTokUser.create({
      user_id: tiktokProfileToTrack.user_id,
      username: tiktokProfileToTrack.username,
      display_name: tiktokProfileToTrack.display_name || null,
      followers_count: tiktokProfileToTrack.followers_count || 0,
      following_count: tiktokProfileToTrack.following_count || 0,
      likes_count: tiktokProfileToTrack.likes_count || 0,
      video_count: tiktokProfileToTrack.video_count || 0,
      verified: tiktokProfileToTrack.verified || false,
      private_account: tiktokProfileToTrack.private_account || false,
      profile_image_url: uploadedImage ? uploadedImage.$id : null, //THe Appwrite file ID
      last_scraped: null,
      sec_uid: tiktokProfileToTrack.sec_uid || null,
      created_date: tiktokProfileToTrack.created_date || null,
    });

    //Then create the tracking record
    await UserTrackedProfile.create({
      user_id: connectedUserId,
      profile_id: newTikTokUser.user_id,
      is_active: true,
    });
    await addProfileToQueue(tiktokProfileToTrack.username, 0);
    return res
      .status(200)
      .json({ message: "Profile added to your tracked list." });
  }
};

export const removeUserTrackedProfile = async (req, res) => {
  // Implementation for removing a tracked profile for the user
  const { tiktokUserId } = req.body;
  const connectedUser = req.user;
  let connectedUserId = await getUserIdByAppWriteId(connectedUser.id);
  if (!connectedUserId) return;

  if (!tiktokUserId) {
    return sendError(res, "No TikTok user ID provided to untrack.", 400);
  }

  // Check if the tracking record exists
  const existingTracking = await UserTrackedProfile.findOne({
    where: {
      user_id: connectedUserId,
      profile_id: tiktokUserId,
      is_active: true,
    },
  });

  if (!existingTracking) {
    return sendError(res, "You are not tracking this profile.", 400);
  }

  // Soft delete by setting is_active to false
  existingTracking.is_active = false;
  await existingTracking.save();

  return res
    .status(200)
    .json({ message: "Profile removed from your tracked list." });
};

//THis route would return only the 2 last profile analysis data per profile
export const getUserTrackedProfiles = async (req, res) => {
  // Implementation for retrieving all tracked profiles for the user
  const connectedUser = req.user;
  let connectedUserId = await getUserIdByAppWriteId(connectedUser.id);
  if (!connectedUserId) {
    return res.status(404).json({ error: "User not found" });
  }
  const trackedProfiles = await UserTrackedProfile.findAll({
    where: { user_id: connectedUserId, is_active: true },
    include: [
      {
        model: TikTokUser,
        as: "profile",
      },
    ],
  });

  const response = trackedProfiles.map((tracking) => {
    const profile = tracking.profile;
    return {
      user_id: profile.user_id,
      username: profile.username,
      display_name: profile.display_name,
      followers_count: profile.follower_count,
      following_count: profile.following_count,
      likes_count: profile.likes_count,
      video_count: profile.video_count,
      verified: profile.verified,
      private_account: profile.private_account,
      profile_image_url: profile.profile_image_url,
      last_scraped: profile.last_scraped,
      sec_uid: profile.sec_uid,
      created_date: profile.created_date,
    };
  });

  return res.status(200).json({ trackedProfiles: response });
};

//Previous values for each metric would come from the latest analytics data of that tracked profile.
//since we update the profile values at each time, but only update analytics every 24 hours
//so analytics would have old data and this one ticktok_users would have the most updated data
