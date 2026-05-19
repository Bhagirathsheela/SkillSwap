const mongoose = require("mongoose");
const ChatMessage = require("../models/chat-message");
const ChatThread = require("../models/chat-thread");
const {
  isUserOnline,
  emitNewMessage,
  emitMessageSent,
  emitMessagesRead,
} = require("../socket");

// ────────────────────────────────────────────────────────────
// Get all chat threads for the logged-in user
// One thread per partner (not per task).
// Each thread carries latestMessage + unread count + partner info.
// ────────────────────────────────────────────────────────────
const getChatThreads = async (req, res) => {
  try {
    if (!req.userData || !req.userData.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = new mongoose.Types.ObjectId(req.userData.userId);

    // Load threads where I'm a participant
    const threads = await ChatThread.find({ participants: userId })
      .populate("participants", "name image")
      .populate({
        path: "lastMessage",
        populate: [
          { path: "sender", select: "name image" },
          { path: "receiver", select: "name image" },
          { path: "task", select: "title" },
        ],
      })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Compute unread counts in one aggregation
    const unreadAgg = await ChatMessage.aggregate([
      { $match: { receiver: userId, read: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);
    const unreadBySender = new Map(
      unreadAgg.map((u) => [String(u._id), u.count])
    );

    const shaped = threads.map((t) => {
      const partner =
        (t.participants || []).find(
          (p) => String(p._id) !== String(userId)
        ) || null;
      return {
        _id: t._id,
        pairKey: t.pairKey,
        partner,
        latestMessage: t.lastMessage,
        unreadCount: partner ? unreadBySender.get(String(partner._id)) || 0 : 0,
        lastMessageAt: t.lastMessageAt,
      };
    });

    res.json({ threads: shaped });
  } catch (err) {
    console.error("getChatThreads error:", err);
    res.status(500).json({ message: "Failed to fetch chat threads" });
  }
};

// ────────────────────────────────────────────────────────────
// Get full chat history with a partner (across all tasks)
// ────────────────────────────────────────────────────────────
const getChatHistory = async (req, res) => {
  const { userId } = req.userData;
  const { partnerId } = req.params;

  try {
    const messages = await ChatMessage.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name image")
      .populate("receiver", "name image")
      .populate("task", "title");

    res.json({ messages });
  } catch (err) {
    console.error("getChatHistory error:", err);
    res.status(500).json({ message: "Fetching chat history failed" });
  }
};

// ────────────────────────────────────────────────────────────
// Total unread count across all chats
// ────────────────────────────────────────────────────────────
const getUnreadChats = async (req, res) => {
  const { userId } = req.userData;
  try {
    const unread = await ChatMessage.countDocuments({
      receiver: userId,
      read: false,
    });
    res.json({ unreadCount: unread });
  } catch (err) {
    console.error("getUnreadChats error:", err);
    res.status(500).json({ message: "Failed to fetch unread chats" });
  }
};

// ────────────────────────────────────────────────────────────
// Mark all messages from partner -> me as read
// ────────────────────────────────────────────────────────────
const markChatsRead = async (req, res) => {
  const { userId } = req.userData;
  const { partnerId } = req.params;
  try {
    const toMark = await ChatMessage.find({
      receiver: userId,
      sender: partnerId,
      read: false,
    }).select("_id");

    if (toMark.length > 0) {
      const ids = toMark.map((m) => m._id);
      await ChatMessage.updateMany(
        { _id: { $in: ids } },
        { $set: { read: true, delivered: true } }
      );
      try {
        emitMessagesRead(partnerId, ids.map((id) => String(id)), userId);
      } catch (e) {
        // socket may not be ready
      }
    }

    res.json({ message: "Chats marked as read" });
  } catch (err) {
    console.error("markChatsRead error:", err);
    res.status(500).json({ message: "Failed to mark chats as read" });
  }
};

// ────────────────────────────────────────────────────────────
// Send a new message to a partner
//   POST /chat/:partnerId   body: { message, taskId? }
// ────────────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const senderId = req.userData.userId;
    const { partnerId } = req.params;
    const { message, taskId } = req.body || {};

    if (!message || !partnerId) {
      return res
        .status(400)
        .json({ message: "Message and partnerId required" });
    }

    const delivered = isUserOnline(partnerId);

    const chatMessage = new ChatMessage({
      sender: senderId,
      receiver: partnerId,
      task: taskId || null,
      message,
      delivered,
      read: false,
    });

    await chatMessage.save();

    // Upsert the ChatThread
    const pairKey = ChatThread.makePairKey(senderId, partnerId);
    await ChatThread.findOneAndUpdate(
      { pairKey },
      {
        $setOnInsert: {
          pairKey,
          participants: [senderId, partnerId],
        },
        $set: {
          lastMessage: chatMessage._id,
          lastMessageAt: chatMessage.createdAt || new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const populatedMessage = await chatMessage.populate([
      { path: "sender", select: "name image" },
      { path: "receiver", select: "name image" },
      { path: "task", select: "title" },
    ]);

    try {
      emitNewMessage(partnerId, populatedMessage);
      emitMessageSent(senderId, populatedMessage);
    } catch (e) {
      // socket might not be initialized
    }

    res.status(201).json({ newMessage: populatedMessage });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

exports.getChatThreads = getChatThreads;
exports.getChatHistory = getChatHistory;
exports.getUnreadChats = getUnreadChats;
exports.markChatsRead = markChatsRead;
exports.sendMessage = sendMessage;
