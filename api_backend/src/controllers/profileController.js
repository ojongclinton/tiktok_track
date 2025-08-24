// import TikTokUser from "../models/TikTokUser.js";
// import UserTrackedProfile from "../models/UserTrackedProfile.js";
import { Op } from "sequelize";
import {
  UserTrackedProfile,
  TikTokUser,
  TikTokUserAnalysis,
  sequelize,
} from "../models/index.js";
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
// export const getUserTrackedProfiles = async (req, res) => {
//   // Implementation for retrieving all tracked profiles for the user
//   const connectedUser = req.user;
//   let connectedUserId = await getUserIdByAppWriteId(connectedUser.id);
//   if (!connectedUserId) {
//     return res.status(404).json({ error: "User not found" });
//   }
//   const trackedProfiles = await UserTrackedProfile.findAll({
//     where: { user_id: connectedUserId, is_active: true },
//     include: [
//       {
//         model: TikTokUser,
//         as: "profile",
//       },
//     ],
//   });

// const response = await Promise.all(
//   trackedProfiles.map(async (tracking) => {
//     const profile = tracking.profile;
//     if (!profile) return null;

//     // latest analysis row
//     const analysis = await TikTokUserAnalysis.findOne({
//       where: { ticktok_user_id: profile.user_id },
//       order: [["recorded_at", "DESC"]],
//     });

//     return {
//       user_id: profile.user_id,
//       username: profile.username,
//       display_name: profile.display_name,
//       followers_count: profile.follower_count,
//       following_count: profile.following_count,
//       likes_count: profile.likes_count,
//       video_count: profile.video_count,
//       verified: profile.verified,
//       private_account: profile.private_account,
//       profile_image_url: profile.profile_image_url,
//       last_scraped: profile.last_scraped,
//       sec_uid: profile.sec_uid,
//       created_date: profile.created_date,

//       // new field
//       analysis: analysis
//         ? {
//             follower_count: analysis.follower_count,
//             following_count: analysis.following_count,
//             total_likes: analysis.total_likes,
//             video_count: analysis.video_count,
//             recorded_at: analysis.recorded_at,
//           }
//         : null,
//     };
//   })
// );

// return res.status(200).json({ trackedProfiles: response.filter(Boolean) });
// };

export const getUserTrackedProfiles = async (req, res) => {
  try {
    const connectedUser = req.user;
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "username",
      sortOrder = "ASC",
    } = req.query;

    // Get user ID once
    const connectedUserId = await getUserIdByAppWriteId(connectedUser.id);
    if (!connectedUserId) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build search condition
    const searchCondition = search
      ? {
          [Op.or]: [
            { "$profile.username$": { [Op.iLike]: `%${search}%` } },
            { "$profile.display_name$": { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Step 1: Get tracked profiles with basic info
    const { rows: trackedProfiles, count: totalCount } =
      await UserTrackedProfile.findAndCountAll({
        where: {
          user_id: connectedUserId,
          is_active: true,
          ...searchCondition,
        },
        include: [
          {
            model: TikTokUser,
            as: "profile",
            required: true, // INNER JOIN to exclude null profiles
          },
        ],
        order: [[{ model: TikTokUser, as: "profile" }, sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true,
      });

    // Step 2: Get latest analysis for each profile in a single optimized query
    const profileIds = trackedProfiles.map((tp) => tp.profile.user_id);

    let latestAnalyses = [];
    if (profileIds.length > 0) {
      latestAnalyses = await sequelize.query(
        `
        SELECT a1.*
        FROM ticktok_user_analytics a1
        INNER JOIN (
          SELECT ticktok_user_id, MAX(recorded_at) as max_recorded_at
          FROM ticktok_user_analytics
          WHERE ticktok_user_id IN (:profileIds)
          GROUP BY ticktok_user_id
        ) a2 ON a1.ticktok_user_id = a2.ticktok_user_id 
        AND a1.recorded_at = a2.max_recorded_at
      `,
        {
          replacements: { profileIds },
          type: sequelize.QueryTypes.SELECT,
        }
      );
    }

    // Create a map for quick lookup
    const analysisMap = latestAnalyses.reduce((map, analysis) => {
      map[analysis.ticktok_user_id] = analysis;
      return map;
    }, {});

    // Step 3: Transform the results using the analysis map
    const response = trackedProfiles.map((tracking) => {
      const profile = tracking.profile;
      const latestAnalysis = analysisMap[profile.user_id] || null;

      return {
        user_id: profile.user_id,
        username: profile.username,
        display_name: profile.display_name,
        followers_count: profile.follower_count,
        previous_followers_count: latestAnalysis.follower_count
          ? latestAnalysis.follower_count
          : profile.follower_count,
        following_count: profile.following_count,
        previous_following_count: latestAnalysis.following_count
          ? latestAnalysis.following_count
          : profile.following_count,
        likes_count: profile.likes_count,
        previous_likes_count: latestAnalysis.total_likes
          ? latestAnalysis.total_likes
          : profile.likes_count,
        video_count: profile.video_count,
        previous_video_count: latestAnalysis.video_count
          ? latestAnalysis.video_count
          : profile.video_count,
        verified: profile.verified,
        private_account: profile.private_account,
        profile_image_url: profile.profile_image_url,
        last_scraped: profile.last_scraped,
        sec_uid: profile.sec_uid,
        created_date: profile.created_date,
        // analysis: latestAnalysis
        //   ? {
        //       follower_count: latestAnalysis.follower_count,
        //       following_count: latestAnalysis.following_count,
        //       total_likes: latestAnalysis.total_likes,
        //       video_count: latestAnalysis.video_count,
        //       recorded_at: latestAnalysis.recorded_at,
        //     }
        //   : null,
      };
    });

    return res.status(200).json({
      trackedProfiles: response,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount: totalCount,
        hasNextPage: offset + response.length < totalCount,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching tracked profiles:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//Previous values for each metric would come from the latest analytics data of that tracked profile.
//since we update the profile values at each time, but only update analytics every 24 hours
//so analytics would have old data and this one ticktok_users would have the most updated data
