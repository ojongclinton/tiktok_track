import Redis from 'ioredis';

class QueueManager {
  constructor(options = {}) {
    this.redis = new Redis({
      host: options.redis?.host || 'localhost',
      port: options.redis?.port || 6379,
      password: options.redis?.password || null,
      db: options.redis?.db || 0,
      retryDelayOnFailover: 100,
      lazyConnect: true
    });

    this.queueName = 'tiktok_scraping_queue';
    this.processingQueue = 'tiktok_processing_queue';
    this.retryQueue = 'tiktok_retry_queue';
  }

  // Connect to Redis
  async connect() {
    try {
      await this.redis.connect();
      console.log('✅ Connected to Redis queue system');
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      throw error;
    }
  }

  // Add a profile to the scraping queue
  async addJob(username, priority = 0) {
    try {
      const job = {
        username,
        priority,
        addedAt: new Date().toISOString(),
        attempts: 0
      };

      // Use sorted set for priority queue (lower score = higher priority)
      const score = Date.now() + (priority * 1000); // Priority affects timing
      await this.redis.zadd(this.queueName, score, JSON.stringify(job));
      
      console.log(`📝 Added ${username} to queue with priority ${priority}`);
      return true;
    } catch (error) {
      console.error(`❌ Error adding job for ${username}:`, error.message);
      return false;
    }
  }

  // Get next job from queue (blocking operation for workers)
  async getNextJob(timeoutSeconds = 30) {
    try {
      // Get highest priority job (lowest score)
      const result = await this.redis.zpopmin(this.queueName);
      
      if (!result || result.length === 0) {
        return null; // No jobs available
      }

      const [jobData, score] = result;
      const job = JSON.parse(jobData);
      
      // Move to processing queue for fault tolerance
      await this.redis.setex(
        `processing:${job.username}`, 
        1800, // 30 minutes timeout
        JSON.stringify({...job, startedAt: new Date().toISOString()})
      );

      console.log(`🎯 Worker picked up job: ${job.username}`);
      return job;
    } catch (error) {
      console.error('❌ Error getting next job:', error.message);
      return null;
    }
  }

  // Mark job as completed
  async completeJob(username) {
    try {
      await this.redis.del(`processing:${username}`);
      console.log(`✅ Completed job: ${username}`);
      return true;
    } catch (error) {
      console.error(`❌ Error completing job ${username}:`, error.message);
      return false;
    }
  }

  // Mark job as failed and optionally retry
  async failJob(username, error, maxRetries = 3) {
    try {
      const processingKey = `processing:${username}`;
      const jobData = await this.redis.get(processingKey);
      
      if (jobData) {
        const job = JSON.parse(jobData);
        job.attempts = (job.attempts || 0) + 1;
        job.lastError = error;
        job.failedAt = new Date().toISOString();

        // Remove from processing
        await this.redis.del(processingKey);

        if (job.attempts < maxRetries) {
          // Retry with exponential backoff
          const delay = Math.min(300000, 30000 * Math.pow(2, job.attempts)); // Max 5 minutes
          const retryTime = Date.now() + delay;
          
          await this.redis.zadd(this.retryQueue, retryTime, JSON.stringify(job));
          console.log(`🔄 Scheduled retry for ${username} in ${delay/1000} seconds (attempt ${job.attempts})`);
        } else {
          console.error(`💀 Job ${username} failed permanently after ${job.attempts} attempts`);
          // Could save to failed jobs table here
        }
      }

      return true;
    } catch (err) {
      console.error(`❌ Error handling failed job ${username}:`, err.message);
      return false;
    }
  }

  // Move retry jobs back to main queue if their time has come
  async processRetryQueue() {
    try {
      const now = Date.now();
      const retryJobs = await this.redis.zrangebyscore(this.retryQueue, 0, now);
      
      for (const jobData of retryJobs) {
        const job = JSON.parse(jobData);
        
        // Move back to main queue
        await this.redis.zadd(this.queueName, now, jobData);
        await this.redis.zrem(this.retryQueue, jobData);
        
        console.log(`🔄 Moved ${job.username} from retry queue back to main queue`);
      }

      return retryJobs.length;
    } catch (error) {
      console.error('❌ Error processing retry queue:', error.message);
      return 0;
    }
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      const [queueSize, processingSize, retrySize] = await Promise.all([
        this.redis.zcard(this.queueName),
        this.redis.keys('processing:*').then(keys => keys.length),
        this.redis.zcard(this.retryQueue)
      ]);

      return {
        pending: queueSize,
        processing: processingSize,
        retry: retrySize,
        total: queueSize + processingSize + retrySize
      };
    } catch (error) {
      console.error('❌ Error getting queue stats:', error.message);
      return { pending: 0, processing: 0, retry: 0, total: 0 };
    }
  }

  // Clean up stuck jobs in processing queue
  async cleanupStuckJobs() {
    try {
      const processingKeys = await this.redis.keys('processing:*');
      let cleanedUp = 0;

      for (const key of processingKeys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // Key exists but has no expiry (stuck)
          const jobData = await this.redis.get(key);
          if (jobData) {
            const job = JSON.parse(jobData);
            await this.failJob(job.username, 'Job stuck in processing queue');
            cleanedUp++;
          }
        }
      }

      if (cleanedUp > 0) {
        console.log(`🧹 Cleaned up ${cleanedUp} stuck jobs`);
      }

      return cleanedUp;
    } catch (error) {
      console.error('❌ Error cleaning up stuck jobs:', error.message);
      return 0;
    }
  }

  // Graceful shutdown
  async disconnect() {
    try {
      await this.redis.disconnect();
      console.log('👋 Disconnected from Redis');
    } catch (error) {
      console.error('❌ Error disconnecting from Redis:', error.message);
    }
  }
}

export default QueueManager;
