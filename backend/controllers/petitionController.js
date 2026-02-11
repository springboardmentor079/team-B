const Petition = require('../models/Petition');
const Signature = require('../models/Signature');
const User = require('../models/User');

/**
 * Get all petitions with filtering and pagination
 */
const mongoose = require("mongoose");

exports.getPetitions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      location,
      search,
      scope = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    /* CATEGORY */
    if (category && category !== "all") {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    /* STATUS */
    if (status && status !== "all") {
      filter.status = status;
    }

    /* LOCATION (CITY) */
    if (location && location !== "all") {
      filter.$or = [
        { "location.address": { $regex: location, $options: "i" } },
        { "location.jurisdiction.city": { $regex: location, $options: "i" } },
      ];
    }

    /* SEARCH */
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    /* SCOPE: MY PETITIONS */
   if (scope === "mine") {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  filter.createdBy = req.user.id;
}


    /* SCOPE: SIGNED BY ME */
    if (scope === "signed") {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const signed = await Signature.find({ user: req.user.id }).select("petition");
  const signedIds = signed.map(s => s.petition);

  if (signedIds.length === 0) {
    return res.json({ petitions: [] });
  }

  filter._id = { $in: signedIds };
}


    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const petitions = await Petition.aggregate([
      { $match: filter },

      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },

      {
        $lookup: {
          from: "signatures",
          localField: "_id",
          foreignField: "petition",
          as: "signatures",
        },
      },

      {
        $addFields: {
          signature_count: { $size: "$signatures" },
          creator_name: { $arrayElemAt: ["$creator.name", 0] },
          has_signed: req.user
            ? {
                $in: [
                  req.user.id,
                  {
                    $map: {
                      input: "$signatures",
                      as: "sig",
                      in: "$$sig.user",
                    },
                  },
                ],
              }
            : false,
        },
      },

      {
        $project: {
          creator: 0,
          signatures: 0,
        },
      },

      { $sort: sort },
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    res.json({ petitions });

  } catch (err) {
    console.error("Get petitions error:", err);
    res.status(500).json({ message: "Failed to fetch petitions" });
  }
};


/**
 * Get petition by ID with detailed information
 */
exports.getPetitionById = async (req, res) => {
  try {
    const { id } = req.params;

    const petition = await Petition.aggregate([
      { $match: { _id: new require('mongoose').Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $lookup: {
          from: 'signatures',
          localField: '_id',
          foreignField: 'petition',
          as: 'signatures'
        }
      },
      {
        $addFields: {
          signature_count: { $size: '$signatures' },
          creator_name: { $arrayElemAt: ['$creator.name', 0] },
          creator_role: { $arrayElemAt: ['$creator.role', 0] },
          creator_email: { $arrayElemAt: ['$creator.email', 0] }
        }
      },
      {
        $project: {
          signatures: 0,
          'creator.password': 0,
          'creator.passwordResetToken': 0
        }
      }
    ]);

    if (!petition || petition.length === 0) {
      return res.status(404).json({ message: 'Petition not found' });
    }

    const petitionData = petition[0];

    // Check if current user has signed this petition
    if (req.user) {
      const userSignature = await Signature.findOne({
        petition: id,
        user: req.user.id
      });
      petitionData.has_signed = !!userSignature;
    } else {
      petitionData.has_signed = false;
    }

    res.json({ petition: petitionData });

  } catch (error) {
    console.error('Get petition by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch petition', error: error.message });
  }
};

/**
 * Create a new petition
 */
exports.createPetition = async (req, res) => {
  try {
    const { title, description, category, location, target_signatures, tags } = req.body;

    // Input validation
    if (!title || !description) {
      return res.status(400).json({ 
        message: 'Title and description are required',
        errors: {
          title: !title ? 'Title is required' : null,
          description: !description ? 'Description is required' : null
        }
      });
    }

    // Create petition object
    const petitionData = {
      title,
      description,
      category: category || 'General',
      status: 'active',
      target_signatures: target_signatures || 100,
      createdBy: req.user.id,
      tags: tags || []
    };

    // Handle location data
    if (location) {
      if (typeof location === 'string') {
        petitionData.location = { address: location };
      } else if (typeof location === 'object') {
        petitionData.location = location;
      }
    }

    const petition = new Petition(petitionData);
    await petition.save();

    // Populate creator information
    await petition.populate('createdBy', 'name email role');

    res.status(201).json({
      message: 'Petition created successfully',
      petition: {
        id: petition._id,
        title: petition.title,
        description: petition.description,
        category: petition.category,
        status: petition.status,
        location: petition.location,
        target_signatures: petition.target_signatures,
        signature_count: 0,
        creator_name: petition.createdBy.name,
        creator_role: petition.createdBy.role,
        createdAt: petition.createdAt,
        tags: petition.tags,
        has_signed: false
      }
    });

  } catch (error) {
    console.error('Create petition error:', error);
    res.status(500).json({ message: 'Failed to create petition', error: error.message });
  }
};

