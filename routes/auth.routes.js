const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the User model in order to interact with the database
const User = require("../models/User.model");
const Chat = require("../models/Chat.model");
const Offer = require("../models/Offer.model");
const Class = require("../models/Class.model");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

// ℹ️ Handles file upload via forms
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads'); // Directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, 'pfp-' + Date.now() + path.extname(file.originalname)); // File naming convention
  }
});

// Initialize multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB (adjust as needed)
});

//================//
// SIGNUP 
//================//

router.get("/signup", isLoggedOut, (req, res) => {
  res.render("auth/signup");
});

router.post("/signup", upload.single('profilepic'), isLoggedOut, (req, res) => {
  const { username, email, password, gender, birthdate, country, lang_teach, lang_learn, professional, private} = req.body;
  const profilePic = req.file ? req.file.filename : null;
  const isPrivate = !!private
  const isProfessional = !!professional

  // Check that username, email, and password are provided
  if ([username,email,password,birthdate,country].some(field => field === "")) {
    res.status(400).render("auth/signup", {
      errorMessage:
        "Some mandatory fields are missing. Please provide your username, email, password, birth date and country of residence.",
    });
    return;
  }

  if (!lang_learn && !lang_teach) {
    res.status(400).render("auth/signup", {
      errorMessage:
        "Please choose at least one language you'd like to teach or learn",
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).render("auth/signup", {
      errorMessage: "Your password needs to be at least 8 characters long.",
    });

    return;
  }

  //   ! This regular expression checks password for special characters and minimum length
  
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
  if (!regex.test(password)) {
    res
      .status(400)
      .render("auth/signup", {
        errorMessage: "Password needs to have at least 8 characters and must contain at least one number, one lowercase and one uppercase letter."
    });
    return;
  }

  // Create a new user - start by hashing the password
  bcrypt
    .genSalt(saltRounds)
    .then((salt) => bcrypt.hash(password, salt))
    .then((hashedPassword) => {
      // Create a user and save it in the database
      return User.create({ username, email, password: hashedPassword, gender, birthdate, country, 
        profilePic, lang_teach, lang_learn, private: isPrivate, professional: isProfessional, chats: [], offers: []});
    })
    .then((user) => {
      res.redirect("/auth/login");
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render("auth/signup", { errorMessage: error.message });
      } else if (error.code === 11000) {
        res.status(500).render("auth/signup", {
          errorMessage:
            "The username or the email address is already taken. Choose a different username or email.",
        });
      } else {
        next(error);
      }
    });
});

//================//
// LOGIN 
//================//

router.get("/login", isLoggedOut, (req, res) => {
  res.render("auth/login");
});

router.post("/login", isLoggedOut, (req, res, next) => {
  const { username, password } = req.body;

  // Check that username, email, and password are provided
  if (username === "" || password === "") {
    res.status(400).render("auth/login", {
      errorMessage:
        "All fields are mandatory. Please provide username and password.",
    });

    return;
  }

  // Search the database for a user with the email submitted in the form
  User.findOne({ username })
    .then((user) => {
      // If the user isn't found, send an error message that user provided wrong credentials
      if (!user) {
        res
          .status(400)
          .render("auth/login", { errorMessage: "User not found. Please try again." });
        return;
      }

      // If user is found based on the username, check if the in putted password matches the one saved in the database
      bcrypt
        .compare(password, user.password)
        .then((isSamePassword) => {
          if (!isSamePassword) {
            res
              .status(400)
              .render("auth/login", { errorMessage: "Password is incorrect. Please try again." });
            return;
          }

          // Add the user object to the session object
          req.session.currentUser = user.toObject();
          // Remove the password field
          delete req.session.currentUser.password;

          res.redirect("/");
        })
        .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
    })
    .catch((err) => next(err));
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).render("auth/logout", { errorMessage: err.message });
      return;
    }

    res.redirect("/");
  });
});

//================//
// PROFILE
//================//

router.get("/profile", isLoggedIn, (req, res) => {
  let user = req.session.currentUser
  res.render("auth/profile", {user});
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
      res.status(500).render("auth/profile", { errorMessage: "An error occurred while deleting your account." });
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
    res.status(400).render("auth/profile", {
      errorMessage:
        "Some mandatory fields are missing. Please provide your username, email, birth date and country of residence.",
    });
    return;
  }

  if (!lang_learn && !lang_teach) {
    res.status(400).render("auth/profile", {
      errorMessage:
        "Please choose at least one language you'd like to teach or learn",
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
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update profile. Please try again.' });
  }
});

//================//
// FIND MATCHES
//================//

router.get("/match/tandem", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const user_teach = user.lang_teach
  const user_learn = user.lang_learn
  let matches = await User.find({lang_teach: { $in: user_learn }, lang_learn: { $in: user_teach }})
  matches = matches.filter(match => !match.private) // filter private profiles
  for (let match of matches) { // filter irrelevant languages
    match.lang_teach = match.lang_teach.filter(lang => user_learn.includes(lang))
    match.lang_learn = match.lang_learn.filter(lang => user_teach.includes(lang))
  }
  res.render("auth/matches", {user, matches});
});

