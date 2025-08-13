import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function getTikTokDataV3(username) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  const page = await browser.newPage();

  // Set exact headers from your request
  await page.setExtraHTTPHeaders({
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8,fr;q=0.7',
    'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1'
  });

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  // Set basic cookies
  await page.setCookie({
    name: 'tiktok_webapp_theme',
    value: 'dark',
    domain: '.tiktok.com'
  }, {
    name: 'delay_guest_mode_vid',
    value: '8',
    domain: '.tiktok.com'
  }, {
    name: 'tiktok_webapp_theme_source',
    value: 'system',
    domain: '.tiktok.com'
  });

  // Block resources for faster loading
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['stylesheet', 'font', 'image', 'media'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const url = `https://www.tiktok.com/@${username}`;
  console.log(`🌐 Navigating to: ${url}`);

  try {
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 100000
    });
    console.log('✅ Page loaded successfully');
  } catch (err) {
    console.error('❌ Navigation failed:', err.message);
    await browser.close();
    throw new Error(`Navigation failed: ${err.message}`);
  }

  console.log(`📍 Current URL: ${page.url()}`);
  console.log(`📄 Page title: ${await page.title()}`);

  // Wait for the script to load
  console.log('⏳ Waiting for JSON data to load...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Extract the JSON data from the __UNIVERSAL_DATA_FOR_REHYDRATION__ script
  const jsonData = await page.evaluate(() => {
    const scriptElement = document.querySelector('script#__UNIVERSAL_DATA_FOR_REHYDRATION__');
    if (!scriptElement) {
      return null;
    }
    
    try {
      return JSON.parse(scriptElement.textContent);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return { error: 'Failed to parse JSON', rawContent: scriptElement.textContent };
    }
  });

  await browser.close();

  if (!jsonData) {
    throw new Error('Could not find __UNIVERSAL_DATA_FOR_REHYDRATION__ script tag');
  }

  console.log('📊 Successfully extracted JSON data!');
  
  // Extract the webapp.user-detail section specifically
  let userDetail = null;
  let followerCount = null;
  
  // Navigate through the JSON structure to find webapp.user-detail
  try {
    if (jsonData.__DEFAULT_SCOPE__ && jsonData.__DEFAULT_SCOPE__['webapp.user-detail']) {
      userDetail = jsonData.__DEFAULT_SCOPE__['webapp.user-detail'];
      console.log('✅ Found webapp.user-detail section!');
      
      // Try to extract follower count from user detail
      if (userDetail.userInfo && userDetail.userInfo.stats) {
        followerCount = userDetail.userInfo.stats.followerCount;
        console.log(`📈 Found follower count: ${followerCount}`);
      } else if (userDetail.user && userDetail.user.stats) {
        followerCount = userDetail.user.stats.followerCount;
        console.log(`📈 Found follower count: ${followerCount}`);
      } else {
        console.log('🔍 Searching for follower count in user-detail...');
        console.log('📋 User detail keys:', Object.keys(userDetail));
        
        // Log a preview of the user-detail structure
        console.log('🏗️ User detail structure preview:');
        console.log(JSON.stringify(userDetail, null, 2));
      }
    } else {
      console.log('❌ webapp.user-detail not found in expected location');
      console.log('🔍 Available sections in __DEFAULT_SCOPE__:');
      if (jsonData.__DEFAULT_SCOPE__) {
        console.log(Object.keys(jsonData.__DEFAULT_SCOPE__));
      } else {
        console.log('📋 Root JSON keys:', Object.keys(jsonData));
      }
    }
  } catch (err) {
    console.error('❌ Error extracting user detail:', err.message);
  }

  return {
    followerCount,
    userDetail,
    fullData: jsonData
  };
}

// Enhanced version that also saves the JSON to a file for inspection
async function getTikTokDataWithFileOutput(username) {
  try {
    console.log('🚀 Starting TikTok data extraction V3...');
    const result = await getTikTokDataV3(username);
    
    if (result.followerCount) {
      console.log('🎉 Success! Followers:', result.followerCount);
    }
    
    if (result.userDetail) {
      console.log('📋 webapp.user-detail extracted successfully!');
      console.log('🏗️ User detail structure preview (first 800 chars):');
      console.log(JSON.stringify(result.userDetail, null, 2));
      
      // Save just the user-detail section for easier inspection
      // import fs from 'fs';
      // fs.writeFileSync(`tiktok_user_detail_${username}.json`, JSON.stringify(result.userDetail, null, 2));
      // console.log(`💾 User detail saved to tiktok_user_detail_${username}.json`);
    } else {
      console.log('📋 Full JSON data structure (first 1000 chars):');
      console.log(JSON.stringify(result.fullData, null, 2));
    }
    
    // Optionally save to file for manual inspection
    // import fs from 'fs';
    // fs.writeFileSync(`tiktok_data_${username}.json`, JSON.stringify(result.fullData, null, 2));
    // console.log(`💾 Full JSON data saved to tiktok_data_${username}.json`);
    
    return result;
  } catch (err) {
    console.error("💥 Error:", err.message);
    throw err;
  }
}

// Run it
getTikTokDataWithFileOutput("babyme8651");
