const axios = require("axios");
const mysql = require("mysql2/promise");
const pLimit = require("p-limit");
const winston = require("winston");
const cheerio = require("cheerio");
const fs = require("fs").promises;

// ✅ CORRECT: Logger should only contain logging configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "scraper.log" }),
  ],
});

class TikTokScraper {
  constructor(config = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 10,
      requestDelay: config.requestDelay || 500,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 10000,
      ...config,
    };

    // Rate limiting
    this.limiter = pLimit(this.config.maxConcurrent);

    // Database connection pool
    this.dbPool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "scraper_user",
      password: process.env.DB_PASSWORD || "your_password",
      database: process.env.DB_NAME || "tiktok_scraper",
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
    });

    // Request statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      startTime: Date.now(),
    };

    // Realistic browser headers with rotation
    this.userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0",
    ];

    this.acceptLanguages = [
      "en-US,en;q=0.9",
      "en-US,en;q=0.8,es;q=0.7",
      "en-US,en;q=0.9,fr;q=0.8",
      "en-GB,en;q=0.9,en-US;q=0.8",
    ];

    // Session persistence
    this.sessionData = {
      cookies: new Map(),
      lastRequestTime: 0,
      requestCount: 0,
    };

    // Create axios instance
    this.axiosInstance = axios.create({
      timeout: this.config.timeout,
      maxRedirects: 5,
      withCredentials: true,
      validateStatus: (status) => status < 500,
    });

    this.setupRequestInterceptors();
  }

  // ✅ CORRECT: Methods belong in the class
  setupRequestInterceptors() {
    // Request interceptor - randomize headers and add natural delays
    this.axiosInstance.interceptors.request.use(async (config) => {
      // Randomize user agent
      const randomUA =
        this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      const randomLang =
        this.acceptLanguages[
          Math.floor(Math.random() * this.acceptLanguages.length)
        ];

      // Build realistic headers
      config.headers = {
        "User-Agent": randomUA,
        Accept: this.getRandomAcceptHeader(config.url),
        "Accept-Language": randomLang,
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Ch-Ua": this.generateSecChUa(randomUA),
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": this.getPlatformFromUA(randomUA),
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        DNT: "1",
        ...config.headers,
      };

      // Add referer for non-initial requests
      if (this.sessionData.requestCount > 0) {
        config.headers["Referer"] = "https://www.tiktok.com/";
      }

      // Add cookies if we have them
      if (this.sessionData.cookies.size > 0) {
        const cookieString = Array.from(this.sessionData.cookies.entries())
          .map(([key, value]) => `${key}=${value}`)
          .join("; ");
        config.headers["Cookie"] = cookieString;
      }

      this.sessionData.requestCount++;
      return config;
    });

    // Response interceptor - handle cookies and rate limiting
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Extract and store cookies
        const setCookieHeaders = response.headers["set-cookie"];
        if (setCookieHeaders) {
          setCookieHeaders.forEach((cookie) => {
            const [nameValue] = cookie.split(";");
            const [name, value] = nameValue.split("=");
            if (name && value) {
              this.sessionData.cookies.set(name.trim(), value.trim());
            }
          });
        }
        return response;
      },
      (error) => {
        // Handle rate limiting
        if (error.response?.status === 429) {
          logger.warn("Rate limited, extending delay...");
        }
        return Promise.reject(error);
      }
    );
  }

  // Generate realistic Sec-Ch-Ua header
  generateSecChUa(userAgent) {
    if (userAgent.includes("Chrome/120")) {
      return '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
    } else if (userAgent.includes("Chrome/119")) {
      return '"Not_A Brand";v="8", "Chromium";v="119", "Google Chrome";v="119"';
    } else if (userAgent.includes("Firefox")) {
      return "";
    }
    return '"Not_A Brand";v="8", "Chromium";v="120"';
  }

  // Extract platform from user agent
  getPlatformFromUA(userAgent) {
    if (userAgent.includes("Windows")) return '"Windows"';
    if (userAgent.includes("Macintosh")) return '"macOS"';
    if (userAgent.includes("Linux")) return '"Linux"';
    return '"Windows"';
  }

  // Get appropriate Accept header based on request type
  getRandomAcceptHeader(url) {
    const accepts = [
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    ];
    return accepts[Math.floor(Math.random() * accepts.length)];
  }

  // Intelligent delay with jitter and behavioral patterns
  async smartDelay() {
    const baseDelay = this.config.requestDelay;

    // Add human-like randomization (±30%)
    const jitter = (Math.random() - 0.5) * 0.6 * baseDelay;

    // Occasional longer pauses to simulate human reading/thinking
    const longPause = Math.random() < 0.1 ? Math.random() * 3000 + 1000 : 0;

    // Slow down if making many requests (simulate fatigue)
    const fatigueMultiplier =
      this.sessionData.requestCount > 100
        ? 1 + (this.sessionData.requestCount - 100) / 500
        : 1;

    const totalDelay =
      Math.max(200, baseDelay + jitter + longPause) * fatigueMultiplier;

    this.sessionData.lastRequestTime = Date.now();
    return new Promise((resolve) => setTimeout(resolve, totalDelay));
  }

  // Simulate mouse movement and page interactions
  async simulateHumanBehavior() {
    // Occasionally simulate longer page view times
    if (Math.random() < 0.15) {
      const viewTime = Math.random() * 5000 + 2000; // 2-7 seconds
      logger.debug(`Simulating page view for ${viewTime}ms`);
      await this.delay(viewTime);
    }

    // Simulate scroll behavior with multiple small delays
    if (Math.random() < 0.2) {
      for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        await this.delay(Math.random() * 500 + 200);
      }
    }
  }

  // Utility delay function
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generic request method with enhanced anti-detection
  async makeRequest(url, options = {}, retries = 0) {
    try {
      this.stats.totalRequests++;

      // Smart delay with human-like patterns
      await this.smartDelay();

      // Occasionally simulate human behavior
      if (this.stats.totalRequests > 1) {
        await this.simulateHumanBehavior();
      }

      const response = await this.axiosInstance.get(url, options);

      // Handle different response status codes
      if (response.status === 200) {
        this.stats.successfulRequests++;
        return response.data;
      } else if (response.status === 403 || response.status === 429) {
        // Exponential backoff for rate limiting/blocking
        throw new Error(
          `Request blocked (${response.status}): Rate limited or detected`
        );
      } else if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.stats.successfulRequests++;
      return response.data;
    } catch (error) {
      this.stats.failedRequests++;

      if (retries < this.config.maxRetries) {
        // Progressive backoff with randomization
        const backoffDelay = Math.min(
          30000,
          1000 * Math.pow(2, retries) + Math.random() * 1000
        );

        logger.warn(
          `Request failed, retrying (${retries + 1}/${
            this.config.maxRetries
          }) after ${backoffDelay}ms: ${url}`
        );

        // Reset session occasionally on repeated failures
        if (retries === Math.floor(this.config.maxRetries / 2)) {
          logger.info("Resetting session due to repeated failures");
          this.sessionData.cookies.clear();
          this.sessionData.requestCount = 0;
        }

        await this.delay(backoffDelay);
        return this.makeRequest(url, options, retries + 1);
      }

      logger.error(
        `Request failed after ${this.config.maxRetries} retries: ${url} - ${error.message}`
      );
      throw error;
    }
  }

  // Scrape user profile data with enhanced stealth
  async scrapeUserProfile(username) {
    return this.limiter(async () => {
      try {
        logger.info(`Scraping user profile: ${username}`);

        // Sometimes visit the main page first to establish session
        if (this.sessionData.requestCount === 0 || Math.random() < 0.1) {
          logger.debug("Establishing session by visiting main page first");
          try {
            await this.makeRequest("https://www.tiktok.com/");
            await this.delay(Math.random() * 2000 + 1000); // Wait 1-3 seconds
          } catch (e) {
            logger.debug("Failed to establish session, continuing anyway");
          }
        }

        // TikTok user profile URL
        const url = `https://www.tiktok.com/@${username}`;

        // Add random query parameters sometimes (like analytics tracking)
        const shouldAddParams = Math.random() < 0.3;
        const finalUrl = shouldAddParams
          ? `${url}?_t=${Date.now()}&_r=${Math.floor(Math.random() * 1000)}`
          : url;

        const html = await this.makeRequest(finalUrl);

        // Simulate reading time before processing
        await this.delay(Math.random() * 1000 + 500);

        // Parse HTML (if scraping from web) or JSON (if using API)
        // const $ = cheerio.load(html);

        // Mock data for example - replace with actual parsing logic
        const userData = {
          user_id: Math.floor(Math.random() * 9999999) + 1000000,
          username: username,
          display_name: `Display ${username}`,
          bio: `Bio for ${username}`,
          follower_count: Math.floor(Math.random() * 100000) + 1000,
          following_count: Math.floor(Math.random() * 1000) + 100,
          likes_count: Math.floor(Math.random() * 1000000) + 10000,
          video_count: Math.floor(Math.random() * 80) + 20,
          verified: Math.random() > 0.8,
          private_account: false,
          profile_image_url: `https://example.com/profile/${username}.jpg`,
          last_scraped: new Date(),
        };

        // Store in database
        await this.insertUser(userData);

        logger.info(`Successfully scraped user: ${username}`);
        return userData;
      } catch (error) {
        logger.error(`Failed to scrape user ${username}: ${error.message}`);
        throw error;
      }
    });
  }

  // Scrape video data with anti-detection
  async scrapeVideoData(videoId, userId = null) {
    return this.limiter(async () => {
      try {
        logger.info(`Scraping video: ${videoId}`);

        // Vary the approach to accessing videos
        const approaches = [
          `https://www.tiktok.com/video/${videoId}`,
          `https://www.tiktok.com/@unknown/video/${videoId}`, // Sometimes works even without username
        ];

        const url = approaches[Math.floor(Math.random() * approaches.length)];

        // Add tracking parameters occasionally
        const hasParams = Math.random() < 0.4;
        const finalUrl = hasParams
          ? `${url}?refer=embed&referer_url=&referer_video_id=${videoId}`
          : url;

        // Sometimes come from a user profile (simulate natural browsing)
        const customHeaders = {};
        if (Math.random() < 0.3) {
          customHeaders["Referer"] = `https://www.tiktok.com/@user_${Math.floor(
            Math.random() * 1000
          )}`;
        }

        await this.delay(Math.random() * 1000 + 300); // Variable delay

        const videoData = {
          video_id: videoId,
          user_id: userId || Math.floor(Math.random() * 9999999) + 1000000,
          description: `Video description for ${videoId}`,
          view_count: Math.floor(Math.random() * 1000000) + 1000,
          like_count: Math.floor(Math.random() * 50000) + 100,
          comment_count: Math.floor(Math.random() * 1000) + 10,
          share_count: Math.floor(Math.random() * 500) + 5,
          duration_ms: Math.floor(Math.random() * 45000) + 15000,
          video_url: `https://example.com/video/${videoId}`,
          cover_image_url: `https://example.com/cover/${videoId}.jpg`,
          created_at: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
          scraped_at: new Date(),
        };

        // Store in database
        await this.insertVideo(videoData);

        logger.info(`Successfully scraped video: ${videoId}`);
        return videoData;
      } catch (error) {
        logger.error(`Failed to scrape video ${videoId}: ${error.message}`);
        throw error;
      }
    });
  }

  // Scrape video comments
  async scrapeVideoComments(videoId, limit = 100) {
    return this.limiter(async () => {
      try {
        logger.info(`Scraping comments for video: ${videoId}`);

        // Mock implementation - replace with actual API calls
        await this.delay(Math.random() * 2000 + 1000);

        const commentCount = Math.floor(Math.random() * 200) + 50;
        logger.info(`Scraped ${commentCount} comments for video: ${videoId}`);

        return { video_id: videoId, comments_scraped: commentCount };
      } catch (error) {
        logger.error(
          `Failed to scrape comments for video ${videoId}: ${error.message}`
        );
        throw error;
      }
    });
  }

  // Database operations
  async insertUser(userData) {
    const connection = await this.dbPool.getConnection();
    try {
      const query = `
                INSERT INTO users (user_id, username, display_name, bio, follower_count, 
                                 following_count, likes_count, video_count, verified, 
                                 private_account, profile_image_url, last_scraped)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    follower_count = VALUES(follower_count),
                    following_count = VALUES(following_count),
                    likes_count = VALUES(likes_count),
                    video_count = VALUES(video_count),
                    last_scraped = VALUES(last_scraped)
            `;

      const values = [
        userData.user_id,
        userData.username,
        userData.display_name,
        userData.bio,
        userData.follower_count,
        userData.following_count,
        userData.likes_count,
        userData.video_count,
        userData.verified,
        userData.private_account,
        userData.profile_image_url,
        userData.last_scraped,
      ];

      await connection.execute(query, values);
    } finally {
      connection.release();
    }
  }

  async insertVideo(videoData) {
    const connection = await this.dbPool.getConnection();
    try {
      const query = `
                INSERT INTO videos (video_id, user_id, description, view_count, 
                                  like_count, comment_count, share_count, duration_ms,
                                  video_url, cover_image_url, created_at, scraped_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    view_count = VALUES(view_count),
                    like_count = VALUES(like_count),
                    comment_count = VALUES(comment_count),
                    share_count = VALUES(share_count),
                    scraped_at = VALUES(scraped_at)
            `;

      const values = [
        videoData.video_id,
        videoData.user_id,
        videoData.description,
        videoData.view_count,
        videoData.like_count,
        videoData.comment_count,
        videoData.share_count,
        videoData.duration_ms,
        videoData.video_url,
        videoData.cover_image_url,
        videoData.created_at,
        videoData.scraped_at,
      ];

      await connection.execute(query, values);
    } finally {
      connection.release();
    }
  }

  // Batch scraping methods
  async scrapeMultipleUsers(usernames) {
    logger.info(
      `Starting to scrape ${usernames.length} users with ${this.config.maxConcurrent} concurrent requests`
    );

    const promises = usernames.map((username) =>
      this.scrapeUserProfile(username)
    );

    try {
      const results = await Promise.allSettled(promises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      logger.info(
        `User scraping completed: ${successful} successful, ${failed} failed`
      );
      return results;
    } catch (error) {
      logger.error(`Batch user scraping failed: ${error.message}`);
      throw error;
    }
  }

  async scrapeMultipleVideos(videoIds) {
    logger.info(
      `Starting to scrape ${videoIds.length} videos with ${this.config.maxConcurrent} concurrent requests`
    );

    const promises = videoIds.map((videoId) => this.scrapeVideoData(videoId));

    try {
      const results = await Promise.allSettled(promises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      logger.info(
        `Video scraping completed: ${successful} successful, ${failed} failed`
      );
      return results;
    } catch (error) {
      logger.error(`Batch video scraping failed: ${error.message}`);
      throw error;
    }
  }

  // Analytics and engagement calculations
  async calculateDailyEngagement() {
    const connection = await this.dbPool.getConnection();
    try {
      logger.info("Calculating daily engagement rates...");

      // Calculate and store daily video analytics
      const videoAnalyticsQuery = `
                INSERT INTO video_analytics_daily (
                    video_id, date, view_count, like_count, comment_count, share_count,
                    total_engagement, engagement_rate_by_views
                )
                SELECT 
                    v.video_id,
                    CURDATE() as date,
                    v.view_count,
                    v.like_count,
                    v.comment_count,
                    v.share_count,
                    (v.like_count + v.comment_count + v.share_count) as total_engagement,
                    CASE 
                        WHEN v.view_count > 0 
                        THEN ((v.like_count + v.comment_count + v.share_count) / v.view_count * 100)
                        ELSE 0 
                    END as engagement_rate_by_views
                FROM videos v
                ON DUPLICATE KEY UPDATE
                    view_count = VALUES(view_count),
                    like_count = VALUES(like_count),
                    comment_count = VALUES(comment_count),
                    share_count = VALUES(share_count),
                    total_engagement = VALUES(total_engagement),
                    engagement_rate_by_views = VALUES(engagement_rate_by_views)
            `;

      await connection.execute(videoAnalyticsQuery);
      logger.info("Daily engagement rates calculated successfully");
    } finally {
      connection.release();
    }
  }

  // Progress monitoring
  printStats() {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const requestsPerSecond = this.stats.totalRequests / runtime;

    logger.info(`
=== Scraping Statistics ===
Runtime: ${runtime.toFixed(2)} seconds
Total Requests: ${this.stats.totalRequests}
Successful: ${this.stats.successfulRequests}
Failed: ${this.stats.failedRequests}
Success Rate: ${(
      (this.stats.successfulRequests / this.stats.totalRequests) *
      100
    ).toFixed(2)}%
Requests/Second: ${requestsPerSecond.toFixed(2)}
        `);
  }

  // Cleanup
  async close() {
    await this.dbPool.end();
    logger.info("Database connections closed");
  }
}

// Main execution function with optimized flow
async function main() {
  const scraper = new TikTokScraper({
    maxConcurrent: 5, // Reduced for stealth
    requestDelay: 800, // Increased base delay
    maxRetries: 5, // More retries for resilience
  });

  try {
    // Sample data for your 100 users × 45 videos scenario
    const sampleUsernames = ["lovablequeen50", "righttouchfashionacademy"];
    const sampleVideoIds = Array.from(
      { length: 4500 },
      (_, i) => `video_${String(i + 1).padStart(5, "0")}`
    );

    logger.info(
      "Starting TikTok scraping process with enhanced anti-detection..."
    );
    const startTime = Date.now();

    // Warm-up phase: establish session
    logger.info("Warm-up: Establishing session...");
    try {
      await scraper.makeRequest("https://www.tiktok.com/");
      await scraper.delay(2000);
    } catch (e) {
      logger.debug("Warm-up failed, continuing anyway");
    }

    // Phase 1: Scrape user profiles with batching
    logger.info("Phase 1: Scraping user profiles...");
    const userBatchSize = 20; // Process in smaller batches
    for (let i = 0; i < sampleUsernames.length; i += userBatchSize) {
      const batch = sampleUsernames.slice(i, i + userBatchSize);
      logger.info(
        `Processing user batch ${Math.floor(i / userBatchSize) + 1}/${Math.ceil(
          sampleUsernames.length / userBatchSize
        )}`
      );

      await scraper.scrapeMultipleUsers(batch);

      // Longer pause between batches to avoid detection
      if (i + userBatchSize < sampleUsernames.length) {
        const batchPause = Math.random() * 10000 + 5000; // 5-15 seconds
        logger.info(
          `Pausing ${(batchPause / 1000).toFixed(1)}s between user batches...`
        );
        await scraper.delay(batchPause);
      }
    }

    // // Phase 2: Scrape video data with batching
    // logger.info('Phase 2: Scraping video data...');
    // const videoBatchSize = 50; // Larger batches for videos as they're less sensitive
    // for (let i = 0; i < sampleVideoIds.length; i += videoBatchSize) {
    //     const batch = sampleVideoIds.slice(i, i + videoBatchSize);
    //     logger.info(`Processing video batch ${Math.floor(i/videoBatchSize) + 1}/${Math.ceil(sampleVideoIds.length/videoBatchSize)}`);

    //     await scraper.scrapeMultipleVideos(batch);

    //     // Moderate pause between video batches
    //     if (i + videoBatchSize < sampleVideoIds.length) {
    //         const batchPause = Math.random() * 5000 + 3000; // 3-8 seconds
    //         logger.info(`Pausing ${(batchPause/1000).toFixed(1)}s between video batches...`);
    //         await scraper.delay(batchPause);
    //     }
    // }

    // // Phase 3: Calculate engagement metrics
    // logger.info('Phase 3: Calculating engagement metrics...');
    // await scraper.calculateDailyEngagement();

    // Print final statistics
    const totalTime = (Date.now() - startTime) / 1000;
    logger.info(
      `Total scraping completed in ${totalTime.toFixed(2)} seconds (${(
        totalTime / 60
      ).toFixed(2)} minutes)`
    );
    scraper.printStats();
  } catch (error) {
    logger.error(`Scraping process failed: ${error.message}`);
  } finally {
    await scraper.close();
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Export for use as module
module.exports = TikTokScraper;

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}
