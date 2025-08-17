import { fork } from "child_process";
import ProfileScheduler from "./ProfileScheduler.js";
import ScraperWorker from "./ScraperWorker.js";

class TikTokScrapingOrchestrator {
  constructor(profiles, config = {}) {
    this.profiles = profiles;
    this.config = {
      database: {
        host: "localhost",
        user: "root",
        password: "",
        database: "tiktok_tracker",
        ...config.database,
      },
      redis: {
        host: "redis-18048.c14.us-east-1-3.ec2.redns.redis-cloud.com",
        port: 18048,
        password: "SShuFKNfb7dD2xGPx9rIXLYzZr1CiTsf",
        ...config.redis,
      },
      workers: {
        count: 4, // Number of worker processes
        ...config.workers,
      },
    };

    this.scheduler = null;
    this.workers = [];
    this.isRunning = false;
    this.workerProcesses = []; // For child processes if using fork
  }

  // Initialize the entire system
  async initialize() {
    try {
      console.log("🎬 Initializing TikTok Scraping System...");
      console.log(`📋 Profiles to monitor: ${this.profiles.length}`);
      console.log(`👷 Workers to spawn: ${this.config.workers.count}`);

      // Initialize scheduler
      this.scheduler = new ProfileScheduler(
        this.profiles,
        this.config.database,
        this.config.redis
      );

      await this.scheduler.initialize();

      console.log("✅ System initialization complete");
      return true;
    } catch (error) {
      console.error("❌ System initialization failed:", error.message);
      throw error;
    }
  }

  // Start the entire system
  async start() {
    if (this.isRunning) {
      console.log("⚠️ System is already running");
      return;
    }

    console.log("🚀 Starting TikTok Scraping System...");
    this.isRunning = true;

    try {
      // Start scheduler
      console.log("📅 Starting profile scheduler...");
      await this.scheduler.start();

      // Start workers
      console.log("👷 Starting worker processes...");
      await this.startWorkers();

      // Set up status reporting
      this.setupStatusReporting();

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      console.log("🎉 TikTok Scraping System started successfully!");
      console.log("📊 Use Ctrl+C to stop gracefully");
    } catch (error) {
      console.error("❌ Failed to start system:", error.message);
      await this.stop();
      throw error;
    }
  }

