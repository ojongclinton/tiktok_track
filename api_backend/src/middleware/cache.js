import redis from '../config/redis.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        return sendSuccess(res, data, 'Data retrieved from cache');
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }

    // Store original send function
    const originalSend = res.json;
    
    // Override res.json to cache successful responses
    res.json = function(body) {
      if (res.statusCode === 200 && body.success) {
        redis.setex(key, duration, JSON.stringify(body.data))
          .catch(err => console.error('Cache store error:', err));
      }
      
      originalSend.call(this, body);
    };

    next();
  };
};
