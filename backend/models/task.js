const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const connectionSchema = new Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true } // gives each connection a createdAt + updatedAt
);

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requestedTask: { type: [{ type: String, required: true }] },
    offeredTask: { type: [{ type: String, required: true }] },
    location: { type: String, required: true },
    attachments: { type: String },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed", "cancelled"],
      default: "open",
    },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },

    connections: [connectionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
