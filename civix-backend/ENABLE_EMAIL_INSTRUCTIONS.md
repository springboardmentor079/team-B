# How to Enable Email - Quick Steps

## Current Status
Your `EMAIL_ENABLED` is currently set to `false`. Here's how to enable it:

## Step-by-Step Instructions

### 1. Open your `.env` file
- Navigate to: `civix-backend/.env`
- Open it in any text editor (Notepad, VS Code, etc.)

### 2. Find the EMAIL_ENABLED line
Look for a line that says:
```
EMAIL_ENABLED=false
```
or if it doesn't exist, you'll need to add it.

### 3. Change it to:
```
EMAIL_ENABLED=true
```

### 4. Add SMTP Configuration
Add these lines to your `.env` file (if they don't exist):

**For Gmail:**
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FRONTEND_URL=http://localhost:3000
APP_NAME=Civix
```

**For Outlook:**
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

### 5. Important Notes:

**For Gmail users:**
- You MUST use an App Password, not your regular password
- Get App Password: https://myaccount.google.com/apppasswords
- Remove spaces from the app password (e.g., `abcdefghijklmnop`)

**Replace these values:**
- `your-email@gmail.com` → Your actual email
- `your-gmail-app-password` → Your 16-character Gmail App Password

### 6. Save the file

### 7. Restart your backend server
- Stop the server (Ctrl+C)
- Start it again: `npm run dev`

### 8. Verify it worked
Run:
```bash
node checkEmailConfig.js
```

You should now see:
```
EMAIL_ENABLED: true ✅
```

## Example .env File

Here's what a complete email configuration section looks like:

```env
# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=myemail@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
FRONTEND_URL=http://localhost:3000
APP_NAME=Civix
```

## After Enabling

1. Test email: `node testEmail.js your-email@example.com`
2. Request password reset from frontend
3. Check your inbox!

## Troubleshooting

If `checkEmailConfig.js` still shows `false`:
- Make sure there are no spaces: `EMAIL_ENABLED=true` (not `EMAIL_ENABLED = true`)
- Make sure it's exactly `true` (lowercase)
- Restart your backend server after saving
- Check for typos in the .env file
