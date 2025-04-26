

async function sendFriendRequest(req, res) {
  const senderId = parseInt(req.params.userId);
  const { receiverId } = req.body;

  if (!receiverId || isNaN(senderId)) {
    return res.status(400).json({ message: "Invalid sender or receiver ID" });
  }

 
  try {
    // Check if already friends
    const friendsCheck = await db.query(
      `
      SELECT * FROM Friends
      WHERE (UserId1 = @senderId AND UserId2 = @receiverId)
         OR (UserId1 = @receiverId AND UserId2 = @senderId)
    `,
      { senderId, receiverId }
    );

    if (friendsCheck.recordset.length > 0) {
      return res.status(400).json({ message: "You are already friends" });
    }

    // Check for existing pending request
    const requestCheck = await db.query(
      `
      SELECT * FROM FriendRequests
      WHERE SenderId = @senderId AND ReceiverId = @receiverId AND Status = 'Pending'
    `,
      { senderId, receiverId }
    );

    if (requestCheck.recordset.length > 0) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Insert new friend request
    await db.query(
      `
      INSERT INTO FriendRequests (SenderId, ReceiverId)
      VALUES (@senderId, @receiverId)
    `,
      { senderId, receiverId }
    );

    res.status(201).json({ message: "Friend request sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { sendFriendRequest };
