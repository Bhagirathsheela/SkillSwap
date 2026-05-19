const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications-controller");
const checkAuth = require("../middleware/check-auth");

router.use(checkAuth);

router.get("/", notificationsController.getNotifications);
router.get("/unread-count", notificationsController.getUnreadNotificationCount);
router.post("/mark-read", notificationsController.markAsRead);
router.delete("/clear", notificationsController.clearAllNotifications);

module.exports = router;
