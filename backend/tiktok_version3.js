// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";

// puppeteer.use(StealthPlugin());

// async function getTikTokDataV3(username) {
//   const browser = await puppeteer.launch({
//     headless: true,
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-blink-features=AutomationControlled',
//       '--disable-features=VizDisplayCompositor'
//     ]
//   });

//   const page = await browser.newPage();

//   // Set exact headers from your request
//   await page.setExtraHTTPHeaders({
//     'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
//     'accept-encoding': 'gzip, deflate, br, zstd',
//     'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8,fr;q=0.7',
//     'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
//     'sec-ch-ua-mobile': '?0',
//     'sec-ch-ua-platform': '"Windows"',
//     'sec-fetch-dest': 'document',
//     'sec-fetch-mode': 'navigate',
//     'sec-fetch-site': 'none',
//     'sec-fetch-user': '?1',
//     'upgrade-insecure-requests': '1'
//   });

//   await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');
//   await page.setViewport({ width: 1920, height: 1080 });

//   // Set basic cookies
//   await page.setCookie({
//     name: 'tiktok_webapp_theme',
//     value: 'dark',
//     domain: '.tiktok.com'
//   }, {
//     name: 'delay_guest_mode_vid',
//     value: '8',
//     domain: '.tiktok.com'
//   }, {
//     name: 'tiktok_webapp_theme_source',
//     value: 'system',
//     domain: '.tiktok.com'
//   });

//   // Block resources for faster loading
//   await page.setRequestInterception(true);
//   page.on('request', (req) => {
//     if (['stylesheet', 'font', 'image', 'media'].includes(req.resourceType())) {
//       req.abort();
//     } else {
//       req.continue();
//     }
//   });

//   const url = `https://www.tiktok.com/@${username}`;
//   console.log(`🌐 Navigating to: ${url}`);

//   try {
//     await page.goto(url, {
//       waitUntil: 'networkidle0',
//       timeout: 100000
//     });
//     console.log('✅ Page loaded successfully');
//   } catch (err) {
//     console.error('❌ Navigation failed:', err.message);
//     await browser.close();
//     throw new Error(`Navigation failed: ${err.message}`);
//   }

//   console.log(`📍 Current URL: ${page.url()}`);
//   console.log(`📄 Page title: ${await page.title()}`);

//   // Wait for the script to load
//   console.log('⏳ Waiting for JSON data to load...');
//   await new Promise(resolve => setTimeout(resolve, 3000));

//   // Extract the JSON data from the __UNIVERSAL_DATA_FOR_REHYDRATION__ script
//   const jsonData = await page.evaluate(() => {
//     const scriptElement = document.querySelector('script#__UNIVERSAL_DATA_FOR_REHYDRATION__');
//     if (!scriptElement) {
//       return null;
//     }

//     try {
//       return JSON.parse(scriptElement.textContent);
//     } catch (e) {
//       console.error('Failed to parse JSON:', e);
//       return { error: 'Failed to parse JSON', rawContent: scriptElement.textContent };
//     }
//   });

//   await browser.close();

//   if (!jsonData) {
//     throw new Error('Could not find __UNIVERSAL_DATA_FOR_REHYDRATION__ script tag');
//   }

//   console.log('📊 Successfully extracted JSON data!');

//   // Extract the webapp.user-detail section specifically
//   let userDetail = null;
//   let followerCount = null;

//   // Navigate through the JSON structure to find webapp.user-detail
//   try {
//     if (jsonData.__DEFAULT_SCOPE__ && jsonData.__DEFAULT_SCOPE__['webapp.user-detail']) {
//       userDetail = jsonData.__DEFAULT_SCOPE__['webapp.user-detail'];
//       console.log('✅ Found webapp.user-detail section!');

//       // Try to extract follower count from user detail
//       if (userDetail.userInfo && userDetail.userInfo.stats) {
//         followerCount = userDetail.userInfo.stats.followerCount;
//         console.log(`📈 Found follower count: ${followerCount}`);
//       } else if (userDetail.user && userDetail.user.stats) {
//         followerCount = userDetail.user.stats.followerCount;
//         console.log(`📈 Found follower count: ${followerCount}`);
//       } else {
//         console.log('🔍 Searching for follower count in user-detail...');
//         console.log('📋 User detail keys:', Object.keys(userDetail));

//         // Log a preview of the user-detail structure
//         console.log('🏗️ User detail structure preview:');
//         console.log(JSON.stringify(userDetail, null, 2));
//       }
//     } else {
//       console.log('❌ webapp.user-detail not found in expected location');
//       console.log('🔍 Available sections in __DEFAULT_SCOPE__:');
//       if (jsonData.__DEFAULT_SCOPE__) {
//         console.log(Object.keys(jsonData.__DEFAULT_SCOPE__));
//       } else {
//         console.log('📋 Root JSON keys:', Object.keys(jsonData));
//       }
//     }
//   } catch (err) {
//     console.error('❌ Error extracting user detail:', err.message);
//   }

