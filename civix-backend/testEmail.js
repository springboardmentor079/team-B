// Quick script to test your email configuration.
// Usage:
//   node testEmail.js youremail@example.com
//
// It will:
// 1. Load .env
// 2. Verify the SMTP connection (if EMAIL_ENABLED=true)
// 3. Send a simple test email using the password-reset template

require('dotenv').config();

const mailer = require('./mailer');

async function main() {
  // Get email from command line, .env, or use a default test email
  const to = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';

  if (!to || to === 'test@example.com') {
    console.log('ℹ️  No email provided. Using test email for demonstration.');
    console.log('   To test with your email, run: node testEmail.js youremail@example.com\n');
  }

  console.log('--- Email Test ---');
  console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('Test recipient:', to);
  console.log('------------------\n');

  try {
    // Optional: verify transporter if email is enabled
    if (process.env.EMAIL_ENABLED === 'true') {
      const ok = await mailer.verifyConnection();
      if (!ok) {
        console.warn(
          'Warning: SMTP connection verification failed. ' +
          'Check your SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD.'
        );
      } else {
        console.log('SMTP connection verified successfully.\n');
      }
    } else {
      console.log(
        'EMAIL_ENABLED is not true, running in console mode.\n' +
        'No real email will be sent; the reset link will be printed to the console.\n'
      );
    }

    // Use password-reset template as a convenient test
    const fakeToken = 'test-token-' + Date.now().toString(16);
    await mailer.sendPasswordResetEmail(to, fakeToken);

    console.log('\nTest email process completed.');
    console.log(
      'If EMAIL_ENABLED=true and SMTP is correct, check your inbox.\n' +
      'If EMAIL_ENABLED is false, check this console for the reset link output.'
    );
    process.exit(0);
  } catch (err) {
    console.error('Error while sending test email:', err.message || err);
    process.exit(1);
  }
}

main();

