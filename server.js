const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectToDatabase } = require("./config/db");
const userRoutes = require("./routes/userRoutes");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

// Connect to DB first
connectToDatabase()
  .then((pool) => {
    global.db = pool; // store globally for access in model
    // Start server only after DB is connected
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to DB error:", err);
    process.exit(1); // Exit process if DB connection fails
  });
