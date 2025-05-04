const { chromium } = require('playwright');
const fs = require('fs');

// Utility: generate a random email
function randomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Utility: create delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CAPTCHA / puzzle keywords to detect
const CAPTCHA_KEYWORDS = [
  'enter the characters you see',
  'type the characters',
  'solve the puzzle',
  'security check',
  'captcha',
  'word puzzle',
];

async function detectCaptcha(page) {
  const content = await page.content();
  return CAPTCHA_KEYWORDS.some(keyword => content.toLowerCase().includes(keyword));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const screenshotsDir = 'screenshots';
  const randomEmail = `${randomString()}@qrlfoundation.org`;

  fs.mkdirSync(screenshotsDir, { recursive: true });

  const MAX_RETRIES = 3;
  let attempt = 0;
  let success = false;

  while (attempt < MAX_RETRIES && !success) {
    console.log(`\n🔁 Attempt ${attempt + 1}/${MAX_RETRIES}`);

    try {
      console.log('🌐 Navigating to KDP homepage...');
      await page.goto('https://kdp.amazon.com', { waitUntil: 'load' });
      await page.screenshot({ path: `${screenshotsDir}/1-home-${attempt}.png` });

      console.log('🔘 Clicking "Join KDP"...');
      await page.click('a[href="/signup"]');
      await page.waitForLoadState('networkidle');
      await sleep(2000);
      await page.screenshot({ path: `${screenshotsDir}/2-join-kdp-${attempt}.png` });

      console.log('📝 Filling out form...');
      await page.fill('#ap_customer_name', 'Random User');
      await page.fill('#ap_email', randomEmail);
      await page.fill('#ap_password', 'StrongPass123!');
      await page.fill('#ap_password_check', 'StrongPass123!');
      await page.screenshot({ path: `${screenshotsDir}/3-filled-form-${attempt}.png` });

      console.log('📤 Submitting form...');
      await page.click('#continue');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: `${screenshotsDir}/4-after-submit-${attempt}.png` });

      if (await detectCaptcha(page)) {
        console.warn('⚠️ CAPTCHA or puzzle detected. Retrying...');
        await page.reload();
        await page.waitForTimeout(3000);
        attempt++;
        continue;
      }

      console.log('✅ Account creation submitted successfully (no CAPTCHA).');
      success = true;

    } catch (err) {
      console.error(`❌ Error on attempt ${attempt + 1}:`, err.message);
      await page.screenshot({ path: `${screenshotsDir}/error-${attempt}.png` });
      attempt++;
    }
  }

  if (!success) {
    console.error('🚫 Failed after max retries. CAPTCHA could not be bypassed.');
  }

  await browser.close();
})();
