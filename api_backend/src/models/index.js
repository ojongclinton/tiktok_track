import sequelize from '../config/database.js';
import User from './User.js';
import RefreshToken from './RefreshToken.js';
import TikTokUser from './TikTokUser.js';
import TikTokVideo from './TikTokVideo.js';
import TikTokAnalytics from './TikTokAnalytics.js';
import TikTokMusic from './TikTokMusic.js';
import TikTokTag from './TikTokTag.js';

// User and RefreshToken associations
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens'
});

RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// TikTok data associations
TikTokUser.hasMany(TikTokVideo, {
  foreignKey: 'ticktok_user_id',
  as: 'videos'
});

TikTokVideo.belongsTo(TikTokUser, {
  foreignKey: 'ticktok_user_id',
  as: 'tikTokUser'
});

TikTokVideo.hasMany(TikTokAnalytics, {
  foreignKey: 'video_id',
  sourceKey: 'video_id',
  as: 'analytics'
});

TikTokAnalytics.belongsTo(TikTokVideo, {
  foreignKey: 'video_id',
  targetKey: 'video_id',
  as: 'video'
});

TikTokVideo.belongsTo(TikTokMusic, {
  foreignKey: 'music_id',
  as: 'music'
});

TikTokMusic.hasMany(TikTokVideo, {
  foreignKey: 'music_id',
  as: 'videos'
});

// User tracking relationships (many-to-many)
User.belongsToMany(TikTokUser, {
  through: 'user_tracked_profiles',
  foreignKey: 'user_id',
  otherKey: 'tiktok_user_id',
  as: 'trackedProfiles'
});

TikTokUser.belongsToMany(User, {
  through: 'user_tracked_profiles',
  foreignKey: 'tiktok_user_id',
  otherKey: 'user_id',
  as: 'trackedBy'
});

const models = {
  User,
  RefreshToken,
  TikTokUser,
  TikTokVideo,
  TikTokAnalytics,
  TikTokMusic,
  TikTokTag,
  sequelize
};

export default models;
export {
  User,
  RefreshToken,
  TikTokUser,
  TikTokVideo,
  TikTokAnalytics,
  TikTokMusic,
  TikTokTag,
  sequelize
};