//   return {
//     followerCount,
//     userDetail,
//     fullData: jsonData
//   };
// }

// // Enhanced version that also saves the JSON to a file for inspection
// async function getTikTokDataWithFileOutput(username) {
//   try {
//     console.log('🚀 Starting TikTok data extraction V3...');
//     const result = await getTikTokDataV3(username);

//     if (result.followerCount) {
//       console.log('🎉 Success! Followers:', result.followerCount);
//     }

//     if (result.userDetail) {
//       console.log('📋 webapp.user-detail extracted successfully!');
//       console.log('🏗️ User detail structure preview (first 800 chars):');
//       console.log(JSON.stringify(result.userDetail, null, 2));

//       // Save just the user-detail section for easier inspection
//       // import fs from 'fs';
//       // fs.writeFileSync(`tiktok_user_detail_${username}.json`, JSON.stringify(result.userDetail, null, 2));
//       // console.log(`💾 User detail saved to tiktok_user_detail_${username}.json`);
//     } else {
//       console.log('📋 Full JSON data structure (first 1000 chars):');
//       console.log(JSON.stringify(result.fullData, null, 2));
//     }

//     // Optionally save to file for manual inspection
//     // import fs from 'fs';
//     // fs.writeFileSync(`tiktok_data_${username}.json`, JSON.stringify(result.fullData, null, 2));
//     // console.log(`💾 Full JSON data saved to tiktok_data_${username}.json`);

//     return result;
//   } catch (err) {
//     console.error("💥 Error:", err.message);
//     throw err;
//   }
// }

// // Run it
// getTikTokDataWithFileOutput("babyme8651");

// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";

// puppeteer.use(StealthPlugin());

// // Realistic user agent pool
// const USER_AGENTS = [
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0",
// ];

// // Accept language variations
// const ACCEPT_LANGUAGES = [
//   "en-US,en;q=0.9",
//   "en-US,en-GB;q=0.9,en;q=0.8,fr;q=0.7",
//   "en-US,en;q=0.8,es;q=0.7",
//   "en-GB,en;q=0.9,en-US;q=0.8",
//   "en-US,en;q=0.9,de;q=0.8",
// ];

// // Platform variations
// const PLATFORMS = [
//   { platform: '"Windows"', ua: "Windows NT 10.0; Win64; x64" },
//   { platform: '"macOS"', ua: "Macintosh; Intel Mac OS X 10_15_7" },
//   { platform: '"Linux"', ua: "X11; Linux x86_64" },
// ];

// // Chrome version variations
// const CHROME_VERSIONS = [
//   {
//     version: "139",
//     brand: '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
//   },
//   {
//     version: "138",
//     brand: '"Not;A=Brand";v="24", "Chromium";v="138", "Google Chrome";v="138"',
//   },
//   {
//     version: "137",
//     brand: '"Not;A=Brand";v="99", "Google Chrome";v="137", "Chromium";v="137"',
//   },
// ];

// function randomChoice(array) {
//   return array[Math.floor(Math.random() * array.length)];
// }

// function randomInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randomDelay(min = 1000, max = 3000) {
//   return new Promise((resolve) => setTimeout(resolve, randomInt(min, max)));
// }

// // Helper function to parse cookie headers
// function parseCookieHeader(cookieHeader) {
//   const tokens = {};

//   try {
//     // Split by newlines first to handle multiple cookies
//     const cookieLines = cookieHeader.split("\n");

//     cookieLines.forEach((cookieLine) => {
//       if (!cookieLine.trim()) return;

//       // Extract cookie name and value
//       const [nameValue] = cookieLine.split(";");
//       const [name, value] = nameValue.split("=");

//       if (name && value) {
//         const cookieName = name.trim();
//         const cookieValue = value.trim();

//         // Only capture tokens we're interested in
//         if (
//           [
//             "msToken",
//             "ttwid",
//             "tt_csrf_token",
//             "tt_chain_token",
//             "tt_webid_v2",
//           ].includes(cookieName)
//         ) {
//           tokens[cookieName] = cookieValue;
//           console.log(
//             `✅ Found ${cookieName}: ${cookieValue.substring(0, 20)}...`
//           );
//         }
//       }
//     });
//   } catch (e) {
//     console.error("Error parsing cookie:", e.message);
//   }

//   return tokens;
// }

// async function generateRealisticFingerprint() {
//   const platform = randomChoice(PLATFORMS);
//   const chrome = randomChoice(CHROME_VERSIONS);
//   const userAgent = randomChoice(USER_AGENTS);
//   const acceptLang = randomChoice(ACCEPT_LANGUAGES);

//   return {
//     userAgent,
//     platform: platform.platform,
//     acceptLanguage: acceptLang,
//     secChUa: chrome.brand,
//     viewport: {
//       width: randomChoice([1920, 1366, 1536, 1440]),
//       height: randomChoice([1080, 768, 864, 900]),
//     },
//   };
// }

// async function simulateHumanBehavior(page) {
//   // Random mouse movements
//   await page.mouse.move(randomInt(100, 800), randomInt(100, 600), {
//     steps: randomInt(5, 15),
//   });

