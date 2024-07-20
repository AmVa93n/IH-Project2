const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer.model');
const User = require("../models/User.model");

/* GET home page */
router.get("/", (req, res, next) => {
  let user = req.session.currentUser;
  res.render("index", { user });
});

// GET another user profile
router.get("/users/:username", async (req, res) => {
  const user = req.session.currentUser;
  const viewedUsername = decodeURIComponent(req.params.username);
  
  try {
    const viewedUser = await User.findOne({ username: viewedUsername });
    if (!viewedUser) {
      return res.status(404).render("error", { message: "User not found" });
    }
    
    res.render("user", { viewedUser, user });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

// GET another user's offers
router.get("/users/:username/offers", async (req, res) => {
  const user = req.session.currentUser;
  const viewedUsername = decodeURIComponent(req.params.username);
  
  try {
    const viewedUser = await User.findOne({ username: viewedUsername });
    if (!viewedUser) {
      return res.status(404).render("error", { message: "User not found" });
    }
    
    res.render("offers", { viewedUser, user });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

// Example of search route for products and users
router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json([]);
  }

  const regex = new RegExp(query, 'i');

  try {
    const offers = await Offer.find({ name: regex }).exec();
    const users = await User.find({
      $or: [
        { username: regex },
        { country: regex }
      ]
    }).exec();
    
    res.json({ offers, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
