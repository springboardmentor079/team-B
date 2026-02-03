const Petition = require('../models/Petition');
const Poll = require('../models/Poll');
const Signature = require('../models/Signature');
const Vote = require('../models/Vote');
const User = require('../models/User');

exports.quickStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [petitionsSigned, pollsParticipated, user, petitionsCreated, pollsCreated] = await Promise.all([
      Signature.countDocuments({ user: userId }),
      Vote.countDocuments({ user: userId }),
      User.findById(userId).select('location emailVerified role verificationStatus'),
      Petition.countDocuments({ createdBy: userId }),
      Poll.countDocuments({ createdBy: userId })
    ]);

    res.json({
      petitionsSigned,
      pollsParticipated,
      petitionsCreated,
      pollsCreated,
      userCity: user?.location?.jurisdiction?.city || null,
      userState: user?.location?.jurisdiction?.state || null,
      emailVerified: !!user?.emailVerified,
      userRole: user?.role || 'citizen',
      verificationStatus: user?.verificationStatus || 'unverified'
    });

  } catch (error) {
    console.error('Dashboard quickStats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

/**
 * Get user's recent activity
 */
exports.recentActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent petitions signed
    const recentSignatures = await Signature.find({ user: userId })
      .populate('petition', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent polls participated
    const recentVotes = await Vote.find({ user: userId })
      .populate('poll', 'question')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      recentSignatures,
      recentVotes
    });

  } catch (error) {
    console.error('Dashboard recentActivity error:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
};

/**
 * Get featured petitions and polls
 */
exports.featuredContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('location');

    // Get trending petitions
    const trendingPetitions = await Petition.find()
      .populate('createdBy', 'name')
      .sort({ signatureCount: -1 })
      .limit(5)
      .lean();

    // Get trending polls
    const trendingPolls = await Poll.find()
      .populate('createdBy', 'name')
      .sort({ totalVotes: -1 })
      .limit(5)
      .lean();

    res.json({
      trendingPetitions,
      trendingPolls
    });

  } catch (error) {
    console.error('Dashboard featuredContent error:', error);
    res.status(500).json({ message: 'Failed to fetch featured content' });
  }
};