//   // Random small delay
//   await randomDelay(500, 1500);

//   // Occasional scroll simulation
//   if (Math.random() < 0.3) {
//     await page.evaluate(() => {
//       window.scrollBy(0, Math.random() * 200 + 100);
//     });
//     await randomDelay(800, 2000);
//   }

//   // Random click simulation (without actually clicking anything important)
//   if (Math.random() < 0.2) {
//     await page.mouse.click(randomInt(200, 500), randomInt(200, 400), {
//       delay: randomInt(50, 150),
//     });
//   }
// }

// async function setRealisticCookies(page) {
//   const cookies = [
//     {
//       name: "tiktok_webapp_theme",
//       value: randomChoice(["dark", "light"]),
//       domain: ".tiktok.com",
//     },
//     {
//       name: "delay_guest_mode_vid",
//       value: randomInt(5, 12).toString(),
//       domain: ".tiktok.com",
//     },
//     {
//       name: "tiktok_webapp_theme_source",
//       value: randomChoice(["auto", "system", "manual"]),
//       domain: ".tiktok.com",
//     },
//     {
//       name: "tt_webid",
//       value: `${Date.now()}${randomInt(1000, 9999)}`,
//       domain: ".tiktok.com",
//     },
//     {
//       name: "tt_webid_v2",
//       value: `${Date.now()}${randomInt(10000, 99999)}`,
//       domain: ".tiktok.com",
//     },
//   ];

//   await page.setCookie(...cookies);
// }

// async function extractTikTokTokens(username, retries = 3) {
//   let browser = null;

//   try {
//     const fingerprint = await generateRealisticFingerprint();

//     // Enhanced browser launch options with CAPTCHA avoidance
//     browser = await puppeteer.launch({
//       headless: true, // Make browser visible for debugging
//       devtools: false, // Disable DevTools to avoid detection
//       slowMo: 50, // Add delays between actions
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-blink-features=AutomationControlled",
//         "--exclude-switches=enable-automation",
//         "--disable-extensions",
//         "--disable-plugins",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//         "--no-first-run",
//         "--no-zygote",
//         "--disable-background-networking",
//         "--disable-default-apps",
//         "--disable-sync",
//         "--disable-translate",
//         "--hide-scrollbars",
//         "--metrics-recording-only",
//         "--mute-audio",
//         "--no-default-browser-check",
//         "--safebrowsing-disable-auto-update",
//         "--disable-client-side-phishing-detection",
//         "--disable-component-update",
//         "--disable-default-apps",
//         "--disable-domain-reliability",
//         `--user-agent=${fingerprint.userAgent}`,
//         "--start-maximized", // Start maximized for better visibility
//       ],
//       ignoreDefaultArgs: ["--enable-automation"],
//       executablePath: undefined, // Use default Chrome
//     });

//     const page = await browser.newPage();

//     // Enhanced stealth techniques
//     await page.evaluateOnNewDocument(() => {
//       // Remove webdriver property
//       delete navigator.__proto__.webdriver;

//       // Mock chrome object
//       window.chrome = {
//         runtime: {},
//         loadTimes: function () {},
//         csi: function () {},
//         app: {},
//       };

//       // Mock plugin array
//       Object.defineProperty(navigator, "plugins", {
//         get: function () {
//           return [1, 2, 3, 4, 5].map(() => "Plugin");
//         },
//       });

//       // Mock languages
//       Object.defineProperty(navigator, "languages", {
//         get: function () {
//           return ["en-US", "en"];
//         },
//       });

//       // Mock permissions
//       const originalQuery = window.navigator.permissions.query;
//       window.navigator.permissions.query = (parameters) =>
//         parameters.name === "notifications"
//           ? Promise.resolve({ state: Notification.permission })
//           : originalQuery(parameters);

//       // Mock webGL
//       const getParameter = WebGLRenderingContext.getParameter;
//       WebGLRenderingContext.prototype.getParameter = function (parameter) {
//         if (parameter === 37445) {
//           return "Intel Inc.";
//         }
//         if (parameter === 37446) {
//           return "Intel Iris OpenGL Engine";
//         }
//         return getParameter(parameter);
//       };
//     });

//     // Set realistic viewport
//     await page.setViewport({
//       width: fingerprint.viewport.width,
//       height: fingerprint.viewport.height,
//       deviceScaleFactor: randomChoice([1, 1.25, 1.5, 2]),
//       isMobile: false,
//       hasTouch: false,
//     });

//     // Set realistic headers with variations
//     await page.setExtraHTTPHeaders({
//       accept:
//         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//       "accept-encoding": "gzip, deflate, br, zstd",
//       "accept-language": fingerprint.acceptLanguage,
//       "cache-control": randomChoice(["no-cache", "max-age=0"]),
//       "sec-ch-ua": fingerprint.secChUa,
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": fingerprint.platform,
//       "sec-fetch-dest": "document",
//       "sec-fetch-mode": "navigate",
//       "sec-fetch-site": randomChoice(["none", "same-origin"]),
//       "sec-fetch-user": "?1",
//       "upgrade-insecure-requests": "1",
//       ...(Math.random() < 0.5 ? { dnt: "1" } : {}), // Sometimes include DNT
//     });