  // Start worker processes
  async startWorkers() {
    for (let i = 1; i <= this.config.workers.count; i++) {
      try {
        const worker = new ScraperWorker(
          i,
          this.config.database,
          this.config.redis
        );
        await worker.initialize();

        this.workers.push(worker);

        // Start worker in background
        worker.start().catch((error) => {
          console.error(`❌ Worker ${i} crashed:`, error.message);
          // Could implement auto-restart here
        });

        console.log(`✅ Worker ${i} started`);

        // Small delay between worker starts
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to start worker ${i}:`, error.message);
      }
    }

    console.log(
      `👷 ${this.workers.length}/${this.config.workers.count} workers started successfully`
    );
  }

  // Set up periodic status reporting
  setupStatusReporting() {
    this.statusInterval = setInterval(async () => {
      try {
        await this.printSystemStatus();
      } catch (error) {
        console.error("❌ Error printing status:", error.message);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  // Print comprehensive system status
  async printSystemStatus() {
    console.log("\n📊 ========== SYSTEM STATUS ==========");

    // Scheduler status
    const schedulerStatus = await this.scheduler.getStatus();
    console.log("📅 Scheduler:");
    console.log(
      `   Status: ${schedulerStatus.isRunning ? "🟢 Running" : "🔴 Stopped"}`
    );
    console.log(`   Profiles: ${schedulerStatus.profilesMonitored}`);
    console.log(
      `   Queue: ${schedulerStatus.queueStats.pending} pending, ${schedulerStatus.queueStats.processing} processing`
    );

    // Worker status
    console.log("👷 Workers:");
    for (const worker of this.workers) {
      const status = worker.getStatus();
      const statusIcon = status.isRunning ? "🟢" : "🔴";
      const currentJob = status.currentJob
        ? `scraping ${status.currentJob}`
        : "idle";
      console.log(
        `   Worker ${status.workerId}: ${statusIcon} ${currentJob} (${status.jobsCompleted} completed, ${status.successRate} success)`
      );
    }

    console.log("===================================\n");
  }

  // Set up graceful shutdown handling
  setupGracefulShutdown() {
    const gracefulShutdown = async () => {
      console.log("\n🛑 Received shutdown signal, stopping gracefully...");
      await this.stop();
      process.exit(0);
    };

    process.on("SIGINT", gracefulShutdown); // Ctrl+C
    process.on("SIGTERM", gracefulShutdown); // Docker/PM2 stop
    process.on("SIGUSR2", gracefulShutdown); // Nodemon restart
  }

  // Stop the entire system
  async stop() {
    if (!this.isRunning) {
      console.log("⚠️ System is not running");
      return;
    }

    console.log("🛑 Stopping TikTok Scraping System...");
    this.isRunning = false;

    try {
      // Clear status reporting
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
      }

      // Stop all workers
      console.log("👷 Stopping workers...");
      const workerStopPromises = this.workers.map((worker, index) => {
        console.log(`🛑 Stopping worker ${index + 1}...`);
        return worker.stop().catch((error) => {
          console.error(
            `❌ Error stopping worker ${index + 1}:`,
            error.message
          );
        });
      });

      await Promise.all(workerStopPromises);
      console.log("✅ All workers stopped");

      // Stop scheduler
      if (this.scheduler) {
        console.log("📅 Stopping scheduler...");
        await this.scheduler.stop();
        console.log("✅ Scheduler stopped");
      }

      console.log("✅ TikTok Scraping System stopped gracefully");
    } catch (error) {
      console.error("❌ Error during shutdown:", error.message);
    }
  }

  // Get overall system status
  async getSystemStatus() {
    const schedulerStatus = (await this.scheduler?.getStatus()) || {};
    const workerStatuses = this.workers.map((worker) => worker.getStatus());

    const totalJobs = workerStatuses.reduce(
      (sum, status) => sum + status.jobsCompleted,
      0
    );
    const totalFailed = workerStatuses.reduce(
      (sum, status) => sum + status.jobsFailed,
      0
    );
    const runningWorkers = workerStatuses.filter(
      (status) => status.isRunning
    ).length;

    return {
      isRunning: this.isRunning,
      scheduler: schedulerStatus,
      workers: {
        total: this.workers.length,
        running: runningWorkers,
        details: workerStatuses,
      },
      performance: {
        totalJobsCompleted: totalJobs,
        totalJobsFailed: totalFailed,
        overallSuccessRate:
          totalJobs + totalFailed > 0
            ? ((totalJobs / (totalJobs + totalFailed)) * 100).toFixed(1) + "%"
            : "N/A",
      },
    };
  }

  // Restart a specific worker
  async restartWorker(workerId) {
    console.log(`🔄 Restarting worker ${workerId}...`);

    const workerIndex = workerId - 1;
    if (workerIndex < 0 || workerIndex >= this.workers.length) {
      console.error(`❌ Invalid worker ID: ${workerId}`);
      return false;
    }

    try {
      // Stop the old worker
      await this.workers[workerIndex].stop();

      // Create and start new worker
      const newWorker = new ScraperWorker(
        workerId,
        this.config.database,
        this.config.redis
      );
      await newWorker.initialize();

      this.workers[workerIndex] = newWorker;

      // Start worker in background
      newWorker.start().catch((error) => {
        console.error(
          `❌ Restarted worker ${workerId} crashed:`,
          error.message
        );
      });

      console.log(`✅ Worker ${workerId} restarted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to restart worker ${workerId}:`, error.message);
      return false;
    }
  }

  // Add profiles to monitoring list (dynamic)
  addProfiles(newProfiles) {
    const uniqueProfiles = newProfiles.filter(
      (profile) => !this.profiles.includes(profile)
    );
    this.profiles.push(...uniqueProfiles);

    if (this.scheduler) {
      this.scheduler.profiles = this.profiles;
    }

    console.log(`📝 Added ${uniqueProfiles.length} new profiles to monitoring`);
    return uniqueProfiles.length;
  }

  // Remove profiles from monitoring list
  removeProfiles(profilesToRemove) {
    const initialCount = this.profiles.length;
    this.profiles = this.profiles.filter(
      (profile) => !profilesToRemove.includes(profile)
    );
    const removedCount = initialCount - this.profiles.length;

    if (this.scheduler) {
      this.scheduler.profiles = this.profiles;
    }

    console.log(`🗑️ Removed ${removedCount} profiles from monitoring`);
    return removedCount;
  }
}

export default TikTokScrapingOrchestrator;
