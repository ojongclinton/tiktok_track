import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TikTokUserAnalysis = sequelize.define(
  "TikTokUserAnalytics",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    ticktok_user_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    follower_count: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    following_count: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    total_likes: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    video_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    recorded_at: {
      type: DataTypes.DATE,
      defaultValue: false,
    },
  },
  {
    tableName: "ticktok_user_analytics",
    timestamps: false,
    indexes: [
      {
        fields: ["recorded_at"],
      },
    ],
  }
);

export default TikTokUserAnalysis;
