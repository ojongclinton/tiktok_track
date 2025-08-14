const axios = require('axios');
const { HttpProxyAgent } = require('http-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const config = require('./config');

class ProxyTester {
    async testFreeProxies() {
        console.log('🔍 Testing free proxies from ProxyScrape...\n');

        try {
            const response = await axios.get(
                'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text&timeout=20000'
            );

            const proxyList = response.data
                .split('\n')
                .map(p => p.trim())
                .filter(Boolean)
                .slice(0, 50);

            console.log(`Found ${proxyList.length} free proxies to test:\n`);

            // Use concurrency to speed up testing
            await Promise.allSettled(
                proxyList.map(async (proxy) => {
                    const success = await this.testSingleProxy(proxy, true);
                    console.log(`${success ? '✅' : '❌'} ${proxy}`);
                })
            );

        } catch (error) {
            console.error('❌ Failed to fetch free proxies:', error.message);
        }
    }

    async testPaidProxies() {
        const proxies = config.paidProxies;

        if (!Array.isArray(proxies) || proxies.length === 0) {
            console.log('⚠️  No paid proxies configured in .env file\n');
            return;
        }

        console.log(`🔍 Testing ${proxies.length} paid proxies...\n`);

        await Promise.allSettled(
            proxies.map(async (proxy) => {
                const success = await this.testSingleProxy(proxy);
                console.log(`${success ? '✅' : '❌'} ${proxy}`);
            })
        );
    }

    async testSingleProxy(proxy, isFree = false) {
        try {
            // Pick correct proxy agent based on protocol
            let agent;
            if (proxy.startsWith('https://')) {
                agent = new HttpsProxyAgent(proxy);
            } else if (proxy.startsWith('http://')) {
                agent = new HttpProxyAgent(proxy);
            } else {
                // If free proxies are in "protocol ip:port" format, split it
                const parts = proxy.split(' ');
                if (parts.length === 2) {
                    const [protocol, hostPort] = parts;
                    agent = protocol.toLowerCase() === 'https'
                        ? new HttpsProxyAgent(`${protocol}://${hostPort}`)
                        : new HttpProxyAgent(`${protocol}://${hostPort}`);
                } else {
                    // Default to HTTP if unclear
                    agent = new HttpProxyAgent(`http://${proxy}`);
                }
            }

            const timeout = isFree ? 10000 : 5000; // free proxies get more time
            const response = await axios.get('https://google.com', {
                httpsAgent: agent,
                httpAgent: agent,
                timeout
            });

            console.log(`IP via proxy: ${response.data.origin}`);
            return response.status === 200;

        } catch (error) {
            console.log(`Proxy failed: ${error.message}`);
            return false;
        }
    }

    async testDirectConnection() {
        console.log('🔍 Testing direct connection...\n');
        try {
            const response = await axios.get('http://httpbin.org/ip', { timeout: 5000 });
            console.log('✅ Direct connection working');
            console.log(`Your IP: ${response.data.origin}\n`);
        } catch (error) {
            console.log('❌ Direct connection failed:', error.message);
        }
    }
}

async function main() {
    // Config validation
    if (!config.proxy || typeof config.proxy.useFreeProxies !== 'boolean') {
        throw new Error('❌ Invalid proxy configuration in config.js');
    }

    const tester = new ProxyTester();

    console.log('='.repeat(50));
    console.log('🚀 PROXY CONFIGURATION TEST');
    console.log('='.repeat(50));
    console.log(`Mode: ${config.proxy.useFreeProxies ? 'FREE PROXIES' : 'PAID PROXIES'}`);
    console.log(`Max Concurrent: ${config.scraper.maxConcurrent}`);
    console.log('='.repeat(50));

    // Test direct connection first
    await tester.testDirectConnection();

    if (config.proxy.useFreeProxies) {
        await tester.testFreeProxies();
    } else {
        await tester.testPaidProxies();
    }

    console.log('\n' + '='.repeat(50));
    console.log('Test completed! Check results above.');
    console.log('='.repeat(50));
}

if (require.main === module) {
    main().catch(console.error);
}
