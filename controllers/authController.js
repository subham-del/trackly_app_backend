const { saveToken, getRefreshToken } = require("../models/authModel");
const { findUserByEmailAndPassword } = require("../models/userModel");
const jwt = require("jsonwebtoken");

// Token generation
const generateAccessToken = (user) =>
  jwt.sign(user, process.env.ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_EXPIRE,
  });

const generateRefreshToken = (user) =>
  jwt.sign(user, process.env.REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRE,
  });

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await findUserByEmailAndPassword(username, password);
    if (user) {
      // Generate tokens

      const payload = { id: user.user_id, username: user.username };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Save to AuthTokens table
      await saveToken(user.user_id, refreshToken);

      return res.json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          id: user.user_id,
          username: user.username,
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const tokenRefresh = async (req, res) => {
  const { refreshToken } = req.body;
  console.log("Received refresh token:", refreshToken);

  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token required" });

  try {
    console.log("Checking if token exists in DB...");
    const result = await getRefreshToken(refreshToken);
    console.log("DB check result:", result);

    if (!result) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // jwt.verify DOES NOT support Promises, so async/await inside the callback must be handled carefully
    jwt.verify(refreshToken, "supersecretrefreshkey456$%^", (err, user) => {
      console.log("Entered jwt.verify callback");

      if (err) {
        console.error("JWT verify error:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      try {
        console.log("Decoded user from JWT:", user);

        const newAccessToken = jwt.sign(
          { id: user.id, username: user.username },
          process.env.ACCESS_SECRET,
          { expiresIn: process.env.ACCESS_EXPIRE }
        );

        const newRefreshToken = jwt.sign(
          { id: user.id, username: user.username },
          process.env.REFRESH_SECRET,
          { expiresIn: process.env.REFRESH_EXPIRE }
        );

        console.log("Storing new refresh token...");
        saveToken(user.id, newRefreshToken)
          .then(() => {
            console.log("Refresh token saved successfully");
            res.json({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            });
          })
          .catch((saveErr) => {
            console.error("Error saving refresh token:", saveErr);
            res.status(500).json({ message: "Error saving new token" });
          });
      } catch (innerErr) {
        console.error("Unexpected error in jwt.verify block:", innerErr);
        res.status(500).json({ message: "Unexpected error" });
      }
    });
  } catch (err) {
    console.error("Outer catch error:", err);
    res.status(500).json({ message: "Error verifying refresh token" });
  }
};

const checkUserSession = async (req, res) => {
  console.log("me");
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

module.exports = { login, tokenRefresh, checkUserSession };