//     await page.setUserAgent(fingerprint.userAgent);

//     // Set realistic cookies
//     await setRealisticCookies(page);

//     // Storage for captured tokens from cookies and API calls
//     let capturedTokens = {};
//     let tokensCaptured = false;
//     let cookieTokens = {};

//     // Enhanced request interception
//     await page.setRequestInterception(true);

//     page.on("request", (req) => {
//       const url = req.url();
//       const headers = req.headers();

//       // Add realistic request timing
//       if (Math.random() < 0.1) {
//         setTimeout(() => req.continue(), randomInt(10, 100));
//         return;
//       }

//       // Capture API requests with tokens if available and we have msToken from cookies
//       if (
//         url.includes("/api/post/item_list/") &&
//         !tokensCaptured &&
//         cookieTokens.msToken
//       ) {
//         console.log("🎯 Found API request, using msToken from cookies...");
//         let tempMsToken;
//         try {
//           const urlObj = new URL(url);
//           console.log(urlObj)

//           if (
//             urlObj.searchParams.get("msToken") !== null &&
//             urlObj.searchParams.get("msToken").length > 1
//           ) {
//             tempMsToken = urlObj.searchParams.get("msToken");
//             console.log(
//               `🔍 Found updated msToken in URL: ${tempMsToken.substring(
//                 0,
//                 20
//               )}...`
//             );
//           } else {
//             console.log("✅ Using msToken from cookies, capturing all tokens!");
//           }

//           capturedTokens = {
//             msToken: tempMsToken || cookieTokens.msToken, // Use updated msToken from URL or fallback to cookies
//             xBogus: urlObj.searchParams.get("X-Bogus"),
//             xGnarly: urlObj.searchParams.get("X-Gnarly"),
//             secUid: urlObj.searchParams.get("secUid"),
//             deviceId: urlObj.searchParams.get("device_id"),
//             odinId: urlObj.searchParams.get("odinId"),
//             verifyFp: urlObj.searchParams.get("verifyFp"),
//             webIdLastTime: urlObj.searchParams.get("WebIdLastTime"),
//             aid: urlObj.searchParams.get("aid"),
//             clientABVersions: urlObj.searchParams.get("clientABVersions"),
//             region: urlObj.searchParams.get("region"),
//             tz_name: urlObj.searchParams.get("tz_name"),
//             // Additional parameters for completeness
//             app_name: urlObj.searchParams.get("app_name"),
//             browser_language: urlObj.searchParams.get("browser_language"),
//             browser_name: urlObj.searchParams.get("browser_name"),
//             browser_platform: urlObj.searchParams.get("browser_platform"),
//             browser_version: urlObj.searchParams.get("browser_version"),
//             channel: urlObj.searchParams.get("channel"),
//           };

//           tokensCaptured = true;
//           console.log(
//             "🎉 Tokens successfully captured using msToken from cookies"
//           );

//           console.log(capturedTokens);
//         } catch (e) {
//           console.error("❌ Error parsing token request:", e.message);
//         }
//       }

//       // Block resources intelligently with some randomness
//       const resourceType = req.resourceType();
//       if (["stylesheet", "font", "image", "media"].includes(resourceType)) {
//         // Sometimes let through some resources to appear more natural
//         if (Math.random() < 0.1) {
//           req.continue();
//         } else {
//           req.abort();
//         }
//       } else {
//         req.continue();
//       }
//     });

//     // NEW: Capture tokens from response headers/cookies
//     page.on("response", async (response) => {
//       const url = response.url();

//       // Capture cookies from the main profile page response
//       if (url.includes(`/@${username}`) && response.status() === 200) {
//         console.log("🍪 Capturing tokens from response cookies...");

//         try {
//           const headers = response.headers();
//           console.log("📋 Response headers received");
//           const setCookieHeaders = headers["set-cookie"];

//           if (setCookieHeaders) {
//             console.log(
//               `🔍 Found set-cookie header with ${
//                 setCookieHeaders.split("\n").length
//               } cookies`
//             );

//             // Parse the entire set-cookie header (which contains multiple cookies)
//             const extractedTokens = parseCookieHeader(setCookieHeaders);
//             cookieTokens = { ...cookieTokens, ...extractedTokens };

//             console.log(
//               "✅ Total extracted cookie tokens:",
//               Object.keys(cookieTokens)
//             );
//           } else {
//             console.log("⚠️ No set-cookie header found");
//           }
//         } catch (e) {
//           console.error("❌ Error parsing response cookies:", e.message);
//         }
//       }
//     });

//     const url = `https://www.tiktok.com/@${username}`;
//     console.log(`🌐 Navigating to: ${url}`);

//     // Add pre-navigation delay
//     await randomDelay(1000, 3000);

