const { sendEmail, sendSMS } = require('./notifier');
sendEmail('Test Whiskey Alert', 'This is a test alert. New whiskey available!\nhttps://www.finewineandgoodspirits.com/')
  .then(() => console.log('✅ Test email sent!'))
  .catch(err => console.error(err));
