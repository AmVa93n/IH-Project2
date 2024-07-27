const express = require('express');
const router = express.Router();

// Require the models in order to interact with the database
const User = require("../models/User.model");
const Chat = require("../models/Chat.model");
const Message = require("../models/Message.model");
const Offer = require("../models/Offer.model");
const Class = require("../models/Class.model");
const Review = require("../models/Review.model");
const Notification = require("../models/Notification.model");

// Require necessary middleware
const isLoggedIn = require("../middleware/isLoggedIn");
const upload = require("../middleware/file-storage");

const fs = require('fs');
const path = require('path');

//================//
// PROFILE
//================//

router.get("/profile", isLoggedIn, (req, res) => {
    let user = req.session.currentUser
    res.render("account/profile", {user});
});
  
router.get("/profile/delete", isLoggedIn, (req, res) => {
    const user = req.session.currentUser
    const username = user.username
    User.findOneAndDelete({ username })
      .then(() => {
        if (user.profilePic) { // delete profile picture from file system, if it exists
          const profilePicPath = path.join(__dirname, '../public/uploads', user.profilePic);
          fs.unlinkSync(profilePicPath)
        }
        req.session.destroy(() => {
          res.redirect("/");
        })
      })
      .catch((err) => {
        res.status(500).render("account/profile", { errorMessage: "An error occurred while deleting your account." });
      });
});
  
router.post('/profile/edit', upload.single('pfp'), isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const { username, email, gender, birthdate, country, lang_teach, lang_learn, professional, private } = req.body;
    const newProfilePic = req.file ? req.file.filename : null;
    const isPrivate = !!private
    const isProfessional = !!professional
    const userId = req.session.currentUser._id;
  
    if ([username,email,birthdate,country].some(field => field === "")) {
      res.status(400).render("account/profile", {
        errorMessage: "Some mandatory fields are missing. Please try again.",
      });
      return;
    }
  
    if (!lang_learn && !lang_teach) {
      res.status(400).render("account/profile", {user,
        errorMessage: "Please choose at least one language you'd like to teach or learn",
      });
      return;
    }
  
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, { username, email, gender, birthdate, country, 
        lang_teach, lang_learn, professional: isProfessional, private: isPrivate }, { new: true });
      if (newProfilePic) {
        if (user.profilePic) {
          const oldPfpPath = path.join(__dirname, '../public/uploads', user.profilePic); // delete old profile picture from file system, if it exists
          fs.unlinkSync(oldPfpPath)
        }
        updatedUser.profilePic = newProfilePic
        await updatedUser.save()
      }
      req.session.currentUser = updatedUser; // Update current user in session
      res.redirect('/account/profile'); // Redirect to profile page
    } catch (err) {
      res.status(500).render('account/profile', { user, errorMessage: 'Failed to update profile. Please try again.' });
    }
});

//================//
// MESSAGING
//================//

router.get("/inbox", isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    res.render("account/inbox", {user});
});
  
router.get("/inbox/:chatId", isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const chatId = req.params.chatId;
    res.render("account/inbox", {user, chatId});
});
  
router.post('/inbox', isLoggedIn, async (req, res) => {
    const { targetUserId } = req.body;
    const user = req.session.currentUser
    const initUser = await User.findById(user._id);
    const targetUser = await User.findById(targetUserId);
  
    // Check if a chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [initUser._id, targetUser._id] }
    });
    if (existingChat) {
      res.redirect(`/account/inbox/${existingChat._id}`);
      return
    }
  
    const newChat = new Chat({
      participants: [user._id, targetUser._id],
      messages: []
    });
    await newChat.save();
    initUser.chats.push(newChat._id);
    targetUser.chats.push(newChat._id);
    await initUser.save();
    await targetUser.save();
    res.redirect(`/account/inbox/${newChat._id}`);
});

router.get("/inbox/:chatId/delete", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const chatId = req.params.chatId;
  const chat = await Chat.findById(chatId)
  await Message.deleteMany({ _id: { $in: chat.messages }, sender: user._id });
  res.redirect("/account/inbox");
});

//================//
// OFFERS
//================//

router.get('/offers', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const userDB = await User.findOne({ username: user.username }).populate('offers')
    const offers = userDB.offers
    res.render('account/offers', {user, offers})
});
  
router.get('/offers/new', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    res.render('account/offer-create', {user})
});
  
router.post('/offers/new', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const userDB = await User.findOne({ username: user.username });
    const { name, language, level, locationType, location, weekdays, timeslots, 
      duration, classType, maxGroupSize, price} = req.body;
  
    // Check that all fields are provided
    if ([name,language,level,locationType,classType,weekdays,timeslots,duration,price].some(field => !field)) {
      res.status(400).render("account/offer-create", {
        errorMessage:
          "Some mandatory fields are missing. Please try again",
      });
      return;
    }
  
    const offer = await Offer.create({ name, language, level, locationType, location, weekdays, timeslots, 
      duration, classType, maxGroupSize, price});
    userDB.offers.push(offer._id);
    await userDB.save();
    res.redirect('/account/offers')
});
  
