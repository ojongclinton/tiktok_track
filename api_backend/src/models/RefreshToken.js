import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import crypto from 'crypto';

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  device_info: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'refresh_tokens',
  updatedAt: false
});

// Static methods
RefreshToken.generateToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Instance methods
RefreshToken.prototype.isExpired = function() {
  return Date.now() >= this.expires_at.getTime();
};

RefreshToken.prototype.isRevoked = function() {
  return this.revoked_at !== null;
};

export default RefreshToken;
