// Quick script to check your email configuration
require('dotenv').config();

console.log('\n📧 Email Configuration Check\n');
console.log('='.repeat(50));

// Check EMAIL_ENABLED
const emailEnabled = process.env.EMAIL_ENABLED === 'true';
console.log(`EMAIL_ENABLED: ${process.env.EMAIL_ENABLED || 'false'} ${emailEnabled ? '✅' : '❌'}`);

if (!emailEnabled) {
  console.log('\n⚠️  Email is DISABLED. To enable:');
  console.log('   1. Set EMAIL_ENABLED=true in your .env file');
  console.log('   2. Configure SMTP settings (see SETUP_EMAIL.md)');
  console.log('   3. Restart your backend server\n');
  process.exit(0);
}

// Check SMTP configuration
console.log(`\nSMTP Configuration:`);
console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
console.log(`  SMTP_SECURE: ${process.env.SMTP_SECURE || 'false'}`);
console.log(`  SMTP_USER: ${process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  SMTP_PASSWORD: ${process.env.SMTP_PASSWORD || process.env.SMTP_APP_PASSWORD ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);

// Validation
const hasUser = !!process.env.SMTP_USER;
const hasPassword = !!(process.env.SMTP_PASSWORD || process.env.SMTP_APP_PASSWORD);
const hasHost = !!process.env.SMTP_HOST;

if (!hasUser || !hasPassword || !hasHost) {
  console.log('\n❌ Email configuration is INCOMPLETE!');
  console.log('\nRequired settings:');
  if (!hasUser) console.log('  - SMTP_USER (your email address)');
  if (!hasPassword) console.log('  - SMTP_PASSWORD or SMTP_APP_PASSWORD');
  if (!hasHost) console.log('  - SMTP_HOST (e.g., smtp.gmail.com)');
  console.log('\nSee SETUP_EMAIL.md for detailed instructions.\n');
  process.exit(1);
}

console.log('\n✅ Email configuration looks good!');
console.log('\nNext steps:');
console.log('  1. Restart your backend server');
console.log('  2. Test with: node testEmail.js your-email@example.com');
console.log('  3. Request a password reset from your frontend\n');
