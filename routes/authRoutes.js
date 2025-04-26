const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const {
  login,
  tokenRefresh,
  checkUserSession,
} = require("../controllers/authController");

router.post("/login", login);

router.post("/refresh", tokenRefresh);

router.get("/me", authenticateToken, checkUserSession);

module.exports = router;
