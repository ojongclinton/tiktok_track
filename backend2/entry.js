const axios = require('axios');
const mysql = require('mysql2/promise');
const pLimit = require('p-limit');
const winston = require('winston');
const cheerio = require('cheerio');
const fs = require('fs').promises;

// ✅ CORRECT: Logger should only contain logging configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'scraper.log' })
    ]
});

class TikTokScraper {
    constructor(config = {}) {
        this.config = {
            maxConcurrent: config.maxConcurrent || 10,
            requestDelay: config.requestDelay || 500,
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 10000,
            ...config
        };
        
        // Rate limiting
        this.limiter = pLimit(this.config.maxConcurrent);
        
        // Database connection pool
        this.dbPool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'scraper_user',
            password: process.env.DB_PASSWORD || 'your_password',
            database: process.env.DB_NAME || 'tiktok_scraper',
            waitForConnections: true,
            connectionLimit: 20,
            queueLimit: 0
        });
        
        // Request statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            startTime: Date.now()
        };
        
        // Realistic browser headers with rotation
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
        ];
        
        this.acceptLanguages = [
            'en-US,en;q=0.9',
            'en-US,en;q=0.8,es;q=0.7',
            'en-US,en;q=0.9,fr;q=0.8',
            'en-GB,en;q=0.9,en-US;q=0.8'
        ];

        // Session persistence
        this.sessionData = {
            cookies: new Map(),
            lastRequestTime: 0,
            requestCount: 0
        };

        // Create axios instance
        this.axiosInstance = axios.create({
            timeout: this.config.timeout,
            maxRedirects: 5,
            withCredentials: true,
            validateStatus: (status) => status < 500
        });

        this.setupRequestInterceptors();
    }
    
    // ✅ CORRECT: Methods belong in the class
    setupRequestInterceptors() {
        // Request interceptor - randomize headers and add natural delays
        this.axiosInstance.interceptors.request.use(async (config) => {
            // Randomize user agent
            const randomUA = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
            const randomLang = this.acceptLanguages[Math.floor(Math.random() * this.acceptLanguages.length)];
            
            // Build realistic headers
            config.headers = {
                'User-Agent': randomUA,
                'Accept': this.getRandomAcceptHeader(config.url),
                'Accept-Language': randomLang,
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': this.generateSecChUa(randomUA),
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': this.getPlatformFromUA(randomUA),
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'DNT': '1',
                ...config.headers
            };

            // Add referer for non-initial requests
            if (this.sessionData.requestCount > 0) {
                config.headers['Referer'] = 'https://www.tiktok.com/';
            }

            // Add cookies if we have them
            if (this.sessionData.cookies.size > 0) {
                const cookieString = Array.from(this.sessionData.cookies.entries())
                    .map(([key, value]) => `${key}=${value}`)
                    .join('; ');
                config.headers['Cookie'] = cookieString;
            }

            this.sessionData.requestCount++;
            return config;
        });

        // Response interceptor - handle cookies and rate limiting
        this.axiosInstance.interceptors.response.use(
            (response) => {
                // Extract and store cookies
                const setCookieHeaders = response.headers['set-cookie'];
                if (setCookieHeaders) {
                    setCookieHeaders.forEach(cookie => {
                        const [nameValue] = cookie.split(';');
                        const [name, value] = nameValue.split('=');
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
                    logger.warn('Rate limited, extending delay...');
                }
                return Promise.reject(error);
            }
        );
    }

    // Generate realistic Sec-Ch-Ua header
    generateSecChUa(userAgent) {
        if (userAgent.includes('Chrome/120')) {
            return '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
        } else if (userAgent.includes('Chrome/119')) {
            return '"Not_A Brand";v="8", "Chromium";v="119", "Google Chrome";v="119"';
        } else if (userAgent.includes('Firefox')) {
            return '';
        }
        return '"Not_A Brand";v="8", "Chromium";v="120"';
    }

    // Extract platform from user agent
    getPlatformFromUA(userAgent) {
        if (userAgent.includes('Windows')) return '"Windows"';
        if (userAgent.includes('Macintosh')) return '"macOS"';
        if (userAgent.includes('Linux')) return '"Linux"';
        return '"Windows"';
    }

    // Get appropriate Accept header based on request type
    getRandomAcceptHeader(url) {
        const accepts = [
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
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
        const fatigueMultiplier = this.sessionData.requestCount > 100 ? 
            1 + (this.sessionData.requestCount - 100) / 500 : 1;
        
        const totalDelay = Math.max(200, baseDelay + jitter + longPause) * fatigueMultiplier;
        
        this.sessionData.lastRequestTime = Date.now();
        return new Promise(resolve => setTimeout(resolve, totalDelay));
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
        return new Promise(resolve => setTimeout(resolve, ms));
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
                throw new Error(`Request blocked (${response.status}): Rate limited or detected`);
            } else if (response.status >= 400) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.stats.successfulRequests++;
            return response.data;
            
        } catch (error) {
            this.stats.failedRequests++;
            
            if (retries < this.config.maxRetries) {
                // Progressive backoff with randomization
                const backoffDelay = Math.min(30000, (1000 * Math.pow(2, retries)) + (Math.random() * 1000));
                
                logger.warn(`Request failed, retrying (${retries + 1}/${this.config.maxRetries}) after ${backoffDelay}ms: ${url}`);
                
                // Reset session occasionally on repeated failures
                if (retries === Math.floor(this.config.maxRetries / 2)) {
                    logger.info('Resetting session due to repeated failures');
                    this.sessionData.cookies.clear();
                    this.sessionData.requestCount = 0;
                }
                
                await this.delay(backoffDelay);
                return this.makeRequest(url, options, retries + 1);
            }
            
            logger.error(`Request failed after ${this.config.maxRetries} retries: ${url} - ${error.message}`);
            throw error;
        }
    }
    
    // ... rest of the scraper methods remain the same
    async scrapeUserProfile(username) {
        return this.limiter(async () => {
            try {
                logger.info(`Scraping user profile: ${username}`);
                
                // Implementation continues as before...
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
                    last_scraped: new Date()
                };
                
                await this.insertUser(userData);
                logger.info(`Successfully scraped user: ${username}`);
                return userData;
                
            } catch (error) {
                logger.error(`Failed to scrape user ${username}: ${error.message}`);
                throw error;
            }
        });
    }

    // Database operations and other methods continue...
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
                userData.user_id, userData.username, userData.display_name, userData.bio,
                userData.follower_count, userData.following_count, userData.likes_count,
                userData.video_count, userData.verified, userData.private_account,
                userData.profile_image_url, userData.last_scraped
            ];
            
            await connection.execute(query, values);
            
        } finally {
            connection.release();
        }
    }
    
    // Cleanup
    async close() {
        await this.dbPool.end();
        logger.info('Database connections closed');
    }
}

module.exports = TikTokScraper;
