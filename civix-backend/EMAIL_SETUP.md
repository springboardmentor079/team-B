# Email Setup Guide for Civix

This guide will help you configure email sending for password reset and verification emails.

## Quick Setup

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account
   - Go to: https://myaccount.google.com/security

2. **Generate an App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Add to your `.env` file**:
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   FRONTEND_URL=http://localhost:3000
   APP_NAME=Civix
   ```

### Option 2: Outlook/Hotmail

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Option 3: Custom SMTP Server

```env
EMAIL_ENABLED=true
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
```

## Testing Email Configuration

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Request a password reset through the API or frontend

3. Check:
   - **If configured correctly**: Email will be sent to the user's inbox
   - **If not configured**: Reset link will be logged to console

## Console Mode (Development)

If you don't configure email settings, the system will automatically log reset links to the console. This is useful for development and testing.

When you request a password reset, check your backend console for output like:
```
=== Password Reset Email (Console Mode) ===
To: user@example.com
Reset Link: http://localhost:3000/?token=abc123...
Token: abc123...
==========================================
```

## Troubleshooting

### "Email service verification failed"
- Check your SMTP credentials
- For Gmail: Make sure you're using an App Password, not your regular password
- Verify SMTP_HOST and SMTP_PORT are correct

### "SMTP credentials not configured"
- Set `EMAIL_ENABLED=true` in your `.env` file
- Add `SMTP_USER` and `SMTP_PASSWORD` environment variables

### Emails going to spam
- Make sure `FRONTEND_URL` is set correctly
- Use a professional email address as `SMTP_USER`
- Consider using a dedicated email service (SendGrid, AWS SES) for production

## Production Recommendations

For production environments, consider using:
- **SendGrid**: Easy setup, good deliverability
- **AWS SES**: Cost-effective, scalable
- **Mailgun**: Developer-friendly API
- **Postmark**: Great for transactional emails

To integrate these services, modify `services/emailService.js` to add support for their APIs.

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_ENABLED` | Enable/disable email sending | `false` | No |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | Yes (if EMAIL_ENABLED=true) |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_SECURE` | Use SSL/TLS | `false` | No |
| `SMTP_USER` | Email address for authentication | - | Yes (if EMAIL_ENABLED=true) |
| `SMTP_PASSWORD` | Email password or app password | - | Yes (if EMAIL_ENABLED=true) |
| `FRONTEND_URL` | Frontend URL for reset links | `http://localhost:3000` | No |
| `APP_NAME` | Application name (used in emails) | `Civix` | No |
