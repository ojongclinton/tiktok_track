import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Read-optimized connection pool
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    
    // Read-heavy optimization
    pool: {
      max: 15,        // More connections for reads
      min: 2,
      acquire: 30000,
      idle: 300000    // Keep connections alive longer
    },
    
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // Performance optimizations
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    
    // Query optimizations
    dialectOptions: {
      dateStrings: true,
      typeCast: true
    }
  }
);

export default sequelize;
