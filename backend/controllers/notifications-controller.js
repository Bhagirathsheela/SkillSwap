const Notification = require("../models/notification");
const User = require("../models/user");
const HttpError = require("../models/http-error");
const {
  emitNewNotification,
  emitNotificationsRead,
  emitToUser,
} = require("../socket");

// Get notifications for logged-in user
const getNotifications = async (req, res, next) => {
  const { userId } = req.userData;

  try {
    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name image")
      .sort({ createdAt: -1 });

    res.json({ notifications });
  } catch (err) {
    return next(new HttpError("Fetching notifications failed", 500));
  }
};

// Get unread count only
const getUnreadNotificationCount = async (req, res, next) => {
  const { userId } = req.userData;
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (err) {
    return next(new HttpError("Fetching unread count failed", 500));
  }
};

// Mark all as read
const markAsRead = async (req, res, next) => {
  const { userId } = req.userData;

  try {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    try {
      emitNotificationsRead(userId);
    } catch (e) {
      /* ignore */
    }
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    return next(new HttpError("Marking notifications failed", 500));
  }
};

// Clear / hard-delete ALL notifications for the logged-in user
const clearAllNotifications = async (req, res, next) => {
  const { userId } = req.userData;
  try {
    await Notification.deleteMany({ recipient: userId });
    try {
      emitToUser(userId, "notificationsCleared");
    } catch (e) {
      /* ignore */
    }
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    return next(new HttpError("Clearing notifications failed", 500));
  }
};

// Normalize anything that *might* identify a user (ObjectId, string, or
// a populated User document) down to its string id. Without this,
// String(populatedUserDoc) yields "[object Object]" and the socket emit
// targets a room nobody is in — silently breaking realtime delivery.
const toUserId = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v._id) return String(v._id);
  return String(v);
};

// Helper: used by other controllers to create + push a notification
const createNotification = async ({ recipient, sender, message }) => {
  try {
    const recipientId = toUserId(recipient);
    const senderId = toUserId(sender);
    if (!recipientId) {
      console.warn("createNotification: missing recipient");
      return;
    }

    const senderUser = senderId
      ? await User.findById(senderId).select("name")
      : null;

    const personalizedMessage = senderUser
      ? `${senderUser.name} ${message}`
      : message;

    const notif = new Notification({
      recipient: recipientId,
      sender: senderId,
      message: personalizedMessage,
    });

    await notif.save();

    const populated = await notif.populate("sender", "name image");

    try {
      emitNewNotification(recipientId, populated);
    } catch (e) {
      /* ignore */
    }

    return populated;
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};

exports.getNotifications = getNotifications;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.markAsRead = markAsRead;
exports.clearAllNotifications = clearAllNotifications;
exports.createNotification = createNotification;
