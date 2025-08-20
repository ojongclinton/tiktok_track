import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TikTokUser = sequelize.define('TikTokUser', {
  user_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    index: true
  },
  display_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  follower_count: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  following_count: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  likes_count: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  video_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  private_account: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  profile_image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_scraped: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sec_uid: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_date: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'ticktok_users',
  timestamps: false,
  indexes: [
    {
      fields: ['username']
    },
    {
      fields: ['last_scraped']
    }
  ]
});

export default TikTokUser;
