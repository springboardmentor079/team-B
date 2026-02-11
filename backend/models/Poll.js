// models/Poll.js
const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    targetLocation: { type: String, required: true },

    category: {
      type: String,
      default: "other",
    },

    expiresAt: { type: Date, required: true },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },

    options: [
      {
        label: String,
        votes: { type: Number, default: 0 },
      },
    ],

    votedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", pollSchema);
