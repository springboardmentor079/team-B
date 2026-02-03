require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Security and middleware setup
const { securityHeaders, sanitizeInput } = require('./middleware/authMiddleware');

// Apply security headers to all routes
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  
   origin: process.env.FRONTEND_URL,
    credentials: true,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
app.use(sanitizeInput);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Civix Backend is running",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    features: [
      "User Authentication & Authorization",
      "Role-based Access Control",
      "Identity Verification System",
      "Geo-location Services",
      "Document Management",
      "Security & Audit Logging"
    ]
  });
});

// API Routes
const authRoutes = require("./routes/authRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const locationRoutes = require("./routes/locationRoutes");
const petitionRoutes = require("./routes/petitionRoutes");
const pollRoutes = require("./routes/pollRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/petitions", petitionRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Civix API v2.0",
    endpoints: {
      auth: {
        base: "/api/auth",
        endpoints: [
          "POST /register - Register new user",
          "POST /login - User login",
          "GET /verify-email/:token - Verify email address",
          "POST /request-password-reset - Request password reset",
          "POST /reset-password/:token - Reset password",
          "GET /profile - Get user profile",
          "PUT /profile - Update user profile"
        ]
      },
      verification: {
        base: "/api/verification",
        endpoints: [
          "POST /submit - Submit verification request",
          "POST /resubmit - Resubmit after rejection",
          "GET /status - Get verification status",
          "GET /status/:userId - Get user verification status (officials)",
          "GET /pending - Get pending verifications (officials)",
          "POST /review/:userId - Review verification (officials)",
          "GET /statistics - Get verification statistics (officials)",
          "GET /documents - Get user documents",
          "GET /documents/:documentId - Download document",
          "DELETE /documents/:documentId - Delete document"
        ]
      },
      location: {
        base: "/api/location",
        endpoints: [
          "PUT /update - Update user location",
          "POST /validate - Validate address",
          "POST /jurisdiction - Get jurisdiction from coordinates",
          "GET /users/same-jurisdiction - Find users in same area",
          "GET /content - Get location-based content",
          "GET /statistics - Get location statistics (officials)",
          "POST /distance - Calculate distance between coordinates"
        ]
      }
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Multer file upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      message: 'File too large. Maximum size is 10MB.',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ 
      message: 'Too many files. Maximum is 5 files per request.',
      code: 'TOO_MANY_FILES'
    });
  }

  // MongoDB errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error',
      errors: Object.values(error.errors).map(e => e.message),
      code: 'VALIDATION_ERROR'
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({ 
      message: 'Duplicate entry',
      code: 'DUPLICATE_ENTRY'
    });
  }

  // Default error response
  res.status(500).json({ 
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Documentation: http://localhost:${PORT}/api`);
});
