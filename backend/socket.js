const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const ChatMessage = require("./models/chat-message");
const User = require("./models/user");

// Minimal cookie parser (no extra dependency)
const parseCookies = (raw) => {
  const out = {};
  if (!raw || typeof raw !== "string") return out;
  raw.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) {
      try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
    }
  });
  return out;
};

let io;

// Track online users: userId -> Set<socket.id>
const onlineUsers = new Map();

const addUserSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }
  return false;
};

const isUserOnline = (userId) => onlineUsers.has(String(userId));

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers && socket.handshake.headers.cookie;
      const cookies = parseCookies(rawCookie || "");
      const token =
        cookies.token ||
        (socket.handshake.auth && socket.handshake.auth.token) ||
        (socket.handshake.query && socket.handshake.query.token);

      if (!token) return next(new Error("No auth token"));

      const decoded = jwt.verify(token, process.env.JWT_KEY);
      socket.userId = String(decoded.userId);
      socket.userName = decoded.name;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    addUserSocket(userId, socket.id);
    socket.join(userId);
    console.log(`🟢 ${socket.userName || userId} connected (${socket.id})`);

    // Mark all received-but-undelivered messages as delivered
    try {
      const undelivered = await ChatMessage.find({
        receiver: userId,
        delivered: false,
      }).select("_id sender");

      if (undelivered.length > 0) {
        await ChatMessage.updateMany(
          { _id: { $in: undelivered.map((m) => m._id) } },
          { $set: { delivered: true } }
        );

        const bySender = new Map();
        for (const m of undelivered) {
          const sid = String(m.sender);
          if (!bySender.has(sid)) bySender.set(sid, []);
          bySender.get(sid).push(String(m._id));
        }
        for (const [senderId, messageIds] of bySender.entries()) {
          io.to(senderId).emit("messagesDelivered", { messageIds, by: userId });
        }
      }
    } catch (err) {
      console.error("delivered-on-connect error:", err.message);
    }

    // Broadcast online status
    socket.broadcast.emit("userOnline", { userId });

    // ── markRead: user opened a chat with a partner
    socket.on("markRead", async ({ partnerId }) => {
      try {
        const updated = await ChatMessage.find({
          sender: partnerId,
          receiver: userId,
          read: false,
        }).select("_id");

        if (updated.length === 0) return;

        await ChatMessage.updateMany(
          { _id: { $in: updated.map((m) => m._id) } },
          { $set: { read: true, delivered: true } }
        );

        io.to(String(partnerId)).emit("messagesRead", {
          messageIds: updated.map((m) => String(m._id)),
          by: userId,
        });

        io.to(userId).emit("unreadChatsChanged");
      } catch (err) {
        console.error("markRead error:", err.message);
      }
    });

    // ── Typing indicators
    socket.on("typing", ({ to, taskId }) => {
      if (!to) return;
      io.to(String(to)).emit("typing", { from: userId, taskId });
    });

    socket.on("stopTyping", ({ to, taskId }) => {
      if (!to) return;
      io.to(String(to)).emit("stopTyping", { from: userId, taskId });
    });

    // ── Presence query
    socket.on("getPresence", ({ userIds }, ack) => {
      if (typeof ack !== "function") return;
      const result = {};
      (userIds || []).forEach((id) => {
        result[id] = { online: isUserOnline(id) };
      });
      ack(result);
    });

    socket.on("disconnect", async () => {
      const wentOffline = removeUserSocket(userId, socket.id);
      console.log(
        `🔴 ${socket.userName || userId} disconnected (${socket.id})${wentOffline ? " — fully offline" : ""}`
      );

      if (wentOffline) {
        const lastSeen = new Date();
        try {
          await User.findByIdAndUpdate(userId, { lastSeen });
        } catch (err) {
          console.error("lastSeen update error:", err.message);
        }
        socket.broadcast.emit("userOffline", {
          userId,
          lastSeen: lastSeen.toISOString(),
        });
      }
    });
  });
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

// Helpers used by controllers
const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(String(userId)).emit(event, payload);
};

const emitNewMessage = (receiverId, message) =>
  emitToUser(receiverId, "newMessage", message);

const emitMessageSent = (senderId, message) =>
  emitToUser(senderId, "messageSent", message);

const emitNewNotification = (recipientId, notification) =>
  emitToUser(recipientId, "newNotification", notification);

const emitNotificationsRead = (userId) =>
  emitToUser(userId, "notificationsRead");

const emitMessagesDelivered = (senderId, messageIds) =>
  emitToUser(senderId, "messagesDelivered", { messageIds });

const emitMessagesRead = (senderId, messageIds, by) =>
  emitToUser(senderId, "messagesRead", { messageIds, by });

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  emitToUser,
  emitNewMessage,
  emitMessageSent,
  emitNewNotification,
  emitNotificationsRead,
  emitMessagesDelivered,
  emitMessagesRead,
};
