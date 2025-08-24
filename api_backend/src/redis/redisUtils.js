import QueueManager from "./QueueManager.js";


// Create a shared instance (singleton pattern)
let queueManagerInstance = null;

async function getQueueManager() {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: process.env.REDIS_DB || 0
      }
    });
    
    await queueManagerInstance.connect();
  }
  
  return queueManagerInstance;
}

// Quick function to add a profile to scraping queue
export async function addProfileToQueue(username, priority = 0) {
  try {
    const queueManager = await getQueueManager();
    const success = await queueManager.addJob(username, priority);
    
    if (success) {
      console.log(`✅ Successfully added ${username} to scraping queue`);
      return true;
    } else {
      console.error(`❌ Failed to add ${username} to queue`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error adding ${username} to queue:`, error.message);
    return false;
  }
}

// Batch add multiple profiles
export async function addMultipleProfilesToQueue(usernames, priority = 0) {
  const results = [];
  
  for (const username of usernames) {
    const success = await addProfileToQueue(username, priority);
    results.push({ username, success });
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`📊 Added ${successful}/${usernames.length} profiles to queue`);
  
  return results;
}

// High priority add (for immediate scraping)
export async function addUrgentProfile(username) {
  return await addProfileToQueue(username, -1000); // High priority (negative score)
}

// Get queue stats without creating full QueueManager
export async function getQueueStatus() {
  try {
    const queueManager = await getQueueManager();
    return await queueManager.getQueueStats();
  } catch (error) {
    console.error('❌ Error getting queue status:', error.message);
    return null;
  }
}
