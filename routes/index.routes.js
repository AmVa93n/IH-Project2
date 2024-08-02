const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer.model');
const Review = require('../models/Review.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const Deck = require('../models/Deck.model');

// Middleware to check if the user is logged in
const isLoggedIn = require('../middleware/isLoggedIn');

/* GET home page */
router.get("/", async (req, res) => {
  const user = req.session.currentUser;
  const langList = ['es', 'it', 'pt', 'fr', 'de', 'ru', 'nl', 'zh', 'hu', 'he', 'ar', 'kr', 'jp', 'ro', 'pl'];
  const stats = {
    teach: [],
    learn: [],
  };

  try {
    // Collect statistics for each language
    for (const lang of langList) {
      stats.teach.push({
        name: lang,
        amount: await User.countDocuments({ lang_teach: lang }),
      });
      stats.learn.push({
        name: lang,
        amount: await User.countDocuments({ lang_learn: lang }),
      });
    }

    // Sort and limit the statistics to the top 10
    stats.teach = stats.teach.sort((a, b) => b.amount - a.amount).slice(0, 10);
    stats.learn = stats.learn.sort((a, b) => b.amount - a.amount).slice(0, 10);
    
    // Render the home page with statistics
    res.render("index", { user, stats });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send('Internal Server Error');
  }
});

// GET another user profile
router.get("/users/:userId", async (req, res) => {
  const user = req.session.currentUser;
  const viewedUserId = decodeURIComponent(req.params.userId);

  try {
    // Find the user by ID and populate their offers
    const viewedUser = await User.findById(viewedUserId).populate('offers');
    if (!viewedUser) {
      return res.status(404).render("error", { message: "User not found" });
    }
    
    // Populate reviews and decks for the viewed user
    viewedUser.reviews = await Review.find({ subject: viewedUserId }).populate('author');
    viewedUser.decks = await Deck.find({ creator: viewedUserId });

    // Render the user profile page
    res.render("user", { viewedUser, user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
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
    // Search for offers and users based on the query
    const offers = await Offer.find({ name: regex }).exec();
    const users = await User.find({
      $or: [
        { username: regex },
        { country: regex },
      ],
    }).exec();

    // Return the search results
    res.json({ offers, users });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//================//
// NOTIFICATIONS
//================//

// Mark a notification as read
router.post("/notification/read", isLoggedIn, async (req, res) => {
  const { notifId } = req.body;
  try {
    await Notification.findByIdAndUpdate(notifId, { read: true });
    res.status(200).send();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete a notification
router.post("/notification/delete", isLoggedIn, async (req, res) => {
  const { notifId } = req.body;
  try {
    await Notification.findByIdAndDelete(notifId);
    res.status(200).send();
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

//================//
// FIND MATCHES
//================//

// Find users who match based on the languages they teach and learn
router.get("/match/partners", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser;
  const user_teach = user.lang_teach;
  const user_learn = user.lang_learn;

  try {
    let matches = await User.find({ lang_teach: { $in: user_learn }, lang_learn: { $in: user_teach } });
    matches = matches.filter(match => !match.private); // Filter private profiles
    for (let match of matches) { // Filter irrelevant languages
      match.lang_teach = match.lang_teach.filter(lang => user_learn.includes(lang));
      match.lang_learn = match.lang_learn.filter(lang => user_teach.includes(lang));
    }
    res.render("matches", { user, matches, teachers: false });
  } catch (error) {
    console.error('Error finding partners:', error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

// Find teachers who match based on the languages the user wants to learn
router.get("/match/teachers", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser;
  const user_learn = user.lang_learn;

  try {
    let matches = await User.find({ lang_teach: { $in: user_learn }, professional: true }).populate('offers');
    for (let match of matches) { // Filter irrelevant languages
      match.lang_teach = match.lang_teach.filter(lang => user_learn.includes(lang));
    }
    // Filter teachers with at least one offer of a language that the user wants to learn
    matches = matches.filter(match => match.offers.some(offer => user_learn.includes(offer.language)));
    // Calculate average review scores for each teacher
    for (let match of matches) {
      let reviews = await Review.find({ subject: match._id });
      let avg = reviews.map(r => r.rating).reduce((acc, num) => acc + num, 0) / reviews.length;
      match.ratingAvg = avg.toFixed(1);
      match.reviews = reviews.length;
    }
    res.render("matches", { user, matches, teachers: true });
  } catch (error) {
    console.error('Error finding teachers:', error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

//==============================//
// Dynamic routes for languages
//==============================//

// Route to get teachers of a specific language
router.get("/teachers/:langId", async (req, res) => {
  const { langId } = req.params;

  try {
    const user = req.session.currentUser;
    // Find teachers for the specified language
    const teachers = await User.find({ lang_teach: langId});
    res.render("matches", { lang: langId, matches: teachers, user});
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to get learners of a specific language
router.get("/learners/:langId", async (req, res) => {
  const { langId } = req.params;

  try {
    const user = req.session.currentUser;
    // Find learners for the specified language
    const learners = await User.find({ lang_learn: langId });
    res.render("matches", { lang: langId, matches: learners, user, teachers: false });
  } catch (error) {
    console.error('Error fetching learners:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;