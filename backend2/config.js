require('dotenv').config();

const config = {
    // Database settings
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'scraper_user',
        password: process.env.DB_PASSWORD || 'your_password',
        database: process.env.DB_NAME || 'tiktok_scraper'
    },
    
    // Proxy settings - automatically switches based on USE_FREE_PROXIES
    proxy: {
        useFreeProxies: process.env.USE_FREE_PROXIES === 'true',
        refreshInterval: 300000, // 5 minutes for free proxies
        testTimeout: 5000,
        maxFailures: 3
    },
    
    // Scraper settings - adjust based on proxy type
    scraper: {
        maxConcurrent: process.env.USE_FREE_PROXIES === 'true' ? 3 : 10,
        requestDelay: parseInt(process.env.REQUEST_DELAY) || 500,
        maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
        timeout: parseInt(process.env.TIMEOUT) || 10000
    },
    
    // Paid proxy endpoints (loaded from environment)
    paidProxies: getPaidProxies()
};

function getPaidProxies() {
    const proxies = [];
    
    // Method 1: Comma-separated list
    if (process.env.PAID_PROXY_ENDPOINTS) {
        const endpoints = process.env.PAID_PROXY_ENDPOINTS.split(',');
        proxies.push(...endpoints.map(p => p.trim()));
    }
    
    // Method 2: Individual proxy environment variables
    let i = 1;
    while (process.env[`PROXY_${i}`]) {
        proxies.push(process.env[`PROXY_${i}`]);
        i++;
    }
    
    return proxies;
}

module.exports = config;