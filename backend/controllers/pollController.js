const Poll = require("../models/Poll");

/**
 * GET /api/polls
 */
exports.getPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate("createdBy", "name")
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
