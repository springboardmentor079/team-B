const Report = require('../models/Report');
const User = require('../models/User');
const Petition = require('../models/Petition');
const Signature = require('../models/Signature');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const { validationResult } = require('express-validator');

const getMonthRangeUTC = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
};

const buildPetitionLocationFilter = (location) => {
  if (!location) return {};

  return {
    $or: [
      { "location.jurisdiction.city": { $regex: location, $options: 'i' } },
      { "location.address": { $regex: location, $options: 'i' } }
    ]
  };
};

const buildCsv = (report) => {
  const rows = [
    ['Metric', 'Value'],
    ['Month', report.period.monthName],
    ['Year', String(report.period.year)],
    ['Locality', report.period.locality || 'All'],
    ['Petitions Created', String(report.metrics.petitions.created)],
    ['Petitions Active', String(report.metrics.petitions.byStatus.active)],
    ['Petitions Under Review', String(report.metrics.petitions.byStatus.under_review)],
    ['Petitions Completed', String(report.metrics.petitions.byStatus.completed)],
    ['Petitions Closed', String(report.metrics.petitions.byStatus.closed)],
    ['Signatures Added', String(report.metrics.signatures.total)],
    ['Polls Created', String(report.metrics.polls.created)],
    ['Votes Cast', String(report.metrics.votes.total)],
    ['Total Engagement Actions', String(report.metrics.engagementActions)]
  ];

  return rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
};

const formatMonthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

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

exports.exportMonthlyReport = async (req, res) => {
  try {
    if (req.user.role !== 'official') {
      return res.status(403).json({
        message: 'Only officials can generate civic engagement reports'
      });
    }

    const now = new Date();
    const year = Number(req.query.year) || now.getUTCFullYear();
    const month = Number(req.query.month) || (now.getUTCMonth() + 1);
    const format = req.query.format === 'csv' ? 'csv' : 'json';

    if (month < 1 || month > 12) {
      return res.status(400).json({ message: 'Month must be between 1 and 12' });
    }

    const official = await User.findById(req.user.id).select('location');
    const defaultLocality = official?.location?.jurisdiction?.city || official?.location?.address || null;
    const locality = (req.query.location || defaultLocality || '').trim();
    const hasLocality = Boolean(locality);

    const { start, end } = getMonthRangeUTC(year, month);
    const petitionLocationFilter = buildPetitionLocationFilter(hasLocality ? locality : null);

    const [
      petitionsCreated,
      petitionsByStatus,
      signaturesSummary,
      pollsCreated,
      votesSummary
    ] = await Promise.all([
      Petition.countDocuments({
        ...petitionLocationFilter,
        createdAt: { $gte: start, $lt: end }
      }),
      Petition.aggregate([
        { $match: petitionLocationFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Signature.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        {
          $lookup: {
            from: 'petitions',
            localField: 'petition',
            foreignField: '_id',
            as: 'petition'
          }
        },
        { $unwind: '$petition' },
        ...(hasLocality ? [{ $match: buildPetitionLocationFilter(locality) }] : []),
        { $count: 'count' }
      ]),
      Poll.countDocuments({
        ...(hasLocality ? { targetLocation: { $regex: locality, $options: 'i' } } : {}),
        createdAt: { $gte: start, $lt: end }
      }),
      Vote.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        {
          $lookup: {
            from: 'polls',
            localField: 'poll',
            foreignField: '_id',
            as: 'poll'
          }
        },
        { $unwind: '$poll' },
        ...(hasLocality ? [{ $match: { 'poll.targetLocation': { $regex: locality, $options: 'i' } } }] : []),
        { $count: 'count' }
      ])
    ]);

    const byStatus = {
      active: 0,
      under_review: 0,
      completed: 0,
      closed: 0
    };
    for (const item of petitionsByStatus) {
      if (byStatus[item._id] !== undefined) {
        byStatus[item._id] = item.count;
      }
    }

    const totalSignatures = signaturesSummary[0]?.count || 0;
    const totalVotes = votesSummary[0]?.count || 0;

    const reportPayload = {
      period: {
        year,
        month,
        monthName: new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }),
        locality: hasLocality ? locality : null,
        startDate: start,
        endDateExclusive: end
      },
      metrics: {
        petitions: {
          created: petitionsCreated,
          byStatus
        },
        signatures: {
          total: totalSignatures
        },
        polls: {
          created: pollsCreated
        },
        votes: {
          total: totalVotes
        },
        engagementActions: petitionsCreated + totalSignatures + pollsCreated + totalVotes
      },
      generatedAt: new Date()
    };

    if (format === 'csv') {
      const csv = buildCsv(reportPayload);
      const fileName = `civic-report-${year}-${String(month).padStart(2, '0')}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);
      return res.status(200).send(csv);
    }

    res.json({ report: reportPayload });
  } catch (error) {
    console.error('Export monthly report error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.getPetitionStatusMonthly = async (req, res) => {
  try {
    if (req.user.role !== 'official') {
      return res.status(403).json({
        message: 'Only officials can access petition status reports'
      });
    }

    const months = Math.max(1, Math.min(24, Number(req.query.months) || 12));
    const official = await User.findById(req.user.id).select('location');
    const locality = official?.location?.jurisdiction?.city || official?.location?.address || null;
    const hasLocality = Boolean(locality);

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));

    const match = {
      createdAt: { $gte: start, $lt: end },
      ...(hasLocality ? buildPetitionLocationFilter(locality) : {})
    };

    const rows = await Petition.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    const monthlyMap = {};
    for (let i = 0; i < months; i += 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1) + i, 1));
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      const key = formatMonthKey(year, month);
      monthlyMap[key] = {
        key,
        year,
        month,
        monthLabel: d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
        byStatus: {
          active: 0,
          under_review: 0,
          completed: 0,
          closed: 0
        }
      };
    }

    for (const row of rows) {
      const key = formatMonthKey(row._id.year, row._id.month);
      if (!monthlyMap[key]) continue;

      const status = row._id.status;
      if (monthlyMap[key].byStatus[status] !== undefined) {
        monthlyMap[key].byStatus[status] = row.count;
      }
    }

    const monthly = Object.values(monthlyMap).sort((a, b) => (
      a.year === b.year ? a.month - b.month : a.year - b.year
    ));

    res.json({
      locality: hasLocality ? locality : null,
      months: monthly
    });
  } catch (error) {
    console.error('Get petition status monthly error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
