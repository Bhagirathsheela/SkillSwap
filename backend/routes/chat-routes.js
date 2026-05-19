const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat-controller");
const checkAuth = require("../middleware/check-auth");

router.use(checkAuth);

// Threads list
router.get("/threads", chatController.getChatThreads);

// Total unread count
router.get("/count", chatController.getUnreadChats);

// Per-partner endpoints
router.get("/:partnerId", chatController.getChatHistory);
router.post("/:partnerId", chatController.sendMessage);
router.put("/read/:partnerId", chatController.markChatsRead);

module.exports = router;
