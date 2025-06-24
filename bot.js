const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { sendEmail } = require('./notifier');
require('dotenv').config();

puppeteer.use(StealthPlugin());

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const TARGET_URL = 'https://www.finewineandgoodspirits.com/c/whiskey/whiskey/1010102?q=%3Arelevance%3AproductType%3ABourbon%3AinStockFlag%3Atrue';

async function login(page) {
  await page.goto('https://www.finewineandgoodspirits.com/', { waitUntil: 'domcontentloaded' });

  try {
    await page.waitForSelector('div.age-gate__cta button.button', { timeout: 5000 });
    await page.click('div.age-gate__cta button.button');
    console.log('✅ Age gate passed');
    await page.waitForTimeout(1000);
  } catch {
    console.log('ℹ️ Age gate not shown');
  }

  try {
    await page.click('#onetrust-accept-btn-handler');
  } catch {}

  await page.waitForTimeout(2000);

  await page.waitForSelector('button.modal-header-login', { timeout: 10000 });
  await page.click('button.modal-header-login');
  console.log('✅ Clicked login button');
  await page.waitForTimeout(3000);

  await page.waitForSelector('#authentication_header_login_form_email', { timeout: 10000 });
  await page.type('#authentication_header_login_form_email', EMAIL);
  await page.type('#authentication_header_login_form_password', PASSWORD);
  await page.click('form[aria-label="Login Form"] button[type="submit"]');
  console.log('🔐 Submitted login form');

  await page.waitForSelector('#account-popover-open .loginOrAccountText', { timeout: 10000 });
  console.log('🎉 Logged in successfully');
}

async function monitor() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36');

  await login(page);

  const seen = new Set();

  while (true) {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const products = await page.$$eval('.product-tile .product-name', els =>
      els.map(e => e.textContent.trim())
    );

    const newProducts = products.filter(name => !seen.has(name));
    newProducts.forEach(name => seen.add(name));

    if (newProducts.length > 0) {
      console.log('🆕 New products found:', newProducts);
      const message = `New whiskey found:\n${newProducts.join('\n')}\n${TARGET_URL}`;
      await sendEmail('New Whiskey Alert', message);

      const firstProduct = await page.$('.product-tile a');
      if (firstProduct) {
        await firstProduct.click();
        await page.waitForSelector('button.add-to-cart', { timeout: 10000 });
        await page.click('button.add-to-cart');
        console.log('🛒 Added product to cart');
      }
    } else {
      console.log('🔁 No new products. Retrying...');
    }

    await page.waitForTimeout(10000); // wait 10s before next check
  }
}

monitor().catch(err => {
  console.error('❌ Bot error:', err);
});
