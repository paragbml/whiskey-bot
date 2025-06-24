const { sendEmail } = require('./notifier');

sendEmail('Test Whiskey Bot', 'This is a test email from your whiskey bot.')
  .then(() => console.log('Test email sent!'))
  .catch(err => console.error(err));