//     try {
//       await page.goto(url, {
//         waitUntil: randomChoice([
//           "networkidle0",
//           "networkidle2",
//           "domcontentloaded",
//         ]),
//         timeout: randomInt(60000, 100000),
//       });
//       console.log("✅ Page loaded successfully");
//     } catch (err) {
//       console.error("❌ Navigation failed:", err.message);
//       await browser.close();
//       throw new Error(`Navigation failed: ${err.message}`);
//     }

//     // Additional delay before closing
//     await randomDelay(1000, 3000);

//     await browser.close();

//     // Validate we have essential tokens
//     if (!capturedTokens.msToken || !capturedTokens.secUid) {
//       console.log("The extracted tokens");
//       console.log(capturedTokens);
//       throw new Error(
//         `Missing essential tokens - msToken: ${!!capturedTokens.msToken}, secUid: ${!!capturedTokens.secUid}`
//       );
//     }

//     console.log("🎉 Token extraction completed successfully!");
//     return capturedTokens;
//   } catch (error) {
//     if (browser) {
//       await browser.close();
//     }

//     console.error(`❌ Token extraction failed: ${error.message}`);

//     if (retries > 0) {
//       console.log(`🔄 Retrying... (${retries} attempts left)`);
//       // Exponential backoff with jitter
//       const backoffDelay = Math.min(
//         30000,
//         (4 - retries) * 5000 + randomInt(1000, 5000)
//       );
//       await new Promise((resolve) => setTimeout(resolve, backoffDelay));
//       return extractTikTokTokens(username, retries - 1);
//     }

//     throw error;
//   }
// }

// // Enhanced wrapper function with session management
// class TokenExtractorSession {
//   constructor() {
//     this.tokenCache = new Map();
//     this.lastRequestTime = 0;
//     this.requestCount = 0;
//   }

//   async getTokens(username, forceRefresh = false) {
//     // Rate limiting
//     const now = Date.now();
//     const timeSinceLastRequest = now - this.lastRequestTime;
//     const minDelay = randomInt(5000, 15000); // 5-15 seconds between requests

//     if (timeSinceLastRequest < minDelay) {
//       const waitTime = minDelay - timeSinceLastRequest;
//       console.log(
//         `⏳ Rate limiting: waiting ${waitTime}ms before next request`
//       );
//       await new Promise((resolve) => setTimeout(resolve, waitTime));
//     }

//     // Check cache
//     const cached = this.tokenCache.get(username);
//     if (!forceRefresh && cached && now - cached.timestamp < 300000) {
//       // 5 min cache
//       console.log(`📋 Using cached tokens for @${username}`);
//       return cached.tokens;
//     }

//     try {
//       this.requestCount++;
//       this.lastRequestTime = Date.now();

//       console.log(
//         `🚀 Extracting fresh tokens for @${username} (request #${this.requestCount})...`
//       );
//       const tokens = await extractTikTokTokens(username);

//       // Cache the tokens
//       this.tokenCache.set(username, {
//         tokens,
//         timestamp: Date.now(),
//       });

//       console.log("\n🔑 EXTRACTED TOKENS:");
//       console.log(`   secUid: ${tokens.secUid}`);
//       console.log(`   deviceId: ${tokens.deviceId}`);
//       console.log(`   msToken: ${tokens.msToken?.substring(0, 20)}...`);
//       console.log(`   X-Bogus: ${tokens.xBogus}`);
//       console.log(`   X-Gnarly: ${tokens.xGnarly?.substring(0, 20)}...`);

//       return tokens;
//     } catch (err) {
//       console.error("💥 Token extraction failed:", err.message);
//       throw err;
//     }
//   }

//   clearCache() {
//     this.tokenCache.clear();
//     console.log("🗑️ Token cache cleared");
//   }
// }

// // Simple wrapper function
// async function getTikTokTokens(username) {
//   const session = new TokenExtractorSession();
//   return session.getTokens(username);
// }

// // Export for use in other modules
// export { extractTikTokTokens, getTikTokTokens, TokenExtractorSession };

// // Run if this file is executed directly
// getTikTokTokens("babyme8651")
//   .then((tokens) => {
//     console.log("\n📋 Raw tokens object:");
//     console.log(JSON.stringify(tokens, null, 2));
//   })
//   .catch((err) => {
//     console.error("Failed:", err);
//     process.exit(1);
//   });


import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

// Realistic user agent pool
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0",
];

// Accept language variations
const ACCEPT_LANGUAGES = [
  "en-US,en;q=0.9",
  "en-US,en-GB;q=0.9,en;q=0.8,fr;q=0.7",
  "en-US,en;q=0.8,es;q=0.7",
  "en-GB,en;q=0.9,en-US;q=0.8",
  "en-US,en;q=0.9,de;q=0.8",
];

// Platform variations
const PLATFORMS = [
  { platform: '"Windows"', ua: "Windows NT 10.0; Win64; x64" },
  { platform: '"macOS"', ua: "Macintosh; Intel Mac OS X 10_15_7" },
  { platform: '"Linux"', ua: "X11; Linux x86_64" },
];

