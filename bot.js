console.log('🚀 Bot starting up...');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { sendEmail, sendSMS } = require('./notifier');
require('dotenv').config();

puppeteer.use(StealthPlugin());

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const TARGET_URL = 'https://www.finewineandgoodspirits.com/c/whiskey/whiskey/1010102?q=%3Arelevance%3AproductType%3ABourbon%3AinStockFlag%3Atrue';

async function login(page) {
  await page.goto('https://www.finewineandgoodspirits.com/', { waitUntil: 'domcontentloaded' });

  try { await page.click('div.age-gate__cta button.button'); } catch {}
  try { await page.click('#onetrust-accept-btn-handler'); } catch {}

  console.log('⏳ Waiting for page to stabilize...');
  await page.waitForTimeout(5000);

  const screenshotBuffer = await page.screenshot();
  console.log('📸 Screenshot taken before trying to click login');
  console.log('====LOGIN PAGE SCREENSHOT BASE64====');
  console.log(screenshotBuffer.toString('base64'));
  console.log('====END SCREENSHOT====');

  console.log('🔎 Looking for login button...');
  await page.waitForSelector('button.modal-header-login', { visible: true, timeout: 30000 });
  await page.click('button.modal-header-login');
  console.log('✅ Login button clicked');

  await page.waitForSelector('#authentication_header_login_form_email', { visible: true, timeout: 10000 });
  await page.type('#authentication_header_login_form_email', EMAIL, { delay: 50 });
  await page.type('#authentication_header_login_form_password', PASSWORD, { delay: 50 });
  await page.click('form[aria-label="Login Form"] button[type="submit"]');

  await page.waitForSelector('#account-popover-open .loginOrAccountText', { visible: true, timeout: 10000 });
  console.log('🎉 Logged in successfully');
}

async function monitor() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Force desktop site for better consistency
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  await login(page);
  let seenProducts = new Set();

  while (true) {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const products = await page.$$eval('.product-tile .product-name', els => els.map(e => e.textContent.trim()));
    const newProducts = products.filter(name => !seenProducts.has(name));

    if (newProducts.length > 0) {
      console.log('🆕 New products detected:', newProducts);
      for (const name of newProducts) seenProducts.add(name);

      const alertText = `New Whiskey Alert!\n${newProducts.join('\n')}\n${TARGET_URL}`;
      await sendEmail('New Whiskey Available!', alertText);
      await sendSMS(alertText);

      const firstProductLink = await page.$('.product-tile a');
      if (firstProductLink) {
        await firstProductLink.click();
        await page.waitForSelector('button.add-to-cart', { visible: true, timeout: 5000 });
        await page.click('button.add-to-cart');
        console.log('🛒 Product added to cart!');

        const cartScreenshot = await page.screenshot();
        console.log('====ADDED TO CART SCREENSHOT BASE64====');
        console.log(cartScreenshot.toString('base64'));
        console.log('====END CART SCREENSHOT====');
      }
    } else {
      console.log('🔎 No new products. Checking again...');
    }

    await new Promise(res => setTimeout(res, 10000)); // 10s delay between checks
  }
}

monitor().catch(err => console.error(err));
