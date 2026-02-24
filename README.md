# Team-B Petition Management System
---

## 📁 Project Structure

```
team-B/
│
├── backend/
├── frontend/
├── admin-panel/
└── README.md
```

---

## ⚙️ Getting Started

Make sure you have installed:

* Node.js
* npm

---

## ▶ Run the Project Locally

### Backend

```bash
cd team-B/backend
npm install
npm run dev
```

---

### Frontend

```bash
cd team-B/frontend
npm install
npm run dev
```

---

### Admin Panel (runs on a separate port)

```bash
cd team-B/admin-panel
npm install
npm run start
```

Open in browser:

[http://localhost:5050](http://localhost:5050)

---

## 🔐 Admin Login (for development/testing)

```
Username: Singh
Password: 5544
```

---

## 📌 Environment Variables

Create a `.env` file inside `backend/` and add:

```
PORT=5000
MONGO_URI=mongodb+srv://jakkulaniharika8_db_user:PWFFh1nbIWiXzUuB@cluster0.d9q7zxx.mongodb.net/civix_db?retryWrites=true&w=majority
JWT_SECRET=civix_secret

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173


# Encryption key for sensitive data (generate a secure 64-character hex string in production)
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Email service configuration
EMAIL_FROM=noreply@civix.com

# File upload limits
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=5

# Security settings
BCRYPT_ROUNDS=12
JWT_EXPIRY=24h
PASSWORD_RESET_EXPIRY=3600000

# Rate limiting
LOGIN_RATE_LIMIT=5
LOGIN_RATE_WINDOW=300000
GENERAL_RATE_LIMIT=100
GENERAL_RATE_WINDOW=900000

# Environment
NODE_ENV=development


# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_USER=jakkulaniharika8@gmail.com
SMTP_PASSWORD=fyxy fwnt vdxm rfdw
SMTP_PORT=587
SMTP_SECURE=false
APP_NAME=Civix

```

---