// Chrome version variations
const CHROME_VERSIONS = [
  {
    version: "139",
    brand: '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
  },
  {
    version: "138",
    brand: '"Not;A=Brand";v="24", "Chromium";v="138", "Google Chrome";v="138"',
  },
  {
    version: "137",
    brand: '"Not;A=Brand";v="99", "Google Chrome";v="137", "Chromium";v="137"',
  },
];

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDelay(min = 1000, max = 3000) {
  return new Promise((resolve) => setTimeout(resolve, randomInt(min, max)));
}

// Helper function to parse cookie headers
function parseCookieHeader(cookieHeader) {
  const tokens = {};

  try {
    // Split by newlines first to handle multiple cookies
    const cookieLines = cookieHeader.split("\n");

    cookieLines.forEach((cookieLine) => {
      if (!cookieLine.trim()) return;

      // Extract cookie name and value
      const [nameValue] = cookieLine.split(";");
      const [name, value] = nameValue.split("=");

      if (name && value) {
        const cookieName = name.trim();
        const cookieValue = value.trim();

        // Only capture tokens we're interested in
        if (
          [
            "msToken",
            "ttwid",
            "tt_csrf_token",
            "tt_chain_token",
            "tt_webid_v2",
          ].includes(cookieName)
        ) {
          tokens[cookieName] = cookieValue;
          console.log(
            `✅ Found ${cookieName}: ${cookieValue.substring(0, 20)}...`
          );
        }
      }
    });
  } catch (e) {
    console.error("Error parsing cookie:", e.message);
  }

  return tokens;
}

async function generateRealisticFingerprint() {
  const platform = randomChoice(PLATFORMS);
  const chrome = randomChoice(CHROME_VERSIONS);
  const userAgent = randomChoice(USER_AGENTS);
  const acceptLang = randomChoice(ACCEPT_LANGUAGES);

  return {
    userAgent,
    platform: platform.platform,
    acceptLanguage: acceptLang,
    secChUa: chrome.brand,
    viewport: {
      width: randomChoice([1920, 1366, 1536, 1440]),
      height: randomChoice([1080, 768, 864, 900]),
    },
  };
}

async function simulateHumanBehavior(page) {
  // Random mouse movements
  await page.mouse.move(randomInt(100, 800), randomInt(100, 600), {
    steps: randomInt(5, 15),
  });

  // Random small delay
  await randomDelay(500, 1500);

  // Occasional scroll simulation
  if (Math.random() < 0.3) {
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 200 + 100);
    });
    await randomDelay(800, 2000);
  }

  // Random click simulation (without actually clicking anything important)
  if (Math.random() < 0.2) {
    await page.mouse.click(randomInt(200, 500), randomInt(200, 400), {
      delay: randomInt(50, 150),
    });
  }
}

async function setRealisticCookies(page) {
  const cookies = [
    {
      name: "tiktok_webapp_theme",
      value: randomChoice(["dark", "light"]),
      domain: ".tiktok.com",
    },
    {
      name: "delay_guest_mode_vid",
      value: randomInt(5, 12).toString(),
      domain: ".tiktok.com",
    },
    {
      name: "tiktok_webapp_theme_source",
      value: randomChoice(["auto", "system", "manual"]),
      domain: ".tiktok.com",
    },
    {
      name: "tt_webid",
      value: `${Date.now()}${randomInt(1000, 9999)}`,
      domain: ".tiktok.com",
    },
    {
      name: "tt_webid_v2",
      value: `${Date.now()}${randomInt(10000, 99999)}`,
      domain: ".tiktok.com",
    },
  ];

  await page.setCookie(...cookies);
}

