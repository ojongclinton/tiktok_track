import sequelize from "../config/database.js";
import User from "./User.js";
import TikTokUser from "./TikTokUser.js";
import UserTrackedProfile from "./UserTrackedProfile.js";
import TikTokUserAnalysis from "./TikTokUserAnalysis.js";

// User tracking relationships (many-to-many)
User.belongsToMany(TikTokUser, {
  through: "user_tracked_profiles",
  foreignKey: "user_id",
  otherKey: "profile_id",
  as: "trackedProfiles",
});

TikTokUser.belongsToMany(User, {
  through: "user_tracked_profiles",
  foreignKey: "profile_id",
  otherKey: "user_id",
  as: "trackedBy",
});

TikTokUser.hasMany(UserTrackedProfile, {
  foreignKey: "profile_id",
  as: "trackedByUsers",
});

UserTrackedProfile.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});
UserTrackedProfile.belongsTo(TikTokUser, {
  foreignKey: "profile_id",
  as: "profile",
});

TikTokUserAnalysis.belongsTo(TikTokUser, {
  foreignKey: "ticktok_user_id",
  as: "profile",
});

TikTokUser.hasMany(TikTokUserAnalysis, {
  foreignKey: "user_id",
  as: "profile",
});

const models = {
  TikTokUser,
  User,
  UserTrackedProfile,
  TikTokUserAnalysis,
  sequelize,
};

export default models;
export { TikTokUser, User, UserTrackedProfile, TikTokUserAnalysis, sequelize };
