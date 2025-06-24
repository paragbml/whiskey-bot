const puppeteer = require('undetected-puppeteer');
const { sendEmail, sendSMS } = require('./notifier');
require('dotenv').config();

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const TARGET_URL = 'https://www.finewineandgoodspirits.com/c/whiskey/whiskey/1010102?q=%3Arelevance%3AproductType%3ABourbon%3AinStockFlag%3Atrue';

async function login(page) {
  await page.goto('https://www.finewineandgoodspirits.com/', { waitUntil: 'domcontentloaded' });

  // 🧓 Accept age gate (21+)
  try {
    console.log('🕐 Waiting for age gate...');
    await page.waitForSelector('div.age-gate__cta button.button', { visible: true, timeout: 10000 });
    await new Promise(res => setTimeout(res, 500));
    await page.click('div.age-gate__cta button.button');
    console.log('✅ Age gate accepted');
    await new Promise(res => setTimeout(res, 1000));
  } catch (err) {
    console.log('⚠️ Age gate not found or already accepted');
  }

  // 🍪 Accept cookie banner
  try {
    await page.click('#onetrust-accept-btn-handler');
    console.log('✅ Cookie banner accepted');
  } catch {}

  console.log('⏳ Waiting for page to stabilize...');
  await new Promise(res => setTimeout(res, 3000));

  // 📸 Screenshot before login click
  const screenshotBuffer = await page.screenshot();
  console.log('📸 Screenshot taken BEFORE trying to click login');
  console.log('====LOGIN PAGE SCREENSHOT BASE64====');
  console.log(screenshotBuffer.toString('base64'));
  console.log('====END SCREENSHOT====');

  console.log('🔎 Looking for login button...');
  await page.waitForSelector('button.modal-header-login', { visible: true, timeout: 30000 });
  await page.click('button.modal-header-login');
  console.log('✅ Login button clicked');

  // ⏳ Wait for modal animation and loa
