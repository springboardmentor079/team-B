const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerificationDocument = require('../models/VerificationDocument');
const { getAdminJwtSecret } = require('../middleware/adminAuthMiddleware');
const encryptionUtil = require('../utils/encryption');

const getAdminConfig = () => ({
  username: process.env.ADMIN_USERNAME || 'Singh',
  password: process.env.ADMIN_PASSWORD || '5544',
  usernamePrefix: process.env.ADMIN_USERNAME_PREFIX || '',
  passwordPrefix: process.env.ADMIN_PASSWORD_PREFIX || '',
});

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const config = getAdminConfig();

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!username.startsWith(config.usernamePrefix) || !password.startsWith(config.passwordPrefix)) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  if (username !== config.username || password !== config.password) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const token = jwt.sign(
    {
      type: 'admin',
      username,
    },
    getAdminJwtSecret(),
    { expiresIn: '8h' }
  );

  return res.json({
    token,
    admin: {
      username,
    },
  });
};

exports.getPendingVerifications = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: 'official',
      verificationStatus: 'pending',
    })
      .select('name email location verificationStatus createdAt')
      .sort({ createdAt: 1 });

    const userIds = pendingUsers.map((user) => user._id);
    const documents = await VerificationDocument.find({
      userId: { $in: userIds },
      status: 'pending',
    })
      .select('userId documentType metadata status createdAt')
      .sort({ createdAt: -1 });

    const docsByUser = documents.reduce((acc, doc) => {
      const id = doc.userId.toString();
      if (!acc[id]) acc[id] = [];
      acc[id].push({
        id: doc._id,
        documentType: doc.documentType,
        status: doc.status,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
      });
      return acc;
    }, {});

    return res.json({
      requests: pendingUsers.map((user) => ({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          verificationStatus: user.verificationStatus,
          location: user.location,
          createdAt: user.createdAt,
        },
        documents: docsByUser[user._id.toString()] || [],
      })),
    });
  } catch (error) {
    console.error('Get admin pending verifications error:', error);
    return res.status(500).json({ message: 'Failed to fetch pending verifications' });
  }
};

exports.reviewVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { decision, notes } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }

    const user = await User.findOne({ _id: userId, role: 'official' });
    if (!user) {
      return res.status(404).json({ message: 'Official user not found' });
    }

    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ message: 'Verification request is not pending' });
    }

    user.verificationStatus = decision === 'approved' ? 'verified' : 'rejected';
    await user.save();

    const documentStatus = decision === 'approved' ? 'approved' : 'rejected';
    await VerificationDocument.updateMany(
      { userId: user._id, status: 'pending' },
      {
        $set: {
          status: documentStatus,
          reviewedAt: new Date(),
          reviewNotes: notes || '',
        },
        $unset: { reviewedBy: '' },
      }
    );

    return res.json({
      message: `Verification ${decision} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Admin review verification error:', error);
    return res.status(500).json({ message: 'Failed to review verification request' });
  }
};

exports.downloadVerificationDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await VerificationDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const encryptedBuffer = document.encryptedData;
    const iv = encryptedBuffer.slice(0, 16);
    const authTag = encryptedBuffer.slice(16, 32);
    const encryptedData = encryptedBuffer.slice(32);

    const decryptedData = encryptionUtil.decrypt({
      encryptedData,
      iv,
      authTag,
    });

    res.set({
      'Content-Type': document.metadata?.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${document.metadata?.originalName || 'verification-document'}"`,
    });

    return res.send(decryptedData);
  } catch (error) {
    console.error('Admin download verification document error:', error);
    return res.status(500).json({ message: 'Failed to download verification document' });
  }
};