router.get('/offers/:offerId/edit', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const offerId = req.params.offerId
    const offer = await Offer.findById(offerId)
    res.render('account/offer-edit', {user, offer})
});

router.post('/offers/:offerId/edit', isLoggedIn, async (req, res) => {
    const { name, language, level, locationType, weekdays, timeslots, duration, classType, price } = req.body;
    let { location, maxGroupSize } = req.body;
    if (!location) location = null
    if (!maxGroupSize) maxGroupSize = null
    const offerId = req.params.offerId
  
    // Check that all fields are provided
    if ([name,language,level,locationType,classType,weekdays,timeslots,duration,price].some(field => !field)) {
        const user = req.session.currentUser
        const offer = await Offer.findById(offerId)
        res.status(400).render("account/offer-edit", {user, offer,
            errorMessage: "Some mandatory fields are missing. Please try again",
        });
        return;
    }
  
    try {
      await Offer.findByIdAndUpdate(offerId, {  name, language, level, locationType, location, weekdays, timeslots, 
        duration, classType, maxGroupSize, price });
      res.redirect('/account/offers'); // Redirect to my offers page
    } catch (err) {
      res.status(500).render('account/offer-edit', { errorMessage: 'Failed to update offer. Please try again.' });
    }
});
  
router.get('/offers/:offerId/delete', isLoggedIn, async (req, res) => {
    const offerId = req.params.offerId
    await Offer.findByIdAndDelete(offerId)
    res.redirect('/account/offers')
});

//================//
// CLASSES
//================//

router.get('/classes', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const classes = await Class.find({ student: user._id }).populate('teacher')
    for (let cl of classes) {
      const [day, month, year] = cl.date.split('-').map(Number);
      const inputDate = new Date(year, month - 1, day);
      const currentDate = new Date();
      cl.isPast = inputDate < currentDate
    }
    res.render('account/classes', {user, classes})
});

router.get('/classes/:classId/rate', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const classId = req.params.classId
    const classFromDB = await Class.findById(classId).populate('teacher')
    res.render('account/class-rate', {user, class: classFromDB})
});

router.post('/classes/:classId/rate', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const { rating, text } = req.body
    const classId = req.params.classId
    const classFromDB = await Class.findById(classId)
    const { teacher, date, language, level, classType, locationType } = classFromDB
    await Review.create({ author: user._id, subject: teacher, rating, text, date, language, level, classType, locationType})
    classFromDB.isRated = true
    await classFromDB.save()
    await Notification.create({ source: user._id, target: teacher, type: 'review'})
    res.redirect('/account/classes')
});

router.get('/classes/:classId/cancel', isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const classId = req.params.classId
  const classFromDB = await Class.findById(classId)
  const { teacher } = classFromDB
  await Class.deleteOne({ _id: classId })
  await Notification.create({ source: user._id, target: teacher, type: 'cancel'})
  res.redirect('/account/classes')
});
  
//================//
// CALENDAR
//================//

router.get('/calendar', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const classes = await Class.find({ teacher: user._id }).populate('student').lean()
    const events = []
    for (let cl of classes) {
        let [day, month, year] = cl.date.split('-').map(Number);
        let dateObj = new Date(year, month - 1, day);
        const currentDate = new Date();
        cl.isPast = dateObj < currentDate

        const date = [dateObj.getFullYear(),
        (dateObj.getMonth() + 1).toString().padStart(2, '0'),
        dateObj.getDate().toString().padStart(2, '0')
        ].join('-');

        let [hours, minutes] = cl.timeslot.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes + Number(cl.duration);
        let newHours = Math.floor(totalMinutes / 60) % 24;
        let newMinutes = totalMinutes % 60;
        newHours = newHours.toString().padStart(2, '0');
        newMinutes = newMinutes.toString().padStart(2, '0');
        const endTime = `${newHours}:${newMinutes}`;

        const start = `${date}T${cl.timeslot}:00`;
        const end = `${date}T${endTime}:00`;

        let event = {
        title: cl.student.username,
        id: cl._id,
        start: start,
        end: end,
        display: 'block'
        }
        events.push(event)
    }
    res.render('account/calendar', {user, classes, events: JSON.stringify(events)})
});

//================//
// Reviews
//================//

router.get('/reviews', isLoggedIn, async (req, res) => {
    const user = req.session.currentUser
    const reviews = await Review.find({ subject: user._id }).populate('author')
    res.render('account/reviews', {user, reviews})
});

module.exports = router;