/**
 * Sign a petition
 */
exports.signPetition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if petition exists
    const petition = await Petition.findById(id);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }

    // Check if petition is active
    if (petition.status !== 'active') {
      return res.status(400).json({ message: 'This petition is no longer accepting signatures' });
    }

    // Check if user already signed
    const existingSignature = await Signature.findOne({
      petition: id,
      user: userId
    });

    if (existingSignature) {
      return res.status(400).json({ message: 'You have already signed this petition' });
    }

    // Create signature
    const signature = new Signature({
      petition: id,
      user: userId
    });

    try {
      await signature.save();
    } catch (err) {
      // Handle race condition if the same user signs concurrently
      if (err && err.code === 11000) {
        return res.status(400).json({ message: 'You have already signed this petition' });
      }
      throw err;
    }

    // Get updated signature count
    const signatureCount = await Signature.countDocuments({ petition: id });

    res.json({
      message: 'Petition signed successfully',
      signature_count: signatureCount
    });

  } catch (error) {
    console.error('Sign petition error:', error);
    res.status(500).json({ message: 'Failed to sign petition', error: error.message });
  }
};

/**
 * Check if user has signed a petition
 */
exports.getUserSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const signature = await Signature.findOne({
      petition: id,
      user: userId
    });

    res.json({
      has_signed: !!signature,
      signed_at: signature ? signature.createdAt : null
    });

  } catch (error) {
    console.error('Get user signature error:', error);
    res.status(500).json({ message: 'Failed to check signature status', error: error.message });
  }
};

/**
 * Update petition (only by creator or admin)
 */
exports.updatePetition = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, status, target_signatures, tags } = req.body;

    const petition = await Petition.findById(id);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }

    // Check if user is the creator or admin
    if (petition.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this petition' });
    }

    // Update fields
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (status) updateData.status = status;
    if (target_signatures) updateData.target_signatures = target_signatures;
    if (tags) updateData.tags = tags;

    const updatedPetition = await Petition.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    res.json({
      message: 'Petition updated successfully',
      petition: updatedPetition
    });

  } catch (error) {
    console.error('Update petition error:', error);
    res.status(500).json({ message: 'Failed to update petition', error: error.message });
  }
};

/**
 * Delete petition (only by creator or admin)
 */
exports.deletePetition = async (req, res) => {
  try {
    const { id } = req.params;

    const petition = await Petition.findById(id);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }

    // Check if user is the creator or admin
    if (petition.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this petition' });
    }

    // Delete associated signatures
    await Signature.deleteMany({ petition: id });

    // Delete petition
    await Petition.findByIdAndDelete(id);

    res.json({ message: 'Petition deleted successfully' });

  } catch (error) {
    console.error('Delete petition error:', error);
    res.status(500).json({ message: 'Failed to delete petition', error: error.message });
  }
};

/**
 * Get petition signatures with user details
 */
exports.getPetitionSignatures = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if petition exists
    const petition = await Petition.findById(id);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const signatures = await Signature.find({ petition: id })
      .populate('user', 'name location role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Signature.countDocuments({ petition: id });
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      signatures: signatures.map(sig => ({
        id: sig._id,
        user_name: sig.user.name,
        user_location: sig.user.location?.address || 'Not specified',
        user_role: sig.user.role,
        signed_at: sig.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get petition signatures error:', error);
    res.status(500).json({ message: 'Failed to fetch signatures', error: error.message });
  }
};

/**
 * Get petition statistics
 */
exports.getPetitionStats = async (req, res) => {
  try {
    const { id } = req.params;

    const petition = await Petition.findById(id);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }

    // Get signature count
    const signatureCount = await Signature.countDocuments({ petition: id });

    // Get signatures by location (if available)
    const signaturesByLocation = await Signature.aggregate([
      { $match: { petition: new require('mongoose').Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.location.address',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get signatures over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const signaturesOverTime = await Signature.aggregate([
      { 
        $match: { 
          petition: new require('mongoose').Types.ObjectId(id),
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      petition_id: id,
      total_signatures: signatureCount,
      target_signatures: petition.target_signatures,
      progress_percentage: Math.round((signatureCount / petition.target_signatures) * 100),
      signatures_by_location: signaturesByLocation,
      signatures_over_time: signaturesOverTime,
      created_at: petition.createdAt,
      status: petition.status
    });

  } catch (error) {
    console.error('Get petition stats error:', error);
    res.status(500).json({ message: 'Failed to fetch petition statistics', error: error.message });
  }
};
