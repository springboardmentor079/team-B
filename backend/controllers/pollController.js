const Poll = require("../models/Poll");
const User = require("../models/User");

const ensureVerifiedOfficial = (req, res) => {
  if (req.user.role !== "official") {
    return res.status(403).json({ message: "Only officials can perform this action" });
  }

  if (req.user.verificationStatus !== "verified") {
    return res.status(403).json({
      message: "Your official account is not verified yet. Submit your Government ID in Verification Status.",
      code: "OFFICIAL_VERIFICATION_REQUIRED",
      verificationStatus: req.user.verificationStatus,
    });
  }

  return null;
};

/**
 * GET /api/polls
 */
exports.getPolls = async (req, res) => {
  try {
    const { location } = req.query;

    const filter = {};
    if (location && location.trim()) {
      filter.targetLocation = { $regex: location.trim(), $options: "i" };
    }

    const polls = await Poll.find(filter)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    const userId = req.user?.id;

    const formattedPolls = polls.map((poll) => {
      const totalVotes = poll.options.reduce(
        (sum, opt) => sum + opt.votes,
        0
      );

      const hasVoted = userId
        ? poll.votedUsers.some((id) => id.toString() === userId.toString())
        : false;

      const createdById = poll.createdBy?._id || null;
      const isMine =
        userId && createdById
          ? createdById.toString() === userId.toString()
          : false;

      return {
        _id: poll._id,

        // 🔹 REQUIRED BY FRONTEND
        title: poll.title,
        description: poll.description,
        targetLocation: poll.targetLocation, // ✅ FIX
        expiresAt: poll.expiresAt,             // ✅ FIX

        category: poll.category,
        status: poll.status,

        createdAt: poll.createdAt,
        createdBy: poll.createdBy?.name || "Anonymous",
        createdByRole: poll.createdBy?.role || null,
        createdById,
        hasVoted,
        isMine,

        totalVotes,
        options: poll.options,
      };
    });

    res.json({ polls: formattedPolls });
  } catch (error) {
    console.error("Get polls error:", error);
    res.status(500).json({ message: "Failed to fetch polls" });
  }
};

/**
 * GET /api/polls/:id
 */
exports.getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate("createdBy", "name");

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    res.json({ poll });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch poll" });
  }
};

/**
 * POST /api/polls
 */
exports.createPoll = async (req, res) => {
  try {
    const permissionError = ensureVerifiedOfficial(req, res);
    if (permissionError) {
      return permissionError;
    }

    const {
      title,
      description,
      options,
      targetLocation,
      expiresAt,
      category,
      isAnonymous,
      allowMultipleVotes,
    } = req.body;

    const poll = await Poll.create({
      title,
      description,
      targetLocation,
      expiresAt,
      category,
      isAnonymous,
      allowMultipleVotes,
      createdBy: req.user.id,
      options: options.map((opt) => ({
        label: opt,
        votes: 0,
      })),
    });

    res.status(201).json({
      message: "Poll created successfully",
      poll,
    });
  } catch (error) {
    console.error("Create poll error:", error);
    res.status(500).json({ message: "Failed to create poll" });
  }
};

/**
 * POST /api/polls/:id/vote
 */
/**
 * POST /api/polls/:id/vote
 */
/**
 * POST /api/polls/:id/vote
 */
exports.voteOnPoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const userId = req.user.id;
    const voterRole = req.user.role;

    if (voterRole !== "citizen") {
      return res.status(403).json({ message: "Only citizens can vote on polls" });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status === "closed") {
      return res.status(400).json({ message: "Poll is closed" });
    }

    const hasVoted = poll.votedUsers.some((id) =>
      id.toString() === userId.toString()
    );
    if (hasVoted) {
      return res.status(400).json({ message: "You have already voted" });
    }

    if (!poll.options[optionIndex]) {
      return res.status(400).json({ message: "Invalid option" });
    }

    poll.options[optionIndex].votes += 1;
    poll.votedUsers.push(userId);

    await poll.save();

    res.json({
      message: "Vote recorded successfully",
      poll,
    });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ message: "Failed to vote" });
  }
};

/**
 * PATCH /api/polls/:id/status
 */
exports.updatePollStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const permissionError = ensureVerifiedOfficial(req, res);
    if (permissionError) {
      return permissionError;
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Locality check for officials
    const official = await User.findById(req.user.id).select("location");
    const city = official?.location?.jurisdiction?.city || official?.location?.address;

    if (city) {
      const isSameLocality =
        (poll.targetLocation || "").toLowerCase().includes(city.toLowerCase());
      if (!isSameLocality) {
        return res.status(403).json({ message: "You can only manage polls in your locality" });
      }
    }

    poll.status = status;
    await poll.save();

    res.json({
      message: `Poll marked as ${status}`,
      poll,
    });
  } catch (error) {
    console.error("Update poll status error:", error);
    res.status(500).json({ message: "Failed to update poll status" });
  }
};

/**
 * DELETE /api/polls/:id
 */
exports.deletePoll = async (req, res) => {
  try {
    const permissionError = ensureVerifiedOfficial(req, res);
    if (permissionError) {
      return permissionError;
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    await Poll.findByIdAndDelete(req.params.id);

    return res.json({ message: "Poll deleted successfully" });
  } catch (error) {
    console.error("Delete poll error:", error);
    return res.status(500).json({ message: "Failed to delete poll" });
  }
};
