import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function getTikTokFollowers(username) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Additional stability
  });
  const page = await browser.newPage();

  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Block unnecessary resources
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

  // Navigate with optimizations
  try {
    await page.goto(url, {
      waitUntil: 'networkidle0', // Changed from domcontentloaded
      timeout: 100000 // Increased timeout
    });
    console.log('✅ Page loaded successfully');
  } catch (err) {
    console.error('❌ Navigation failed:', err.message);
    await browser.close();
    throw new Error(`Navigation failed: ${err.message}`);
  }

  // Debug: Check if we're redirected or blocked
  const currentUrl = page.url();
  console.log(`📍 Current URL after navigation: ${currentUrl}`);

  // Debug: Take a screenshot (optional - remove in production)
  // await page.screenshot({ path: 'debug-screenshot.png' });

  // Debug: Check page title
  const title = await page.title();
  console.log(`📄 Page title: ${title}`);

  // Wait a bit more for dynamic content
  console.log('⏳ Waiting for content to load...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Debug: Log all elements with data-e2e attributes
  console.log('🔍 Searching for data-e2e elements...');
  const dataE2eElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-e2e]');
    return Array.from(elements).map(el => ({
      tag: el.tagName,
      'data-e2e': el.getAttribute('data-e2e'),
      text: el.innerText?.slice(0, 50) // First 50 chars
    }));
  });
  console.log('📊 Found data-e2e elements:', dataE2eElements);

  // Try multiple possible selectors
  const possibleSelectors = [
    'strong[data-e2e="followers-count"]',
    '[data-e2e="followers-count"]',
    'strong[title*="Followers"]',
    'div[data-e2e="followers-count"]',
    '.number[data-e2e="followers-count"]'
  ];

  let followers = null;
  let usedSelector = null;

  for (const selector of possibleSelectors) {
    console.log(`🎯 Trying selector: ${selector}`);
    try {
      // Wait for the element to appear
      await page.waitForSelector(selector, { timeout: 5000 });
      
      followers = await page.$eval(selector, (el) => el.innerText);
      usedSelector = selector;
      console.log(`✅ Found followers with selector "${selector}": ${followers}`);
      break;
    } catch (err) {
      console.log(`❌ Selector "${selector}" failed: ${err.message}`);
    }
  }

  // If still not found, try a more general approach
  if (!followers) {
    console.log('🔄 Trying alternative approach - searching for follower-related text...');
    
    // Look for any element containing follower count patterns
    followers = await page.evaluate(() => {
      // Look for common patterns
      const patterns = [
        /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*(?:followers?|Followers?)/i,
        /followers?\s*(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)/i
      ];
      
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.innerText || el.textContent || '';
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            console.log('Found follower text:', text);
            return match[1];
          }
        }
      }
      return null;
    });
    
    if (followers) {
      console.log(`✅ Found followers via text search: ${followers}`);
      usedSelector = 'text-search';
    }
  }

  // Debug: If still not found, log page content structure
  if (!followers) {
    console.log('❌ Followers count not found. Logging page structure...');
    
    const bodyContent = await page.evaluate(() => {
      return document.body.innerHTML.slice(0, 1000); // First 1000 chars
    });
    console.log('📝 Body content preview:', bodyContent);

    // Check if there are any anti-bot measures
    const possibleBlocks = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase();
      return {
        hasAccessDenied: body.includes('access denied'),
        hasBlocked: body.includes('blocked'),
        hasCaptcha: body.includes('captcha'),
        hasVerify: body.includes('verify'),
        isEmpty: body.trim().length < 100
      };
    });
    console.log('🚫 Possible blocking indicators:', possibleBlocks);
  }

  await browser.close();

  if (!followers) {
    throw new Error('Could not find followers count with any selector');
  }

  // Parse the followers count
  const cleanFollowers = followers.replace(/,/g, "");
  const numericFollowers = parseInt(cleanFollowers);
  
  console.log(`📈 Final result: ${followers} → ${numericFollowers}`);
  console.log(`🎯 Used selector: ${usedSelector}`);
  
  return numericFollowers;
}

// Run
(async () => {
  try {
    console.log('🚀 Starting TikTok scraper...');
    const finalFollowers = await getTikTokFollowers("babyme8651");
    console.log('🎉 Success! Followers:', finalFollowers);
  } catch (err) {
    console.error("💥 Error:", err.message);
  }
})();
