# Quick Email Setup Guide

To receive password reset emails in your inbox, follow these steps:

## Step 1: Choose Your Email Provider

### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Google account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

3. **Add to `.env` file**:
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   FRONTEND_URL=http://localhost:3000
   APP_NAME=Civix
   ```
   **Important**: Remove spaces from the app password (e.g., `abcdefghijklmnop`)

### Option B: Outlook/Hotmail

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
FRONTEND_URL=http://localhost:3000
APP_NAME=Civix
```

### Option C: Custom SMTP

```env
EMAIL_ENABLED=true
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
FRONTEND_URL=http://localhost:3000
APP_NAME=Civix
```

## Step 2: Test Your Configuration

1. **Restart your backend server** (important - it reads .env on startup)

2. **Test the email service**:
   ```bash
   node testEmail.js your-email@example.com
   ```

3. **Check the output**:
   - If you see "SMTP connection verified successfully" → Email is configured correctly!
   - If you see errors → Check your SMTP settings

## Step 3: Test Password Reset

1. Go to your frontend login page
2. Click "Forgot your password?"
3. Enter your email address
4. Check your inbox (and spam folder) for the reset email

## Troubleshooting

### "SMTP connection verification failed"
- **Gmail**: Make sure you're using an App Password, not your regular password
- **Gmail**: Remove spaces from the app password
- Check SMTP_HOST and SMTP_PORT are correct
- Verify SMTP_USER and SMTP_PASSWORD are set correctly

### "Email service is disabled"
- Make sure `EMAIL_ENABLED=true` (not `EMAIL_ENABLED=true ` with spaces)
- Restart your backend server after changing .env

### Emails going to spam
- Check your spam/junk folder
- Make sure FRONTEND_URL is correct
- Consider using a professional email address

### Still not receiving emails?
1. Run `node testEmail.js your-email@example.com`
2. Check the console output for errors
3. Verify your email provider allows SMTP access
4. Check firewall/antivirus isn't blocking SMTP

## Quick Checklist

- [ ] EMAIL_ENABLED=true in .env
- [ ] SMTP_USER set to your email
- [ ] SMTP_PASSWORD set (App Password for Gmail)
- [ ] SMTP_HOST and SMTP_PORT correct
- [ ] Backend server restarted after .env changes
- [ ] Test email script runs without errors
