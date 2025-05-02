const {
  getAllUsers,
  sendFriendRequest,
  getReceivedFriendRequests,
  getTotalFriendRequests,
  getAllFriends,
  acceptFriendRequest,
} = require("../models/userModel");

const users = async (req, res) => {
  console.log("hi use");
  const currentUserId = parseInt(req.params.userId);
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const offset = page * limit;

  try {
    const profiles = await getAllUsers(currentUserId, offset, limit);
    console.log(profiles);
    res.json({ profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleSendFriendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    await sendFriendRequest(senderId, receiverId);
    res.status(201).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
};

const handleGetReceivedFriendRequests = async (req, res) => {
  const userId = req.params.userId;
  try {
    const requests = await getReceivedFriendRequests(userId);
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ error: "Failed to get friend requests" });
  }
};

const handleGetTotalFriendRequests = async (req, res) => {
  const receiverId = req.params.userId;

  try {
    const count = await getTotalFriendRequests(receiverId);
    res.json({
      TotalFriendRequests: count.TotalFriendRequests,
      TotalFriends: count.TotalFriends,
    });
  } catch (error) {
    console.error("Error fetching friend request count:", error);
    res.status(500).json({ error: "Failed to fetch friend request count" });
  }
};

const handleGetFriends = async (req, res) => {
  const userId = req.params.userId;
  try {
    const friends = await getAllFriends(userId);
    console.log(friends);
    res.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
};

const handleAcceptFriendRequest = async (req, res) => {
  const { requestId } = req.body;

  try {
    await acceptFriendRequest(requestId);
    res.status(200).json({ message: "Friend request accepted successfully" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ error: error.message });
  }
};

const handleSendNotification = async (req, res) => {
  const { deviceId, message } = req.body; // deviceId is userId in your case

  try {
    global.sendNotificationToUser(deviceId, message);
    return res
      .status(200)
      .json({ success: true, message: "Notification sent" });
  } catch (error) {
    console.error("Error sending notification:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to send notification" });
  }
};

module.exports = {
  users,
  handleSendFriendRequest,
  handleGetReceivedFriendRequests,
  handleGetTotalFriendRequests,
  handleGetFriends,
  handleAcceptFriendRequest,
  handleSendNotification,
};