async function extractTikTokTokens(username, retries = 3) {
  let browser = null;

  return new Promise(async (resolve, reject) => {
    let tokensResolved = false; // Flag to prevent multiple resolves

    try {
      const fingerprint = await generateRealisticFingerprint();

      // Enhanced browser launch options with CAPTCHA avoidance
      browser = await puppeteer.launch({
        headless: true, // Make browser visible for debugging
        devtools: false, // Disable DevTools to avoid detection
        slowMo: 50, // Add delays between actions
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
          "--exclude-switches=enable-automation",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run",
          "--no-zygote",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-translate",
          "--hide-scrollbars",
          "--metrics-recording-only",
          "--mute-audio",
          "--no-default-browser-check",
          "--safebrowsing-disable-auto-update",
          "--disable-client-side-phishing-detection",
          "--disable-component-update",
          "--disable-default-apps",
          "--disable-domain-reliability",
          `--user-agent=${fingerprint.userAgent}`,
          "--start-maximized", // Start maximized for better visibility
        ],
        ignoreDefaultArgs: ["--enable-automation"],
        executablePath: undefined, // Use default Chrome
      });

      const page = await browser.newPage();

      // Enhanced stealth techniques
      await page.evaluateOnNewDocument(() => {
        // Remove webdriver property
        delete navigator.__proto__.webdriver;

        // Mock chrome object
        window.chrome = {
          runtime: {},
          loadTimes: function () {},
          csi: function () {},
          app: {},
        };

        // Mock plugin array
        Object.defineProperty(navigator, "plugins", {
          get: function () {
            return [1, 2, 3, 4, 5].map(() => "Plugin");
          },
        });

        // Mock languages
        Object.defineProperty(navigator, "languages", {
          get: function () {
            return ["en-US", "en"];
          },
        });

        // Mock permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) =>
          parameters.name === "notifications"
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);

        // Mock webGL
        const getParameter = WebGLRenderingContext.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
          if (parameter === 37445) {
            return "Intel Inc.";
          }
          if (parameter === 37446) {
            return "Intel Iris OpenGL Engine";
          }
          return getParameter(parameter);
        };
      });

      // Set realistic viewport
      await page.setViewport({
        width: fingerprint.viewport.width,
        height: fingerprint.viewport.height,
        deviceScaleFactor: randomChoice([1, 1.25, 1.5, 2]),
        isMobile: false,
        hasTouch: false,
      });

      // Set realistic headers with variations
      await page.setExtraHTTPHeaders({
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": fingerprint.acceptLanguage,
        "cache-control": randomChoice(["no-cache", "max-age=0"]),
        "sec-ch-ua": fingerprint.secChUa,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": fingerprint.platform,
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": randomChoice(["none", "same-origin"]),
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        ...(Math.random() < 0.5 ? { dnt: "1" } : {}), // Sometimes include DNT
      });

      await page.setUserAgent(fingerprint.userAgent);

      // Set realistic cookies
      await setRealisticCookies(page);

      // Storage for captured tokens from cookies and API calls
      let capturedTokens = {};
      let tokensCaptured = false;
      let cookieTokens = {};

      // Enhanced request interception
      await page.setRequestInterception(true);

      page.on("request", async (req) => {
        const url = req.url();
        const headers = req.headers();

        // Add realistic request timing
        if (Math.random() < 0.1) {
          setTimeout(() => req.continue(), randomInt(10, 100));
          return;
        }

        // Capture API requests with tokens if available and we have msToken from cookies
        if (
          url.includes("/api/post/item_list/") &&
          !tokensCaptured &&
          cookieTokens.msToken
        ) {
          console.log("🎯 Found API request, using msToken from cookies...");
          let tempMsToken;
          try {
            const urlObj = new URL(url);
            console.log(urlObj);

            if (
              urlObj.searchParams.get("msToken") !== null &&
              urlObj.searchParams.get("msToken").length > 1
            ) {
              tempMsToken = urlObj.searchParams.get("msToken");
              console.log(
                `🔍 Found updated msToken in URL: ${tempMsToken.substring(
                  0,
                  20
                )}...`
              );
            } else {
              console.log("✅ Using msToken from cookies, capturing all tokens!");
            }

            capturedTokens = {
              msToken: tempMsToken || cookieTokens.msToken, // Use updated msToken from URL or fallback to cookies
              xBogus: urlObj.searchParams.get("X-Bogus"),
              xGnarly: urlObj.searchParams.get("X-Gnarly"),
              secUid: urlObj.searchParams.get("secUid"),
              deviceId: urlObj.searchParams.get("device_id"),
              odinId: urlObj.searchParams.get("odinId"),
              verifyFp: urlObj.searchParams.get("verifyFp"),
              webIdLastTime: urlObj.searchParams.get("WebIdLastTime"),
              aid: urlObj.searchParams.get("aid"),
              clientABVersions: urlObj.searchParams.get("clientABVersions"),
              region: urlObj.searchParams.get("region"),
              tz_name: urlObj.searchParams.get("tz_name"),
              // Additional parameters for completeness
              app_name: urlObj.searchParams.get("app_name"),
              browser_language: urlObj.searchParams.get("browser_language"),
              browser_name: urlObj.searchParams.get("browser_name"),
              browser_platform: urlObj.searchParams.get("browser_platform"),
              browser_version: urlObj.searchParams.get("browser_version"),
              channel: urlObj.searchParams.get("channel"),
            };

            tokensCaptured = true;
            console.log(
              "🎉 Tokens successfully captured using msToken from cookies"
            );

            console.log(capturedTokens);

            // EARLY RETURN - Close browser and resolve immediately
            if (!tokensResolved) {
              tokensResolved = true;
              console.log("🚀 Returning tokens immediately, closing browser...");
              
              // Close browser in background without waiting
              browser.close().catch(console.error);
              
              // Resolve with tokens right away
              resolve(capturedTokens);
              return;
            }
          } catch (e) {
            console.error("❌ Error parsing token request:", e.message);
          }
        }

        // Block resources intelligently with some randomness
        const resourceType = req.resourceType();
        if (["stylesheet", "font", "image", "media"].includes(resourceType)) {
          // Sometimes let through some resources to appear more natural
          if (Math.random() < 0.1) {
            req.continue();
          } else {
            req.abort();
          }
        } else {
          req.continue();
        }
      });

      // NEW: Capture tokens from response headers/cookies
      page.on("response", async (response) => {
        const url = response.url();

        // Capture cookies from the main profile page response
        if (url.includes(`/@${username}`) && response.status() === 200) {
          console.log("🍪 Capturing tokens from response cookies...");

          try {
            const headers = response.headers();
            console.log("📋 Response headers received");
            const setCookieHeaders = headers["set-cookie"];

            if (setCookieHeaders) {
              console.log(
                `🔍 Found set-cookie header with ${
                  setCookieHeaders.split("\n").length
                } cookies`
              );

              // Parse the entire set-cookie header (which contains multiple cookies)
              const extractedTokens = parseCookieHeader(setCookieHeaders);
              cookieTokens = { ...cookieTokens, ...extractedTokens };

              console.log(
                "✅ Total extracted cookie tokens:",
                Object.keys(cookieTokens)
              );
            } else {
              console.log("⚠️ No set-cookie header found");
            }
          } catch (e) {
            console.error("❌ Error parsing response cookies:", e.message);
          }
        }
      });

      const url = `https://www.tiktok.com/@${username}`;
      console.log(`🌐 Navigating to: ${url}`);

      // Add pre-navigation delay
      await randomDelay(1000, 3000);

      try {
        // Set a timeout for the entire operation
        const timeoutId = setTimeout(() => {
          if (!tokensResolved) {
            tokensResolved = true;
            browser.close().catch(console.error);
            reject(new Error("Token extraction timeout - no tokens found within time limit"));
          }
        }, 60000); // 60 second timeout

        await page.goto(url, {
          waitUntil: "domcontentloaded", // Changed to faster loading condition
          timeout: 30000, // Reduced timeout
        });
        
        console.log("✅ Page loaded successfully");
        
        // Clear timeout if we get here
        clearTimeout(timeoutId);
        
        // If tokens haven't been captured by now, wait a bit more for API calls
        if (!tokensResolved) {
          console.log("⏳ Waiting for API calls to capture tokens...");
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 more seconds
          
          if (!tokensResolved) {
            tokensResolved = true;
            await browser.close();
            reject(new Error("No tokens were captured from API requests"));
          }
        }
        
      } catch (err) {
        if (!tokensResolved) {
          console.error("❌ Navigation failed:", err.message);
          await browser.close();
          reject(new Error(`Navigation failed: ${err.message}`));
        }
      }

    } catch (error) {
      if (browser && !tokensResolved) {
        await browser.close();
      }

      if (!tokensResolved) {
        console.error(`❌ Token extraction failed: ${error.message}`);

        if (retries > 0) {
          console.log(`🔄 Retrying... (${retries} attempts left)`);
          // Exponential backoff with jitter
          const backoffDelay = Math.min(
            30000,
            (4 - retries) * 5000 + randomInt(1000, 5000)
          );
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          
          try {
            const result = await extractTikTokTokens(username, retries - 1);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        } else {
          reject(error);
        }
      }
    }
  });
}

