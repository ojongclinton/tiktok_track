import QueueManager from "./QueueManager.js";
import { writePool as dbPool } from "./config/database.js";

class ProfileScheduler {
  constructor(profiles, dbConfig, redisConfig = {}) {
    this.profiles = profiles; // Array of usernames to monitor
    this.dbPool = dbPool;

    this.queueManager = new QueueManager({ redis: redisConfig });
    this.isRunning = false;
    this.checkInterval = 10 * 60 * 1000; // Check every 10 minutes
    this.scrapeInterval = 150 * 60 * 1000; // 2h30m in milliseconds
  }

  // Initialize the scheduler
  async initialize() {
    try {
      console.log("🚀 Initializing Profile Scheduler...");

      // Connect to Redis
      await this.queueManager.connect();

      // Verify database connection
      const connection = await this.dbPool.getConnection();
      await connection.ping();
      connection.release();
      console.log("✅ Database connection verified");

      // Validate profiles exist or create them
      await this.ensureProfilesExist();

      console.log("✅ Profile Scheduler initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize scheduler:", error.message);
      throw error;
    }
  }

  // Ensure all profiles exist in database
  async ensureProfilesExist() {
    const connection = await this.dbPool.getConnection();
    try {
      for (const username of this.profiles) {
        const checkQuery =
          "SELECT username FROM ticktok_users WHERE username = ?";
        const [rows] = await connection.execute(checkQuery, [username]);

        if (rows.length === 0) {
          console.log(
            `📝 Profile ${username} not in database, will be added on first scrape`
          );
        }
      }

      console.log(`✅ Verified ${this.profiles.length} profiles`);
    } finally {
      connection.release();
    }
  }

  // Get profiles that are due for scraping
  // async getProfilesDueForScraping() {
  //   const connection = await this.dbPool.getConnection();
  //   try {
  //     // First, let's handle the case where we might have 0 profiles in the array
  //     if (this.profiles.length === 0) {
  //       return [];
  //     }

  //     // First query: Get ALL profiles that exist in database (regardless of last_scraped time)
  //     const existingProfilesQuery = `
  //       SELECT username, last_scraped
  //       FROM ticktok_users
  //       WHERE username IN (${this.profiles.map(() => '?').join(',')})
  //     `;
  //     const [existingProfiles] = await connection.execute(existingProfilesQuery, this.profiles);
  //     const existingUsernames = existingProfiles.map(row => row.username);

  //     // Find profiles that don't exist in database yet
  //     const newProfiles = this.profiles.filter(username =>
  //       !existingUsernames.includes(username)
  //     );

  //     // Second query: Get profiles that are DUE for scraping (exist in DB and meet time criteria)
  //     let dueProfiles = [];
  //     if (existingUsernames.length > 0) {
  //       const dueProfilesQuery = `
  //         SELECT username, last_scraped,
  //                CASE
  //                  WHEN last_scraped IS NULL THEN 'never'
  //                  ELSE TIMESTAMPDIFF(MINUTE, last_scraped, NOW())
  //                END as minutes_since_last_scrape
  //         FROM ticktok_users
  //         WHERE username IN (${existingUsernames.map(() => '?').join(',')})
  //         AND (
  //           last_scraped IS NULL
  //           OR last_scraped < NOW() - INTERVAL 150 MINUTE
  //         )
  //         ORDER BY CASE WHEN last_scraped IS NULL THEN 0 ELSE 1 END, last_scraped ASC
  //       `;
  //       const [dueRows] = await connection.execute(dueProfilesQuery, existingUsernames);
  //       dueProfiles = dueRows;
  //     }

  //     // Add new profiles to the result (they need to be scraped for first time)
  //     const newProfileRows = newProfiles.map(username => ({
  //       username,
  //       last_scraped: null,
  //       minutes_since_last_scrape: 'never'
  //     }));

  //     const allDueProfiles = [...newProfileRows, ...dueProfiles]; // Put new profiles first

  //     if (allDueProfiles.length > 0) {
  //       console.log(`📋 Found ${allDueProfiles.length} profiles due for scraping:`);
  //       allDueProfiles.forEach(profile => {
  //         const status = profile.minutes_since_last_scrape === 'never' ?
  //           'never scraped (new profile)' :
  //           `${profile.minutes_since_last_scrape} minutes ago`;
  //         console.log(`   ${profile.username} - last scraped: ${status}`);
  //       });
  //     } else {
  //       console.log(`😴 No profiles due for scraping. ${existingUsernames.length} profiles exist in DB, ${newProfiles.length} are new`);
  //       if (existingUsernames.length > 0) {
  //         console.log(`📝 Existing profiles: ${existingUsernames.join(', ')}`);
  //       }
  //       if (newProfiles.length > 0) {
  //         console.log(`📝 New profiles: ${newProfiles.join(', ')}`);
  //       }
  //     }

  //     return allDueProfiles;
  //   } catch (error) {
  //     console.error('❌ Database error in getProfilesDueForScraping:', error.message);
  //     console.error('📝 Profiles being queried:', this.profiles);

