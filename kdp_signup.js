const { chromium } = require('playwright');
const fs = require('fs');

// Utils
function randomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  const email = `${randomString()}@gmail.com`;

  fs.mkdirSync(screenshotsDir, { recursive: true });

  const MAX_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours
  const startTime = Date.now();
  let attempt = 0;
  let success = false;

  console.log(`🕐 Starting attempts to create account for ${email}`);
  console.log(`🧭 Will keep trying for up to 5 hours (until ${new Date(startTime + MAX_DURATION_MS).toLocaleString()})\n`);

  while (Date.now() - startTime < MAX_DURATION_MS && !success) {
    const now = new Date().toISOString();
    console.log(`\n🔁 Attempt ${attempt + 1} at ${now}`);

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
      await page.fill('#ap_email', email);
      await page.fill('#ap_password', 'StrongPass123!');
      await page.fill('#ap_password_check', 'StrongPass123!');
      await page.screenshot({ path: `${screenshotsDir}/3-filled-form-${attempt}.png` });

      console.log('📤 Submitting form...');
      await page.click('#continue');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: `${screenshotsDir}/4-after-submit-${attempt}.png` });

      if (await detectCaptcha(page)) {
        console.warn('⚠️ CAPTCHA detected. Retrying...');
        await page.reload();
        await sleep(2000);
        attempt++;
        continue;
      }

      console.log('✅ Account successfully submitted without CAPTCHA.');
      success = true;

    } catch (err) {
      console.error(`❌ Error on attempt ${attempt + 1}:`, err.message);
      await page.screenshot({ path: `${screenshotsDir}/error-${attempt}.png` });
    }

    attempt++;

    if (!success) {
      console.log('⏳ Waiting 10 seconds before next attempt...');
      await sleep(10000); // wait 10 seconds before next attempt
    }
  }

  if (!success) {
    console.error('\n⛔ Stopped after 5 hours without success.');
  }

  await browser.close();
})();