// Enhanced wrapper function with session management
class TokenExtractorSession {
  constructor() {
    this.tokenCache = new Map();
    this.lastRequestTime = 0;
    this.requestCount = 0;
  }

  async getTokens(username, forceRefresh = false) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = randomInt(5000, 15000); // 5-15 seconds between requests

    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      console.log(
        `⏳ Rate limiting: waiting ${waitTime}ms before next request`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Check cache
    const cached = this.tokenCache.get(username);
    if (!forceRefresh && cached && now - cached.timestamp < 300000) {
      // 5 min cache
      console.log(`📋 Using cached tokens for @${username}`);
      return cached.tokens;
    }

    try {
      this.requestCount++;
      this.lastRequestTime = Date.now();

      console.log(
        `🚀 Extracting fresh tokens for @${username} (request #${this.requestCount})...`
      );
      const tokens = await extractTikTokTokens(username);

      // Cache the tokens
      this.tokenCache.set(username, {
        tokens,
        timestamp: Date.now(),
      });

      console.log("\n🔑 EXTRACTED TOKENS:");
      console.log(`   secUid: ${tokens.secUid}`);
      console.log(`   deviceId: ${tokens.deviceId}`);
      console.log(`   msToken: ${tokens.msToken?.substring(0, 20)}...`);
      console.log(`   X-Bogus: ${tokens.xBogus}`);
      console.log(`   X-Gnarly: ${tokens.xGnarly?.substring(0, 20)}...`);

      return tokens;
    } catch (err) {
      console.error("💥 Token extraction failed:", err.message);
      throw err;
    }
  }

  clearCache() {
    this.tokenCache.clear();
    console.log("🗑️ Token cache cleared");
  }
}

// Simple wrapper function
async function getTikTokTokens(username) {
  const session = new TokenExtractorSession();
  return session.getTokens(username);
}

// Export for use in other modules
export { extractTikTokTokens, getTikTokTokens, TokenExtractorSession };

// Run if this file is executed directly
getTikTokTokens("babyme8651")
  .then((tokens) => {
    console.log("\n📋 Raw tokens object:");
    console.log(JSON.stringify(tokens, null, 2));
  })
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });