const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const VerificationDocument = require('../models/VerificationDocument');
const Petition = require('../models/Petition');
const Poll = require('../models/Poll');
const Signature = require('../models/Signature');
const Vote = require('../models/Vote');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
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

exports.getManagedUsers = async (req, res) => {
  try {
    const allowedRoles = ['citizen', 'official'];
    const role = req.query.role;
    const filter = role && allowedRoles.includes(role) ? { role } : { role: { $in: allowedRoles } };

    const users = await User.find(filter)
      .select('name email role verificationStatus location createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        location: user.location,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get admin managed users error:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.deleteManagedUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findOne({ _id: userId, role: { $in: ['citizen', 'official'] } });
    if (!user) {
      return res.status(404).json({ message: 'User not found or not deletable' });
    }

    const [petitions, polls] = await Promise.all([
      Petition.find({ createdBy: user._id }).select('_id'),
      Poll.find({ createdBy: user._id }).select('_id'),
    ]);

    const petitionIds = petitions.map((p) => p._id);
    const pollIds = polls.map((p) => p._id);

    await Promise.all([
      VerificationDocument.deleteMany({ userId: user._id }),
      VerificationDocument.updateMany({ reviewedBy: user._id }, { $unset: { reviewedBy: '' } }),

      Signature.deleteMany({
        $or: [
          { user: user._id },
          petitionIds.length ? { petition: { $in: petitionIds } } : null,
        ].filter(Boolean),
      }),
      Vote.deleteMany({
        $or: [
          { user: user._id },
          pollIds.length ? { poll: { $in: pollIds } } : null,
        ].filter(Boolean),
      }),

      Petition.updateMany({}, { $pull: { officialResponses: { official: user._id } } }),
      Poll.updateMany({}, { $pull: { votedUsers: user._id } }),

      petitionIds.length ? Petition.deleteMany({ _id: { $in: petitionIds } }) : Promise.resolve(),
      pollIds.length ? Poll.deleteMany({ _id: { $in: pollIds } }) : Promise.resolve(),

      Report.deleteMany({ createdBy: user._id }),

      Notification.deleteMany({
        $or: [
          { recipient: user._id },
          { actor: user._id },
          petitionIds.length ? { petition: { $in: petitionIds } } : null,
        ].filter(Boolean),
      }),
    ]);

    await User.findByIdAndDelete(user._id);

    return res.json({
      message: `${user.role} account deleted successfully`,
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin delete managed user error:', error);
    return res.status(500).json({ message: 'Failed to delete user account' });
  }
};
