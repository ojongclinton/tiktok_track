import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

class TikTokScraper {
  constructor(options = {}) {
    this.options = {
      headless: false,
      ...options,
    };

    this.browser = null;
    this.page = null;
    this.dbPool = options.dbPool || writePool; // Pass database pool in options
  }

  // Utility functions
  randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Initialize browser - keep it simple
  async initBrowser() {
    if (this.browser) {
      await this.browser.close();
    }

    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      devtools: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    this.page = await this.browser.newPage();
  }

  // Setup response interception - for profile page and video API
  async setupResponseInterception(username) {
    this.capturedData = {
      userInfo: null,
      videos: [],
      musics: [], // Add music collection
      tags: [], // Add tags collection
      shouldStopScrolling: false
    };

    // Calculate 3 months ago timestamp (in milliseconds)
    const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

    this.page.on("response", async (response) => {
      const url = response.url();
      const status = response.status();

      try {
        // Intercept profile page for user data
        if (
          url.includes(`/@${username}`) &&
          status === 200 &&
          url.includes("tiktok.com")
        ) {
          console.log("🎯 Intercepted profile page response");
          const html = await response.text();
          this.extractUserDataFromHTML(html);
        }

        // Intercept video API responses
        if (url.includes('/api/post/item_list/') && status === 200) {
          console.log("📹 Intercepted video API response");
          const responseText = await response.text();
          const videoData = JSON.parse(responseText);

          // Check cursor timestamp (convert to milliseconds if needed)
          let cursorTimestamp = parseInt(videoData.cursor);
          if (cursorTimestamp.toString().length === 10) {
            cursorTimestamp *= 1000; // Convert from seconds to milliseconds
          }

          console.log(`   Cursor timestamp: ${cursorTimestamp}`);
          console.log(`   Cursor date: ${new Date(cursorTimestamp).toISOString()}`);
          console.log(`   Videos in batch: ${videoData.itemList?.length || 0}`);
          console.log(`   Has more: ${videoData.hasMore}`);

          // Check if we should stop scrolling
          if (cursorTimestamp < threeMonthsAgo) {
            console.log(`🛑 Cursor is older than 3 months, stopping scrolling`);
            this.capturedData.shouldStopScrolling = true;
          } else if (!videoData.hasMore) {
            console.log(`🛑 No more videos available, stopping scrolling`);
            this.capturedData.shouldStopScrolling = true;
          } else {
            // Process videos in this batch
            if (videoData.itemList && videoData.itemList.length > 0) {
              const processedVideos = this.processVideoBatch(videoData.itemList, username);
              this.capturedData.videos.push(...processedVideos);
              console.log(`✅ Processed ${processedVideos.length} videos`);
            }
          }
        }

      } catch (error) {
        console.error("❌ Error processing response:", error.message);
      }
    });
  }

