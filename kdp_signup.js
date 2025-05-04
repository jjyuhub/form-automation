const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Create screenshots folder
  fs.mkdirSync('screenshots', { recursive: true });

  try {
    await page.goto('https://kdp.amazon.com');
    await page.screenshot({ path: 'screenshots/1-home.png' });

    // Click "Join KDP"
    await page.click('a[href="/signup"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/2-join-kdp.png' });

    // Fill out the form
    await page.fill('#ap_customer_name', 'Test User');
    await page.fill('#ap_email', 'testuser@example.com');
    await page.fill('#ap_password', 'TestPassword123');
    await page.fill('#ap_password_check', 'TestPassword123');
    await page.screenshot({ path: 'screenshots/3-filled-form.png' });

    // Submit form
    await page.click('#continue');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/4-after-submit.png' });

    // Check for captcha
    const captcha = await page.locator('input[name="cvf_captcha_input"]').count();
    if (captcha > 0) {
      console.log("Captcha page detected. Refreshing.");
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
