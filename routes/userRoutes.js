const express = require("express");
const router = express.Router();
const {
  users,
  handleSendFriendRequest,
  handleGetReceivedFriendRequests,
  handleGetTotalFriendRequests,
  handleGetFriends,
  handleAcceptFriendRequest,
  handleSendNotification,
} = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");

// GET /api/users?page=0&limit=10
router.get("/:userId", authenticateToken, users);

router.get("/friends/:userId", authenticateToken, handleGetFriends);

router.post("/friend-request", authenticateToken, handleSendFriendRequest);

router.get(
  "/friend-requests/:userId",
  authenticateToken,
  handleGetReceivedFriendRequests
);

router.get(
  "/friend-requests/count/:userId",
  authenticateToken,
  handleGetTotalFriendRequests
);

router.post(
  "/accept-friend-request",
  authenticateToken,
  handleAcceptFriendRequest
);

router.post("/send-notification", authenticateToken, handleSendNotification);

module.exports = router;
