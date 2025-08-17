import TikTokScraper from './TikTokScraper.js';
import QueueManager from './QueueManager.js';
import mysql from 'mysql2/promise';

class ScraperWorker {
  constructor(workerId, dbConfig, redisConfig = {}) {
    this.workerId = workerId;
    this.isRunning = false;
    this.currentJob = null;
    this.jobsCompleted = 0;
    this.jobsFailed = 0;

    // Database connection
    this.dbPool = mysql.createPool({
      host: dbConfig.host || 'localhost',
      user: dbConfig.user || 'root',
      password: dbConfig.password || '',
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 5, // Workers need fewer connections
      queueLimit: 0,
      ...dbConfig
    });

    // Queue manager for getting jobs
    this.queueManager = new QueueManager({ redis: redisConfig });

    // TikTok scraper instance
    this.scraper = new TikTokScraper({
      headless: true, // Always headless for workers
      dbPool: this.dbPool
    });

    this.startTime = new Date();
  }

  // Initialize worker
  async initialize() {
    try {
      console.log(`🤖 Worker ${this.workerId}: Initializing...`);
      
      await this.queueManager.connect();
      
      // Test database connection
      const connection = await this.dbPool.getConnection();
      await connection.ping();
      connection.release();

      console.log(`✅ Worker ${this.workerId}: Initialized successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Worker ${this.workerId}: Initialization failed:`, error.message);
      throw error;
    }
  }

  // Update user's last_scraped timestamp
  async updateLastScraped(username) {
    const connection = await this.dbPool.getConnection();
    try {
      const query = `
        UPDATE ticktok_users 
        SET last_scraped = NOW() 
        WHERE username = ?
      `;
      await connection.execute(query, [username]);
      return true;
    } catch (error) {
      console.error(`❌ Worker ${this.workerId}: Error updating last_scraped for ${username}:`, error.message);
      return false;
    } finally {
      connection.release();
    }
  }

  // Process a single job
  async processJob(job) {
    const startTime = Date.now();
    console.log(`🎯 Worker ${this.workerId}: Starting scrape for ${job.username}`);

    try {
      // Scrape the profile
      const result = await this.scraper.scrapeProfile(job.username);

      if (result.success) {
        // Update last_scraped timestamp
        await this.updateLastScraped(job.username);
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Worker ${this.workerId}: Completed ${job.username} in ${duration.toFixed(1)}s`);
        console.log(`   Videos: ${result.videos || 0}, Music: ${result.musics || 0}, Tags: ${result.tags || 0}`);
        
        // Mark job as completed
        await this.queueManager.completeJob(job.username);
        this.jobsCompleted++;
        
        return true;
      } else {
        throw new Error(result.error || 'Scraping failed');
      }

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      console.error(`❌ Worker ${this.workerId}: Failed ${job.username} after ${duration.toFixed(1)}s:`, error.message);
      
      // Mark job as failed (will retry if under limit)
      await this.queueManager.failJob(job.username, error.message);
      this.jobsFailed++;
      
      return false;
    } finally {
      // Always cleanup browser resources
      try {
        await this.scraper.cleanup();
      } catch (cleanupError) {
        console.error(`❌ Worker ${this.workerId}: Cleanup error:`, cleanupError.message);
      }
    }
  }

  // Main worker loop
  async start() {
    if (this.isRunning) {
      console.log(`⚠️ Worker ${this.workerId}: Already running`);
      return;
    }

    console.log(`🚀 Worker ${this.workerId}: Starting worker loop`);
    this.isRunning = true;

    while (this.isRunning) {
      try {
        // Get next job from queue (blocking call with timeout)
        const job = await this.queueManager.getNextJob(30);

        if (!job) {
          // No jobs available, wait a bit
          await this.sleep(5000); // 5 seconds
          continue;
        }

        this.currentJob = job;
        
        // Add random delay to avoid all workers hitting at same time
        const delay = Math.random() * 10000 + 5000; // 5-15 seconds
        console.log(`⏳ Worker ${this.workerId}: Waiting ${(delay/1000).toFixed(1)}s before processing ${job.username}`);
        await this.sleep(delay);

        // Process the job
        await this.processJob(job);
        
        this.currentJob = null;

        // Small delay between jobs
        await this.sleep(2000);

      } catch (error) {
        console.error(`❌ Worker ${this.workerId}: Error in main loop:`, error.message);
        
        // If we had a current job, mark it as failed
        if (this.currentJob) {
          await this.queueManager.failJob(this.currentJob.username, error.message);
          this.currentJob = null;
        }

        // Wait before continuing
        await this.sleep(10000);
      }
    }

    console.log(`🛑 Worker ${this.workerId}: Stopped`);
  }

  // Stop the worker
  async stop() {
    console.log(`🛑 Worker ${this.workerId}: Stopping...`);
    this.isRunning = false;

    // If currently processing a job, let it finish
    if (this.currentJob) {
      console.log(`⏳ Worker ${this.workerId}: Waiting for current job to finish...`);
      // Could add timeout here if needed
    }

    await this.queueManager.disconnect();
    await this.dbPool.end();
    
    console.log(`✅ Worker ${this.workerId}: Stopped successfully`);
  }

  // Get worker status
  getStatus() {
    const uptime = Date.now() - this.startTime.getTime();
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(1);
    
    return {
      workerId: this.workerId,
      isRunning: this.isRunning,
      currentJob: this.currentJob?.username || null,
      jobsCompleted: this.jobsCompleted,
      jobsFailed: this.jobsFailed,
      successRate: this.jobsCompleted + this.jobsFailed > 0 ? 
        ((this.jobsCompleted / (this.jobsCompleted + this.jobsFailed)) * 100).toFixed(1) + '%' : 'N/A',
      uptimeHours: uptimeHours + 'h',
      startTime: this.startTime.toISOString()
    };
  }

  // Helper method for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ScraperWorker;
