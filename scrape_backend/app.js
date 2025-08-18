import { writePool } from "./config/database.js";
import TikTokScrapingOrchestrator from "./TikTokScrapingOrchestrator.js";

// Configuration
const PROFILES_TO_MONITOR = [
  "mradiaa",
  "mouton146",
  "etitv",
  "travisfimmel2_",
  "le.mec.sucre",
  "manibro229"
  // Add your 30+ profiles here
];

const CONFIG = {
  database: {
    host: "localhost",
    user: "root",
    password: "",
    database: "tiktok_tracker",
    connectionLimit: 15,
  },
  redis: {
    host: "redis-18048.c14.us-east-1-3.ec2.redns.redis-cloud.com",
    port: 18048,
    password: "SShuFKNfb7dD2xGPx9rIXLYzZr1CiTsf", // Replace with the same password you used in the test
    db: 0,
    connectTimeout: 30000,
    commandTimeout: 10000,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  },
  workers: {
    count: 4, // Adjust based on your server capacity
  },
};

// Create and start the scraping system
async function main() {
  console.log("🎬 TikTok Profile Monitoring System");
  console.log("===================================");

  const orchestrator = new TikTokScrapingOrchestrator(
    PROFILES_TO_MONITOR,
    CONFIG
  );

  try {
    // Initialize system
    await orchestrator.initialize();

    // Start continuous monitoring
    await orchestrator.start();

    // The system will now run continuously
    // It will check every 10 minutes for profiles due for scraping
    // Each profile gets scraped every 2h30m from its last scrape time
  } catch (error) {
    console.error("💥 Failed to start system:", error.message);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Start the system
// if (import.meta.url === `file://${process.argv[1]}`) {
main();
// }

export default main;