  // Process a batch of videos and extract relevant data
  processVideoBatch(videoList, username) {
    const processedVideos = [];
    const processedMusics = [];
    const processedTags = [];

    for (const video of videoList) {
      try {
        // Process music data first (if exists)
        if (video.music && video.music.id) {
          const musicData = {
            music_id: video.music.id,
            title: video.music.title || 'Unknown',
            artist: video.music.authorName || 'Unknown Artist',
            duration_ms: (video.music.duration || 0) * 1000, // Convert to milliseconds
            original_sound: video.music.original || false,
            usage_count: 1, // We'll increment this in the upsert
            trending_score: 0.0, // You can calculate this later based on usage
            created_at: new Date()
          };

          // Check if we haven't already processed this music in this batch
          if (!processedMusics.find(m => m.music_id === musicData.music_id)) {
            processedMusics.push(musicData);
          }
        }

        // Process tags/challenges data
        const videoTagIds = [];
        if (video.challenges && Array.isArray(video.challenges)) {
          for (const challenge of video.challenges) {
            if (challenge.id) {
              const tagData = {
                id: challenge.id,
                name: challenge.title || '',
                desc: challenge.desc || ''
              };

              // Add to processed tags if not already there
              if (!processedTags.find(t => t.id === tagData.id)) {
                processedTags.push(tagData);
              }

              // Collect tag ID for this video
              videoTagIds.push(challenge.id);
            }
          }
        }

        // Process video data
        const videoData = {
          video_id: video.id,
          ticktok_user_id: video.author?.id,
          description: video.desc || '',
          view_count: parseInt(video.stats?.playCount) || 0,
          like_count: parseInt(video.stats?.diggCount) || 0,
          comment_count: parseInt(video.stats?.commentCount) || 0,
          share_count: parseInt(video.stats?.shareCount) || 0,
          duration_ms: (video.video?.duration || 0) * 1000, // Convert seconds to milliseconds
          video_url: video.video?.playAddr || '',
          cover_image_url: video.video?.cover || '',
          music_id: video.music?.id || null,
          tags: JSON.stringify(videoTagIds), // Store tag IDs as JSON array
          created_at: new Date(video.createTime * 1000), // Convert to JS Date
          scraped_at: new Date(),
          updated_at: new Date()
        };

        processedVideos.push(videoData);

      } catch (error) {
        console.error(`❌ Error processing video ${video.id}:`, error.message);
      }
    }

    // Store music and tags data for insertion
    this.capturedData.musics = this.capturedData.musics || [];
    this.capturedData.musics.push(...processedMusics);
    
    this.capturedData.tags = this.capturedData.tags || [];
    this.capturedData.tags.push(...processedTags);

    return processedVideos;
  }

  // Insert tag data into database (must be done before videos due to FK reference)
  async insertTag(tagData) {
    if (!this.dbPool || !tagData.id) {
      return false;
    }

    const connection = await this.dbPool.getConnection();
    try {
      const query = `
        INSERT INTO tiktok_tags (tag_id, title, description)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description)
      `;

      const values = [
        tagData.id,
        tagData.name,
        tagData.desc
      ];

      await connection.execute(query, values);
      return true;

    } catch (error) {
      console.error(`❌ Error inserting tag ${tagData.id}:`, error.message);
      return false;
    } finally {
      connection.release();
    }
  }
  async insertMusic(musicData) {
    if (!this.dbPool || !musicData.music_id) {
      return false;
    }

    const connection = await this.dbPool.getConnection();
    try {
      const query = `
        INSERT INTO ticktok_music (music_id, title, artist, duration_ms, original_sound, 
                                   usage_count, trending_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            usage_count = usage_count + 1,
            trending_score = VALUES(trending_score)
      `;

      const values = [
        musicData.music_id,
        musicData.title,
        musicData.artist,
        musicData.duration_ms,
        musicData.original_sound,
        musicData.usage_count,
        musicData.trending_score,
        musicData.created_at
      ];

      await connection.execute(query, values);
      return true;

    } catch (error) {
      console.error(`❌ Error inserting music ${musicData.music_id}:`, error.message);
      return false;
    } finally {
      connection.release();
    }
  }

  // Extract user data from the main HTML response
  extractUserDataFromHTML(html) {
    try {
      // Look for the common TikTok data script
      const scriptMatch = html.match(
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/
      );

      if (scriptMatch) {
        const jsonData = JSON.parse(scriptMatch[1]);
        console.log("🎯 Found UNIVERSAL_DATA_FOR_REHYDRATION script");

        // Navigate through the data structure to find user info
        if (
          jsonData.__DEFAULT_SCOPE__ &&
          jsonData.__DEFAULT_SCOPE__["webapp.user-detail"]
        ) {
          const userDetail = jsonData.__DEFAULT_SCOPE__["webapp.user-detail"];

          if (userDetail.userInfo) {
            const userInfo = userDetail.userInfo;
            const userBody = {
              user_id: userInfo.user.id,
              username: userInfo.user.uniqueId,
              display_name: userInfo.user.nickname,
              bio: userInfo.user.signature,
              follower_count: userInfo.statsV2.followerCount,
              following_count: userInfo.statsV2.followingCount,
              likes_count: userInfo.statsV2.heartCount,
              video_count: userInfo.statsV2.videoCount,
              verified: userInfo.user.verified,
              private_account: false,
              profile_image_url:
                userInfo.user.avatarMedium ||
                userInfo.user.avatarLarger ||
                userInfo.user.avatarThumb,
              last_scraped: new Date(),
              sec_uid: userInfo.user.secUid,
              created_date: userInfo.user.createTime,
            };

            console.log("The user body");
            console.log(userBody);

            this.insertUser(userBody);
            this.checkAndInsertUserAnalyticsData(userBody);

            this.capturedData.userInfo = userInfo;
            return userInfo;
          }
        }
      }

      console.log("⚠️ Could not find user data in HTML");
      return null;
    } catch (error) {
      console.error("❌ Error extracting user data from HTML:", error.message);
      return null;
    }
  }