router.get("/match/teacher", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const user_learn = user.lang_learn
  let matches = await User.find({lang_teach: { $in: user_learn }, professional: true}).populate('offers')
  for (let match of matches) { // filter irrelevant languages
    match.lang_teach = match.lang_teach.filter(lang => user_learn.includes(lang))
  }
  // filter teachers with at least one offer of a language that the user wants to learn
  matches = matches.filter(match => match.offers.some(offer => user_learn.includes(offer.language)))
  res.render("auth/matches", {user, matches});
});

//================//
// MESSAGING
//================//

router.get("/inbox", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  res.render("auth/inbox", {user});
});

router.get("/inbox/:chatId", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const chatId = req.params.chatId;
  res.render("auth/inbox", {user, chatId});
});

router.post('/inbox', isLoggedIn, async (req, res) => {
  const { targetUsername } = req.body;
  const user = req.session.currentUser
  const initUser = await User.findOne({ username: user.username });
  const targetUser = await User.findOne({ username: targetUsername });

  // Check if a chat already exists
  const existingChat = await Chat.findOne({
    participants: { $all: [initUser._id, targetUser._id] }
  });
  if (existingChat) {
    res.redirect(`/auth/inbox/${existingChat._id}`);
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
  res.redirect(`/auth/inbox/${newChat._id}`);
});

//================//
// OFFERS
//================//

router.get('/myoffers', isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const userDB = await User.findOne({ username: user.username }).populate('offers')
  const offers = userDB.offers
  res.render('auth/myoffers', {user, offers})
});

router.get('/myoffers/new', isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  res.render('auth/offer-create', {user})
});

router.post('/myoffers/new', isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const userDB = await User.findOne({ username: user.username });
  const { name, language, level, locationType, location, duration, classType, maxGroupSize, price} = req.body;

  // Check that all fields are provided
  if ([name,language,level,locationType,classType,duration,price].some(field => !field)) {
    res.status(400).render("auth/offer-create", {
      errorMessage:
        "Some mandatory fields are missing. Please try again",
    });
    return;
  }

  const offer = await Offer.create({ name, language, level, locationType, location, duration, classType, maxGroupSize, price});
  userDB.offers.push(offer._id);
  await userDB.save();
  res.redirect('/auth/myoffers')
});

router.get('/myoffers/:offerId/edit', isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const offerId = req.params.offerId
  const offer = await Offer.findById(offerId)
  res.render('auth/offer-edit', {user, offer})
});

router.post('/myoffers/:offerId/edit', isLoggedIn, async (req, res) => {
  const { name, language, level, locationType, location, duration, classType, maxGroupSize, price } = req.body;
  const offerId = req.params.offerId

  // Check that all fields are provided
  if ([name,language,level,locationType,classType,duration,price].some(field => !field)) {
    res.status(400).render("auth/offer-create", {
      errorMessage:
        "Some mandatory fields are missing. Please try again",
    });
    return;
  }

  try {
    await Offer.findByIdAndUpdate(offerId, {  name, language, level, locationType, location, duration, classType, maxGroupSize, price });
    res.redirect('/auth/myoffers'); // Redirect to my offers page
  } catch (err) {
    res.status(500).render('auth/offer-edit', { errorMessage: 'Failed to update offer. Please try again.' });
  }
});

router.get('/myoffers/:offerId/delete', isLoggedIn, async (req, res) => {
  const offerId = req.params.offerId
  await Offer.findByIdAndDelete(offerId)
  res.redirect('/auth/myoffers')
});

//================//
// CHECKOUT
//================//

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 3000;

router.get('/offers/:offerId/book', isLoggedIn, (req, res) => {
  const offerId = req.params.offerId
  const user = req.session.currentUser
  res.render('auth/checkout', { stripePublicKey: process.env.STRIPE_PUBLIC_KEY, offerId, user });
});

router.post('/offers/:offerId/book', isLoggedIn, async (req, res) => {
  const offerId = req.params.offerId
  const offer = await Offer.findById(offerId)
  const user = req.session.currentUser
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    customer_email: user.email,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: offer.name,
          },
          unit_amount: offer.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    return_url: `http://localhost:${PORT}/auth/offers/${offerId}/return?session_id={CHECKOUT_SESSION_ID}`,
  });
  res.send({clientSecret: session.client_secret});
});

router.get('/offers/:offerId/return', isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const offerId = req.params.offerId
  const offer = await Offer.findById(offerId)
  res.render('auth/checkout-return', { offer, user });
});

router.get('/offers/:offerId/session-status', isLoggedIn, async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  res.send({
    status: session.status,
    customer_email: session.customer_details.email
  });
});

router.post('/offers/:offerId/return', isLoggedIn, async (req, res) => {
  const { sessionId } = req.body;
  // Retrieve the session to get more details if needed
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === 'paid') {
    const user = req.session.currentUser
    const offerId = req.params.offerId
    const offer = await Offer.findById(offerId)
    const teacher = await User.findOne({ offers: offerId })
    await Class.create({ 
      student: user,
      teacher: teacher._id,
      date: "22-07-2024",
      language: offer.language,
      level: offer.level,
      classType: offer.classType,
      maxGroupSize: offer.maxGroupSize,
      locationType: offer.locationType,
      location: offer.location,
      duration: offer.duration,
    })

    res.redirect('/auth/classes');
  } else {
    res.render({ errorMessage: 'Payment not successful.' });
  }
});

//================//
// CLASSES
//================//

router.get('/classes', isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const classes = await Class.find({ student: user._id }).populate('teacher')
  res.render('auth/classes', {user, classes})
});

module.exports = router;
