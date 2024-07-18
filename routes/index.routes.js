const express = require('express');
const router = express.Router();

// Require the User model in order to interact with the database
const User = require("../models/User.model");

/* GET home page */
router.get("/", (req, res, next) => {
  let user = req.session.currentUser
  res.render("index", {user});
});

// GET another user profile
router.get("/users/:username", async (req, res) => {
  let user = req.session.currentUser
  const viewedUsername = decodeURIComponent(req.params.username)
  const viewedUser = await User.findOne({username: viewedUsername})
  res.render("user", {viewedUser, user});
});

module.exports = router;
