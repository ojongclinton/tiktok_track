// config/database.js
// const mysql = require('mysql2/promise');
import mysql from 'mysql2/promise';

const baseConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tiktok_tracker',
  charset: 'utf8mb4',
  timezone: 'local',
  acquireTimeout: 30000,
  reconnect: true
};

// Read-heavy pool (for frontend API)
export const readPool = mysql.createPool({
  ...baseConfig,
  connectionLimit: 15,        // More connections for concurrent users
  queueLimit: 50,            // Allow more queued requests
  timeout: 60000,            // Longer timeout for complex analytics
  idleTimeout: 300000        // Keep connections alive longer
});

// Write-heavy pool (for scraper workers)
export const writePool = mysql.createPool({
  ...baseConfig,
  connectionLimit: 5,         // Fewer but dedicated connections
  queueLimit: 20,            // Smaller queue
  timeout: 15000,            // Fail fast for writes
  idleTimeout: 60000         // Shorter idle time
});

// module.exports = {
//   readPool,
//   writePool
// };
