const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectToDatabase } = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const http = require("http"); // ADD: HTTP server needed
const { WebSocketServer } = require("ws"); // ADD: WS

const app = express();
const server = http.createServer(app); // Create server manually
const wss = new WebSocketServer({ server }); // Pass HTTP server to WS

const PORT = process.env.PORT || 3000;

// Store connected users by their userId
const connectedUsers = {}; // Example: { userId: websocket }
const trackingMap = new Map(); // userId -> Set of users being tracked by this user

app.use(cors());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Setup WebSocket connection
wss.on("connection", (ws) => {
  console.log("New WebSocket connection established.");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "register" && data.userId) {
        connectedUsers[data.userId] = ws;
        console.log(`User registered: ${data.userId}`);
      }

      if (data.type === "trackUser") {
        const targetUserId = data.targetUserId;
        const fromUserId = data.userId;

        const targetSocket = connectedUsers[targetUserId];
        if (targetSocket) {
          targetSocket.send(
            JSON.stringify({
              type: "startLocationSharing",
              toUserId: fromUserId, // So User B knows where to send location
            })
          );
        }
      }

      if (data.type === "locationUpdate") {
        const receiverSocket = connectedUsers[data.toUserId];
        if (receiverSocket) {
          console.log("sending location update to user ", data.lat, data.lng);
          receiverSocket.send(
            JSON.stringify({
              type: "locationUpdate",
              fromUserId: data.userId,
              lat: data.lat,
              lng: data.lng,
            })
          );
        }
      }

      if (data.type === "stopTracking") {
        const { from, to, fromUserName } = data;

        const trackedUsers = trackingMap.get(from);
        if (trackedUsers) {
          trackedUsers.delete(to);
          console.log(`User ${from} stopped tracking ${to}`);
        }

        // Notify User B to stop sending location
        const targetWs = connectedUsers[to];
        if (targetWs) {
          targetWs.send(
            JSON.stringify({
              type: "stopSendingLocation",
              from,
              fromUserName,
              to,
            })
          );
        }
      }
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    // Remove user from connectedUsers on disconnect
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === ws) {
        console.log(`User disconnected: ${userId}`);
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

// Example function to send a push message to a user
function sendNotificationToUser(userId, notification) {
  const userSocket = connectedUsers[userId];
  if (userSocket && userSocket.readyState === 1) {
    // 1 = OPEN
    userSocket.send(JSON.stringify({ type: "notification", notification }));
  }
}

// Make sendNotificationToUser globally available
global.sendNotificationToUser = sendNotificationToUser;

// Connect to DB and start server
connectToDatabase()
  .then((pool) => {
    global.db = pool;
    server.listen(PORT, '0.0.0.0', () => {
      // Listen using HTTP+WS server
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to DB error:", err);
    process.exit(1);
  });
