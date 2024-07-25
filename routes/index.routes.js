const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer.model');
const Review = require('../models/Review.model');
const User = require("../models/User.model");
const Notification = require("../models/Notification.model");

// Require necessary middleware in order to control access to specific routes
const isLoggedIn = require("../middleware/isLoggedIn");

/* GET home page */
router.get("/", (req, res, next) => {
  let user = req.session.currentUser;
  res.render("index", { user });
});

router.get("/countries", isLoggedIn, (req, res) => {
  let user = req.session.currentUser
  res.render("countries", {user});
});

// GET another user profile
router.get("/users/:userId", async (req, res) => {
  const user = req.session.currentUser;
  const viewedUserId = decodeURIComponent(req.params.userId);
  
  try {
    const viewedUser = await User.findById(viewedUserId).populate('offers');
    if (!viewedUser) {
      return res.status(404).render("error", { message: "User not found" });
    }
    viewedUser.reviews = await Review.find({ subject: viewedUserId }).populate('author')
    
    res.render("user", { viewedUser, user });
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

//================//
// NOTIFICATIONS
//================//

router.post("/notification/read", isLoggedIn, async (req, res) => {
  const { notifId } = req.body
  await Notification.findByIdAndUpdate(notifId, {read: true})
  res.status(200).send()
});

router.post("/notification/delete", isLoggedIn, async (req, res) => {
  const { notifId } = req.body
  await Notification.findByIdAndDelete(notifId)
  res.status(200).send()
});

//================//
// FIND MATCHES
//================//

router.get("/match/partners", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const user_teach = user.lang_teach
  const user_learn = user.lang_learn
  let matches = await User.find({lang_teach: { $in: user_learn }, lang_learn: { $in: user_teach }})
  matches = matches.filter(match => !match.private) // filter private profiles
  for (let match of matches) { // filter irrelevant languages
    match.lang_teach = match.lang_teach.filter(lang => user_learn.includes(lang))
    match.lang_learn = match.lang_learn.filter(lang => user_teach.includes(lang))
  }
  res.render("matches", {user, matches, teachers: false});
});

router.get("/match/teachers", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const user_learn = user.lang_learn
  let matches = await User.find({lang_teach: { $in: user_learn }, professional: true}).populate('offers')
  for (let match of matches) { // filter irrelevant languages
    match.lang_teach = match.lang_teach.filter(lang => user_learn.includes(lang))
  }
  // filter teachers with at least one offer of a language that the user wants to learn
  matches = matches.filter(match => match.offers.some(offer => user_learn.includes(offer.language)))
  // get review avg scores
  for (let match of matches) {
    let reviews = await Review.find({ subject: match._id })
    let avg = reviews.map(r => r.rating).reduce((acc, num)=>acc+num,0) / reviews.length
    match.ratingAvg = avg.toFixed(1)
    match.reviews = reviews.length
  }
  res.render("matches", {user, matches, teachers: true});
});

module.exports = router;
