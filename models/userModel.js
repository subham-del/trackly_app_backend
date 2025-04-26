const { sql } = require("../config/db");

const findUserByEmailAndPassword = async (username, password) => {
  try {
    const result = await global.db
      .request()
      .input("username", sql.VarChar, username)
      .input("password", sql.VarChar, password)
      .query(
        "SELECT * FROM Users WHERE username = @username AND password = @password"
      );

    return result.recordset[0];
  } catch (err) {
    console.error("DB Error in findUserByEmailAndPassword:", err);
    throw err;
  }
};

const getAllUsers = async (currentUserId, offset, limit) => {
  const result = await global.db
    .request()
    .input("CurrentUserId", sql.Int, currentUserId)
    .input("Offset", sql.Int, offset)
    .input("Limit", sql.Int, limit)
    .execute("GetAvailableUsersForFriendRequest");

  return result.recordset;
};

const sendFriendRequest = async (senderId, receiverId) => {
  await global.db
    .request()
    .input("senderId", sql.Int, senderId)
    .input("receiverId", sql.Int, receiverId).query(`
    INSERT INTO [dbo].[FriendRequests] 
      ([SenderId], [ReceiverId], [RequestedAt], [Status])
    VALUES 
      (@senderId, @receiverId, GETDATE(), 'Pending')
  `);
};

async function getReceivedFriendRequests(userId) {
  const result = await global.db.request().input("receiverId", sql.Int, userId)
    .query(`
    SELECT 
      fr.RequestId, 
      fr.SenderId,
      u.Username AS SenderUsername, 
      fr.RequestedAt,
      fr.Status
    FROM 
      [dbo].[FriendRequests] fr
    INNER JOIN 
      [dbo].[Users] u ON fr.SenderId = u.user_id
    WHERE 
      fr.ReceiverId = @receiverId
      AND fr.Status = 'Pending' 
    ORDER BY 
      fr.RequestedAt DESC
  `);

  return result.recordset; // Returning the data
}

async function getTotalFriendRequests(userId) {
  const request = global.db.request().input("userId", userId);

  const result = await request.query(`
    SELECT
     
      (SELECT COUNT(*) 
       FROM [dbo].[Friends] 
       WHERE UserId1 = @userId OR UserId2 = @userId) AS TotalFriends,

      (SELECT COUNT(*) 
       FROM [dbo].[FriendRequests] 
       WHERE ReceiverId = @userId AND Status = 'pending') AS TotalFriendRequests
  `);

  return result.recordset[0]; // { TotalFriends: X, TotalFriendRequests: Y }
}

async function getAllFriends(userId) {
  const result = await global.db.request().input("userId", userId).query(`
    SELECT 
      CASE 
        WHEN f.UserId1 = @userId THEN f.UserId2
        ELSE f.UserId1
      END AS FriendId,
      u.Username AS FriendName
    FROM 
      [dbo].[Friends] f
    INNER JOIN 
      [dbo].[Users] u 
      ON u.user_id = CASE 
                        WHEN f.UserId1 = @userId THEN f.UserId2
                        ELSE f.UserId1
                     END
    WHERE 
      f.UserId1 = @userId OR f.UserId2 = @userId
  `);

  return result.recordset;
}

async function acceptFriendRequest(requestId) {
  // First, get the friend request details
  const result = await global.db.request().input("requestId", requestId).query(`
    SELECT SenderId, ReceiverId
    FROM FriendRequests
    WHERE RequestId = @requestId AND Status = 'Pending'
  `);

  if (result.recordset.length === 0) {
    throw new Error("Friend request not found or already accepted");
  }

  const { SenderId, ReceiverId } = result.recordset[0];

  // Update FriendRequests table
  await global.db.request().input("requestId", requestId).query(`
    UPDATE FriendRequests
    SET Status = 'Accepted'
    WHERE RequestId = @requestId
  `);

  // Insert into Friends table
  await global.db.request().input("requestId", requestId).query(`
    INSERT INTO Friends (UserId1, UserId2, FriendsSince)
    VALUES (${SenderId}, ${ReceiverId}, GETDATE())
  `);
}

module.exports = {
  findUserByEmailAndPassword,
  getAllUsers,
  sendFriendRequest,
  getReceivedFriendRequests,
  getTotalFriendRequests,
  getAllFriends,
  acceptFriendRequest,
};
