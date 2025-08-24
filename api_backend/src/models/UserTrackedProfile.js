import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UserTrackedProfile = sequelize.define(
  "UserTrackedProfile",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    profile_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "ticktok_users",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    added_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.NOW,
    },
  },
  {
    tableName: "user_tracked_profiles",
  }
);
//Belongs to many relationship with User
UserTrackedProfile.associate = (models) => {
  UserTrackedProfile.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
  UserTrackedProfile.belongsTo(models.TikTokUser, {
    foreignKey: "profile_id",
    as: "profile",
  });
};

export default UserTrackedProfile;

//Get all TikTokUsers that are qualified for tracking stats
//for a TikTokUser to be qualified for tracking stats
// 1) At least 1 record exist in user_tracked_profiles where the profile id is the TikTokUser id ans the is_active is true
// 2) Either the TikTokUser has never been scraped (last_scraped is null) or the last_scraped is older than 2.5 hours ago (last_scraped)
