# Civix Backend v2.0

A comprehensive civic engagement platform backend with user roles, identity verification, and location-based services.

## Features

- **User Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Identity Verification System**: Document upload and verification workflow for officials
- **Geo-location Services**: Address validation, geocoding, and civic jurisdiction mapping
- **Document Management**: Encrypted document storage with access controls
- **Security & Audit Logging**: Comprehensive security measures and audit trails
- **Rate Limiting**: Protection against brute force attacks and abuse

## User Roles

- **Citizens**: Standard users who can participate in civic activities
- **Officials**: Verified government officials with administrative privileges

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   - Create a `.env` file in the root directory
   - Update the following variables:
     - `MONGO_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure secret for JWT tokens
     - `ENCRYPTION_KEY`: A 64-character hex string for data encryption
     - `FRONTEND_URL`: Your frontend application URL
   
   **Email Configuration (for password reset emails)**:
   - Set `EMAIL_ENABLED=true` to enable email sending
   - Configure SMTP settings:
     - `SMTP_HOST`: SMTP server (e.g., `smtp.gmail.com` for Gmail)
     - `SMTP_PORT`: SMTP port (587 for TLS, 465 for SSL)
     - `SMTP_SECURE`: Set to `true` for port 465, `false` for port 587
     - `SMTP_USER`: Your email address
     - `SMTP_PASSWORD` or `SMTP_APP_PASSWORD`: Your email password or app password
   
   **For Gmail users**:
   - Enable 2-factor authentication on your Google account
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Use the App Password as `SMTP_PASSWORD` (not your regular password)
   
   **Example .env configuration**:
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-gmail-app-password
   ```
   
   **Note**: If `EMAIL_ENABLED=false` or SMTP is not configured, reset links will be logged to the console for testing purposes.

3. **Start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user (citizen or official)
- `POST /login` - User login
- `GET /verify-email/:token` - Verify email address
- `POST /request-password-reset` - Request password reset
- `POST /reset-password/:token` - Reset password with token
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile

### Verification (`/api/verification`)
- `POST /submit` - Submit verification request (officials only)
- `POST /resubmit` - Resubmit after rejection
- `GET /status` - Get verification status
- `GET /pending` - Get pending verifications (verified officials only)
- `POST /review/:userId` - Review verification request (verified officials only)
- `GET /documents` - Get user's documents
- `GET /documents/:documentId` - Download specific document
- `DELETE /documents/:documentId` - Delete document

### Location (`/api/location`)
- `PUT /update` - Update user location
- `POST /validate` - Validate and geocode address
- `POST /jurisdiction` - Get jurisdiction from coordinates
- `GET /users/same-jurisdiction` - Find users in same area
- `GET /content` - Get location-based content
- `POST /distance` - Calculate distance between coordinates

## Security Features

- **Password Security**: Bcrypt hashing with configurable rounds
- **Account Lockout**: Automatic lockout after failed login attempts
- **Rate Limiting**: Protection against brute force attacks
- **Input Sanitization**: XSS protection through input sanitization
- **Secure Headers**: Security headers for all responses
- **Audit Logging**: Comprehensive logging of security events
- **Data Encryption**: Sensitive data encrypted at rest

## File Upload

The system supports secure file uploads for verification documents:
- **Supported formats**: JPEG, PNG, GIF, PDF, TIFF
- **Maximum file size**: 10MB per file
- **Maximum files**: 5 files per request
- **Storage**: Encrypted in-memory processing with database storage

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `ENCRYPTION_KEY` | Data encryption key (64-char hex) | Required |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `NODE_ENV` | Environment mode | development |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 |
| `JWT_EXPIRY` | JWT token expiry | 24h |

## Database Models

### User
- Basic information (name, email, password)
- Role and verification status
- Location data with civic jurisdiction
- Security fields (login attempts, locks, tokens)

### VerificationDocument
- Encrypted document storage
- Document metadata and status
- Review information and audit trail

## Development

### Project Structure
```
civix-backend/
├── controllers/          # Request handlers
├── middleware/          # Authentication and authorization
├── models/             # Database schemas
├── routes/             # API route definitions
├── services/           # Business logic services
├── utils/              # Utility functions
├── server.js           # Main application file
└── package.json        # Dependencies and scripts
```

### Adding New Features
1. Create service in `services/` for business logic
2. Add routes in `routes/` for API endpoints
3. Update middleware if new permissions needed
4. Add models in `models/` for new data structures

## Testing

The system includes comprehensive error handling and validation:
- Input validation on all endpoints
- Proper HTTP status codes
- Detailed error messages
- Security event logging

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET` and `ENCRYPTION_KEY`
3. Configure proper MongoDB connection with authentication
4. Set up proper email service integration
5. Configure reverse proxy (nginx) for SSL termination
6. Set up monitoring and logging

## API Documentation

Visit `http://localhost:5000/api` when the server is running to see the complete API documentation.

## License

ISC License