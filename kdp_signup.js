const { chromium } = require('playwright');
const fs = require('fs');

// Utility to generate random string
function randomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Create screenshots folder
  fs.mkdirSync('screenshots', { recursive: true });

  // Generate randomized email
  const randomEmail = `${randomString()}@qrlfoundation.org`;

  try {
    await page.goto('https://kdp.amazon.com');
    await page.screenshot({ path: 'screenshots/1-home.png' });

    // Click "Join KDP"
    await page.click('a[href="/signup"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/2-join-kdp.png' });

    // Fill out the form
    await page.fill('#ap_customer_name', 'Random User');
    await page.fill('#ap_email', randomEmail);
    await page.fill('#ap_password', 'StrongPass123!');
    await page.fill('#ap_password_check', 'StrongPass123!');
    await page.screenshot({ path: 'screenshots/3-filled-form.png' });

    // Submit form
    await page.click('#continue');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/4-after-submit.png' });

    // Check for captcha
    const captcha = await page.locator('input[name="cvf_captcha_input"]').count();
    if (captcha > 0) {
      console.log("Captcha detected. Refreshing...");
      await page.reload();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/5-captcha-refresh.png' });
    }

  } catch (err) {
    console.error("Script failed:", err);
  } finally {
    await browser.close();
  }
})();
