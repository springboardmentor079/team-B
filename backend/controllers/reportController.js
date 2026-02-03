const Report = require('../models/Report');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      targetEntity,
      location,
      priority
    } = req.body;

    const report = new Report({
      title: title.trim(),
      description: description.trim(),
      category,
      targetEntity: targetEntity.trim(),
      location: location.trim(),
      priority: priority || 'medium',
      createdBy: req.user.id,
      status: 'pending'
    });

    await report.save();
    await report.populate('createdBy', 'name email role isVerified');

    res.status(201).json({
      message: 'Report created successfully',
      report
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all reports with pagination and filtering
exports.getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const {
      category,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reports = await Report.find(filter)
      .populate('createdBy', 'name email role isVerified')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages,
        totalReports: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get a single report by ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('createdBy', 'name email role isVerified');

    if (!report) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }

    res.json({ report });

  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update a report (only by creator or admin)
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }

    // Check permissions
    if (report.createdBy.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to update this report'
      });
    }

    const {
      title,
      description,
      category,
      targetEntity,
      location,
      priority,
      status
    } = req.body;

    const updateFields = {};
    
    if (title) updateFields.title = title.trim();
    if (description) updateFields.description = description.trim();
    if (category) updateFields.category = category;
    if (targetEntity) updateFields.targetEntity = targetEntity.trim();
    if (location) updateFields.location = location.trim();
    if (priority) updateFields.priority = priority;
    
    // Only admins can change status
    if (status && userRole === 'admin') {
      updateFields.status = status;
    }

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate('createdBy', 'name email role isVerified');

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete a report (only by creator or admin)
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        message: 'Report not found'
      });
    }

    // Check permissions
    if (report.createdBy.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to delete this report'
      });
    }

    await Report.findByIdAndDelete(id);

    res.json({
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};