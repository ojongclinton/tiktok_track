import Redis from 'ioredis';

const redis = new Redis({
  host: 'redis-18048.c14.us-east-1-3.ec2.redns.redis-cloud.com',
  port: 18048,
  password: 'SShuFKNfb7dD2xGPx9rIXLYzZr1CiTsf',
  db: 0
});

async function clearQueue() {
  try {
    await redis.flushdb();
    console.log('✅ Redis queue cleared!');
    await redis.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearQueue();