  // Simple navigation
  async navigateToProfile(username) {
    const url = `https://www.tiktok.com/@${username}`;
    console.log(`🌐 Navigating to: ${url}`);

    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log("✅ Page loaded");
  }

  // Smart scrolling that stops when we hit 3-month limit
  async scrollAndCollectVideos() {
    console.log(`📜 Starting smart video collection (3-month limit)`);
    let scrollCount = 0;
    const maxScrolls = 50; // Safety limit

    while (!this.capturedData.shouldStopScrolling && scrollCount < maxScrolls) {
      scrollCount++;
      console.log(`   Scroll ${scrollCount} - collecting videos...`);
      
      // Perform scroll
      await this.page.evaluate(() => {
        window.scrollBy(0, 800);
      });
      
      // Wait for API response
      await this.randomDelay(2000, 4000);
      
      // Check if we should stop
      if (this.capturedData.shouldStopScrolling) {
        console.log(`🛑 Stopping at scroll ${scrollCount} due to time limit`);
        break;
      }
    }

    if (scrollCount >= maxScrolls) {
      console.log(`⚠️ Reached maximum scroll limit (${maxScrolls})`);
    }

    console.log(`✅ Video collection completed after ${scrollCount} scrolls`);
    console.log(`📊 Total videos collected: ${this.capturedData.videos.length}`);
    
    return this.capturedData.videos;
  }

  // Simple scroll (keeping original method for compatibility)
  async scrollDown(times = 3) {
    console.log(`📜 Scrolling ${times} times`);

    for (let i = 0; i < times; i++) {
      await this.page.evaluate(() => {
        window.scrollBy(0, 500);
      });

      await this.randomDelay(1000, 2000);
      console.log(`   Scroll ${i + 1}/${times} completed`);
    }
  }

  // Get captured user data
  getUserData() {
    return this.capturedData?.userInfo || null;
  }

  // Get collected videos
  getVideoData() {
    return this.capturedData?.videos || [];
  }

  // Get collected music data
  getMusicData() {
    return this.capturedData?.musics || [];
  }

  // Get collected tag data
  getTagData() {
    return this.capturedData?.tags || [];
  }

