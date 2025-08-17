// test-redis-cloud.js
import Redis from 'ioredis';

async function testRedisConnection() {
  console.log('🔌 Testing Redis Cloud connection...');

  // Try without TLS first
  const redisOptions = {
    host: 'redis-18048.c14.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 18048,
    password: 'SShuFKNfb7dD2xGPx9rIXLYzZr1CiTsf', // Replace with real password
    db: 0,
    connectTimeout: 30000,
    commandTimeout: 10000,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  };

  let redis = new Redis(redisOptions);

  try {
    console.log('🔄 Attempting connection without TLS...');
    await redis.connect();
    
    await redis.set('test-key', 'Hello Redis Cloud!');
    const result = await redis.get('test-key');
    
    console.log('✅ Redis Cloud connection successful!');
    console.log('📝 Test result:', result);
    
    await redis.del('test-key');
    await redis.disconnect();
    return true;

  } catch (error) {
    console.log('❌ Connection without TLS failed, trying with TLS...');
    await redis.disconnect();

    // Try with TLS
    const redisOptionsWithTLS = {
      ...redisOptions,
      tls: {
        rejectUnauthorized: false // Accept self-signed certificates
      }
    };

    redis = new Redis(redisOptionsWithTLS);

    try {
      await redis.connect();
      
      await redis.set('test-key', 'Hello Redis Cloud with TLS!');
      const result = await redis.get('test-key');
      
      console.log('✅ Redis Cloud connection with TLS successful!');
      console.log('📝 Test result:', result);
      
      await redis.del('test-key');
      await redis.disconnect();
      return true;

    } catch (tlsError) {
      console.error('❌ Both TLS and non-TLS connections failed:');
      console.error('Non-TLS error:', error.message);
      console.error('TLS error:', tlsError.message);
      await redis.disconnect();
      return false;
    }
  }
}

testRedisConnection();
