// Helper script to enable email in .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('\n📧 Email Configuration Helper\n');
console.log('='.repeat(50));

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('Creating a new .env file...\n');
  
  // Create basic .env file
  const basicEnv = `# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FRONTEND_URL=http://localhost:3000
APP_NAME=Civix
`;
  
  fs.writeFileSync(envPath, basicEnv);
  console.log('✅ Created .env file with email configuration template.');
  console.log('\n⚠️  Please edit .env and replace:');
  console.log('   - your-email@gmail.com → Your actual email');
  console.log('   - your-gmail-app-password → Your Gmail App Password\n');
  process.exit(0);
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Check current EMAIL_ENABLED status
const emailEnabledMatch = envContent.match(/EMAIL_ENABLED\s*=\s*(.+)/i);
const currentValue = emailEnabledMatch ? emailEnabledMatch[1].trim() : null;

console.log(`Current EMAIL_ENABLED value: ${currentValue || 'NOT SET'}\n`);

if (currentValue === 'true') {
  console.log('✅ EMAIL_ENABLED is already set to true!');
  console.log('\nRun: node checkEmailConfig.js to verify full configuration.\n');
  process.exit(0);
}

// Update EMAIL_ENABLED to true
if (emailEnabledMatch) {
  // Replace existing value
  envContent = envContent.replace(
    /EMAIL_ENABLED\s*=\s*.+/i,
    'EMAIL_ENABLED=true'
  );
  console.log('✅ Updated EMAIL_ENABLED from false to true');
} else {
  // Add EMAIL_ENABLED if it doesn't exist
  envContent += '\n# Email Configuration\nEMAIL_ENABLED=true\n';
  console.log('✅ Added EMAIL_ENABLED=true to .env file');
}

// Check if SMTP settings exist
const hasSmtpHost = /SMTP_HOST\s*=/.test(envContent);
const hasSmtpUser = /SMTP_USER\s*=/.test(envContent);
const hasSmtpPassword = /SMTP_PASSWORD\s*=|SMTP_APP_PASSWORD\s*=/.test(envContent);

if (!hasSmtpHost || !hasSmtpUser || !hasSmtpPassword) {
  console.log('\n⚠️  SMTP configuration is incomplete!');
  console.log('\nAdding SMTP template...');
  
  // Add SMTP configuration if missing
  if (!hasSmtpHost) envContent += 'SMTP_HOST=smtp.gmail.com\n';
  if (!hasSmtpUser) envContent += 'SMTP_USER=your-email@gmail.com\n';
  if (!hasSmtpPassword) envContent += 'SMTP_PASSWORD=your-gmail-app-password\n';
  if (!/SMTP_PORT\s*=/.test(envContent)) envContent += 'SMTP_PORT=587\n';
  if (!/SMTP_SECURE\s*=/.test(envContent)) envContent += 'SMTP_SECURE=false\n';
  if (!/FRONTEND_URL\s*=/.test(envContent)) envContent += 'FRONTEND_URL=http://localhost:3000\n';
  if (!/APP_NAME\s*=/.test(envContent)) envContent += 'APP_NAME=Civix\n';
  
  console.log('✅ Added SMTP configuration template');
}

// Write back to .env
fs.writeFileSync(envPath, envContent);

console.log('\n✅ .env file updated successfully!');
console.log('\n📝 Next steps:');
console.log('   1. Edit .env file and replace placeholder values:');
console.log('      - your-email@gmail.com → Your actual email');
console.log('      - your-gmail-app-password → Your Gmail App Password');
console.log('   2. For Gmail: Get App Password at https://myaccount.google.com/apppasswords');
console.log('   3. Restart your backend server');
console.log('   4. Run: node checkEmailConfig.js to verify\n');