  // Insert video data into database (only if video doesn't exist)
  async insertVideos(videos) {
    if (!this.dbPool || videos.length === 0) {
      console.warn("⚠️ No database pool or no videos to insert");
      return false;
    }

    const connection = await this.dbPool.getConnection();
    try {
      const query = `
        INSERT IGNORE INTO ticktok_videos (video_id, ticktok_user_id, description, view_count,
                                          like_count, comment_count, share_count, duration_ms,
                                          video_url, cover_image_url, music_id, tags, created_at,
                                          scraped_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      let insertedCount = 0;
      for (const video of videos) {
        try {
          const values = [
            video.video_id,
            video.ticktok_user_id,
            video.description,
            video.view_count,
            video.like_count,
            video.comment_count,
            video.share_count,
            video.duration_ms,
            video.video_url,
            video.cover_image_url,
            video.music_id,
            video.tags, // JSON string of tag IDs
            video.created_at,
            video.scraped_at,
            video.updated_at
          ];

          const result = await connection.execute(query, values);
          if (result[0].affectedRows > 0) {
            insertedCount++;
          }
        } catch (videoError) {
          console.error(`❌ Error inserting video ${video.video_id}:`, videoError.message);
        }
      }

      console.log(`✅ Successfully inserted ${insertedCount}/${videos.length} new videos`);
      return true;

    } catch (error) {
      console.error("❌ Database video insert error:", error.message);
      return false;
    } finally {
      connection.release();
    }
  }

  // Insert video analytics data (for tracking metrics over time)
  async insertVideosAnalytics(videos) {
    if (!this.dbPool || videos.length === 0) {
      console.warn("⚠️ No database pool or no videos to insert analytics for");
      return false;
    }

    const connection = await this.dbPool.getConnection();
    try {
      // First check which videos need analytics (only insert if last record is 2+ hours old or doesn't exist)
      const checkQuery = `
        SELECT va.video_id, MAX(va.recorded_at) as last_recorded
        FROM tiktok_videos_analytics va
        WHERE va.video_id IN (${videos.map(() => '?').join(',')})
        GROUP BY va.video_id
        HAVING MAX(va.recorded_at) < NOW() - INTERVAL 2 HOUR
      `;

      const videoIds = videos.map(v => v.video_id);
      const [existingRecords] = await connection.execute(checkQuery, videoIds);
      
      // Get video IDs that either don't have analytics or last record is 2+ hours old
      const needAnalytics = videos.filter(video => {
        const hasRecentRecord = existingRecords.some(record => record.video_id === video.video_id);
        return !hasRecentRecord; // Insert if no recent record found
      });

      if (needAnalytics.length === 0) {
        console.log("⏭️ All videos have recent analytics records (within 2 hours), skipping");
        return true;
      }

      const insertQuery = `
        INSERT INTO tiktok_videos_analytics (video_id, view_count, like_count, comment_count, 
                                           share_count, recorded_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;

      let insertedCount = 0;
      for (const video of needAnalytics) {
        try {
          const values = [
            video.video_id,
            video.view_count,
            video.like_count,
            video.comment_count,
            video.share_count
          ];

          await connection.execute(insertQuery, values);
          insertedCount++;
        } catch (analyticsError) {
          console.error(`❌ Error inserting analytics for video ${video.video_id}:`, analyticsError.message);
        }
      }

      console.log(`✅ Successfully inserted ${insertedCount}/${needAnalytics.length} video analytics records`);
      return true;

    } catch (error) {
      console.error("❌ Database video analytics insert error:", error.message);
      return false;
    } finally {
      connection.release();
    }
  }

  // Insert user data into MySQL database
  async insertUser(userData) {
    if (!this.dbPool) {
      console.warn("⚠️ No database pool provided, skipping database insert");
      return false;
    }

    const connection = await this.dbPool.getConnection();
    try {
      const query = `
        INSERT INTO ticktok_users (user_id, username, display_name, bio, follower_count,
                         following_count, likes_count, video_count, verified,
                         private_account, profile_image_url, last_scraped,sec_uid, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        userData.sec_uid,
        userData.created_date,
      ];

      await connection.execute(query, values);
      console.log("✅ User data inserted/updated in database");
      return true;
    } catch (error) {
      console.error("❌ Database insert error:", error.message);
      return false;
    } finally {
      connection.release();
    }
  }

  async checkAndInsertUserAnalyticsData(userData) {
    if (!this.dbPool) {
      console.warn("⚠️ No database pool provided, skipping analytics insert");
      return;
    }
    const connection = await this.dbPool.getConnection();
    try {
      const checkAnalyticsQuery = `
      SELECT recorded_at 
      FROM ticktok_user_analytics 
      WHERE ticktok_user_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT 1
    `;

      const [analyticsRows] = await connection.execute(checkAnalyticsQuery, [
        userData.user_id,
      ]);

      let shouldInsertAnalytics = true;

      if (analyticsRows.length > 0) {
        const lastRecorded = new Date(analyticsRows[0].recorded_at);
        const now = new Date();
        const hoursDifference = (now - lastRecorded) / (1000 * 60 * 60);

        // Only insert if 24 or more hours have passed
        shouldInsertAnalytics = hoursDifference >= 24;
      }

      // Insert analytics data if conditions are met
      if (shouldInsertAnalytics) {
        const analyticsQuery = `
        INSERT INTO ticktok_user_analytics (ticktok_user_id, follower_count, following_count, total_likes, video_count)
        VALUES (?, ?, ?, ?, ?)
      `;

        const analyticsValues = [
          userData.user_id,
          userData.follower_count,
          userData.following_count,
          userData.likes_count,
          userData.video_count,
        ];

        await connection.execute(analyticsQuery, analyticsValues);

        console.log(`Analytics data inserted for user ${userData.user_id}`);
      } else {
        console.log(
          `Analytics data skipped for user ${userData.user_id} - less than 24 hours since last record`
        );
      }
    } finally {
      connection.release();
    }
  }

  // Main scraping method
  async scrapeProfile(username) {
    try {
      await this.initBrowser();

      // Setup interception for this specific username
      await this.setupResponseInterception(username);

      await this.navigateToProfile(username);

      // Wait for the profile response to be captured
      await this.randomDelay(3000, 5000);

      const userData = this.getUserData();

      if (userData) {
        console.log("✅ Successfully extracted user data");
      } else {
        console.log("⚠️ No user data found");
      }

      // Collect videos with smart scrolling (stops at 3-month limit)
      const videos = await this.scrollAndCollectVideos();

      // Insert tags first
      const tags = this.getTagData();
      if (tags.length > 0) {
        console.log(`🏷️ Inserting ${tags.length} unique tags...`);
        for (const tag of tags) {
          await this.insertTag(tag);
        }
        console.log(`✅ Tags insertion completed`);
      }

      // Insert music data second (due to foreign key constraint)
      const musics = this.getMusicData();
      if (musics.length > 0) {
        console.log(`🎵 Inserting ${musics.length} unique music tracks...`);
        for (const music of musics) {
          await this.insertMusic(music);
        }
        console.log(`✅ Music insertion completed`);
      }

      // Finally insert videos (with tag IDs as JSON and music_id FK)
      if (videos.length > 0) {
        await this.insertVideos(videos);
        // Also insert analytics data for tracking metrics over time
        await this.insertVideosAnalytics(videos);
      }

      return {
        success: true,
        username,
        userData,
        videos: videos.length,
        musics: musics.length,
        tags: tags.length,
        videoData: videos,
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("💥 Error:", error.message);
      return {
        success: false,
        username,
        error: error.message,
      };
    } finally {
      console.log("🔍 Browser staying open for manual testing...");
    }
  }

  // Manual cleanup when done testing
  async cleanup() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
    console.log("🧹 Cleaned up");
  }
}

export default TikTokScraper;

// // Example usage with database
// import mysql from "mysql2/promise";
// import { writePool } from "./config/database";

// const dbPool = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "tiktok_tracker",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// const scraper = new TikTokScraper({
//   headless: false,
//   dbPool: dbPool,
// });

// Simple test without database
// const scraper = new TikTokScraper({ headless: false });

// scraper
//   .scrapeProfile("bongadou")
//   .then((result) => {
//     console.log(`\n📊 Scraping completed for ${result.username}`);
//     console.log(`   User data: ${result.success ? '✅' : '❌'}`);
//     console.log(`   Videos collected: ${result.videos || 0}`);
//     console.log(`   Music tracks: ${result.musics || 0}`);
//     console.log(`   Tags processed: ${result.tags || 0}`);
//     console.log("\n💡 Browser left open for manual testing");
//     console.log("💡 Call scraper.cleanup() when done");
//   })
//   .catch((err) => console.error("Failed:", err));