  //     // If there's a database error, return all profiles as "new" so they get processed
  //     return this.profiles.map(username => ({
  //       username,
  //       last_scraped: null,
  //       minutes_since_last_scrape: 'never'
  //     }));
  //   } finally {
  //     connection.release();
  //   }
  // }
  async getProfilesDueForScraping() {
    const connection = await this.dbPool.getConnection();
    try {
      // Get all TikTok users that have active trackers and are due for scraping
      // Using EXISTS for maximum efficiency - stops at first active match per profile
      const dueProfilesQuery = `
      SELECT 
        tu.username,
        tu.last_scraped,
        CASE 
          WHEN tu.last_scraped IS NULL THEN 'never'
          ELSE TIMESTAMPDIFF(MINUTE, tu.last_scraped, NOW())
        END as minutes_since_last_scrape
      FROM ticktok_users tu
      WHERE EXISTS (
        SELECT 1 
        FROM user_tracked_profiles utp 
        WHERE utp.profile_id = tu.user_id 
        AND utp.is_active = true
        LIMIT 1
      )
      AND (
        tu.last_scraped IS NULL 
        OR tu.last_scraped < NOW() - INTERVAL 150 MINUTE
      )
      ORDER BY 
        CASE WHEN tu.last_scraped IS NULL THEN 0 ELSE 1 END ASC,
        tu.last_scraped ASC
    `;

      const [dueProfiles] = await connection.execute(dueProfilesQuery);

      if (dueProfiles.length > 0) {
        console.log(
          `📋 Found ${dueProfiles.length} profiles due for scraping:`
        );
        dueProfiles.forEach((profile) => {
          const status =
            profile.minutes_since_last_scrape === "never"
              ? "never scraped (new profile)"
              : `${profile.minutes_since_last_scrape} minutes ago`;
          console.log(`   ${profile.username} - last scraped: ${status}`);
        });
      } else {
        console.log(`😴 No profiles due for scraping.`);

        // Optional: Get count of total actively tracked profiles
        const countQuery = `
        SELECT COUNT(DISTINCT tu.user_id) as total_tracked
        FROM ticktok_users tu
        INNER JOIN user_tracked_profiles utp ON tu.user_id = utp.profile_id
        WHERE utp.is_active = true
      `;

        const [countResult] = await connection.execute(countQuery);
        console.log(
          `📝 Total actively tracked profiles: ${
            countResult[0].total_tracked || 0
          }`
        );
      }

      return dueProfiles;
    } catch (error) {
      console.error(
        "❌ Database error in getProfilesDueForScraping:",
        error.message
      );

      // Return empty array on error
      return [];
    } finally {
      connection.release();
    }
  }

  // Add eligible profiles to the queue
  async scheduleProfiles() {
    try {
      const dueProfiles = await this.getProfilesDueForScraping();

      if (dueProfiles.length === 0) {
        console.log("😴 No profiles due for scraping at this time");
        return 0;
      }

      let addedCount = 0;
      for (const profile of dueProfiles) {
        // Priority: never scraped = 0 (highest), then by time since last scrape
        const priority =
          profile.minutes_since_last_scrape === "never"
            ? 0
            : Math.max(0, 300 - profile.minutes_since_last_scrape); // Higher priority for older scrapes

        const success = await this.queueManager.addJob(
          profile.username,
          priority
        );
        if (success) {
          addedCount++;
        }
      }

      console.log(
        `✅ Added ${addedCount}/${dueProfiles.length} profiles to scraping queue`
      );
      return addedCount;
    } catch (error) {
      console.error("❌ Error scheduling profiles:", error.message);
      return 0;
    }
  }

  // Main scheduler loop
  async start() {
    if (this.isRunning) {
      console.log("⚠️ Scheduler is already running");
      return;
    }

    console.log("🎯 Starting Profile Scheduler...");
    console.log(`   Monitoring ${this.profiles.length} profiles`);
    console.log(`   Check interval: ${this.checkInterval / 60000} minutes`);
    console.log(
      `   Scrape interval: ${this.scrapeInterval / 60000} minutes per profile`
    );

    this.isRunning = true;

    // Initial schedule check
    await this.scheduleProfiles();

    // Set up interval for scheduling
    this.schedulerInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        console.log("\n⏰ Running scheduled profile check...");

        // Add due profiles to queue
        await this.scheduleProfiles();

        // Process retry queue
        await this.queueManager.processRetryQueue();

        // Clean up stuck jobs
        await this.queueManager.cleanupStuckJobs();

        // Show queue stats
        const stats = await this.queueManager.getQueueStats();
        console.log(
          `📊 Queue stats: ${stats.pending} pending, ${stats.processing} processing, ${stats.retry} retry`
        );
      } catch (error) {
        console.error("❌ Error in scheduler loop:", error.message);
      }
    }, this.checkInterval);

    // Set up interval for queue maintenance (every 5 minutes)
    this.maintenanceInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.queueManager.processRetryQueue();
        await this.queueManager.cleanupStuckJobs();
      } catch (error) {
        console.error("❌ Error in maintenance loop:", error.message);
      }
    }, 5 * 60 * 1000);

    console.log("✅ Profile Scheduler started successfully");
  }

  // Stop the scheduler
  async stop() {
    console.log("🛑 Stopping Profile Scheduler...");

    this.isRunning = false;

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }

    await this.queueManager.disconnect();
    await this.dbPool.end();

    console.log("✅ Profile Scheduler stopped");
  }

  // Get scheduler status
  async getStatus() {
    const stats = await this.queueManager.getQueueStats();
    const nextCheck = this.schedulerInterval ? "Active" : "Stopped";

    return {
      isRunning: this.isRunning,
      profilesMonitored: this.profiles.length,
      nextCheck,
      queueStats: stats,
      checkIntervalMinutes: this.checkInterval / 60000,
      scrapeIntervalMinutes: this.scrapeInterval / 60000,
    };
  }
}

export default ProfileScheduler;
