const mongoose = require("mongoose");

const chatThreadSchema = new mongoose.Schema(
  {
    // Sorted pair of user IDs as a single deterministic key — ensures
    // (A, B) and (B, A) resolve to the SAME thread.
    pairKey: { type: String, required: true, unique: true, index: true },
    participants: [
      { type: mongoose.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: mongoose.Types.ObjectId, ref: "ChatMessage" },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

// Helper: derive a stable key from two user ids regardless of order
chatThreadSchema.statics.makePairKey = function (a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}_${y}`;
};

module.exports = mongoose.model("ChatThread", chatThreadSchema);
