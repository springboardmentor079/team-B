const Notification = require("../models/Notification");

exports.getMyNotifications = async (req, res) => {
  try {
    if (req.user.role !== "citizen") {
      return res.status(403).json({
        message: "Notifications are available for citizen accounts only",
      });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actor", "name role")
      .populate("petition", "title");

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    if (req.user.role !== "citizen") {
      return res.status(403).json({
        message: "Notifications are available for citizen accounts only",
      });
    }

    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};
