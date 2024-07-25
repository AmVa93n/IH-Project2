const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the models in order to interact with the database
const User = require("../models/User.model");
const Offer = require("../models/Offer.model");
const Class = require("../models/Class.model");
const Notification = require("../models/Notification.model");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

// ℹ️ Handles file upload via forms
const multer = require('multer');
const path = require('path');

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
            "This email address is already taken. Please choose a different email address.",
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
  const { email, password } = req.body;

  // Check that username, email, and password are provided
  if (email === "" || password === "") {
    res.status(400).render("auth/login", {
      errorMessage:
        "All fields are mandatory. Please provide email and password.",
    });

    return;
  }

  // Search the database for a user with the email submitted in the form
  User.findOne({ email: email })
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
// CHECKOUT
//================//

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 3000;
const localURL = `http://localhost:${PORT}`
const deployedURL = `https://omniglot-znxc.onrender.com`

router.get('/offers/:offerId/book', isLoggedIn, async (req, res) => {
  const offerId = req.params.offerId
  const offer = await Offer.findById(offerId)
  const teacher = await User.findOne({ offers: offerId })
  const user = req.session.currentUser
  offer.timeslots.sort()
  res.render('checkout/book', { stripePublicKey: process.env.STRIPE_PUBLIC_KEY, offer, teacher, user });
});

router.post('/offers/:offerId/book', isLoggedIn, async (req, res) => {
  const offerId = req.params.offerId
  const offer = await Offer.findById(offerId)
  const user = req.session.currentUser
  const { date, timeslot } = req.body
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
    return_url: `${localURL}/auth/offers/${offerId}/return?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      date,
      timeslot,
    }
  });
  res.send({clientSecret: session.client_secret});
});

router.get('/offers/:offerId/return', isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const offerId = req.params.offerId
  const offer = await Offer.findById(offerId)
  res.render('checkout/return', { offer, user });
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
  const { date, timeslot } = session.metadata;

  if (session.payment_status === 'paid') {
    const user = req.session.currentUser
    const offerId = req.params.offerId
    const offer = await Offer.findById(offerId)
    const teacher = await User.findOne({ offers: offerId })
    await Class.create({ 
      student: user,
      teacher: teacher._id,
      date,
      timeslot, 
      language: offer.language,
      level: offer.level,
      classType: offer.classType,
      maxGroupSize: offer.maxGroupSize,
      locationType: offer.locationType,
      location: offer.location,
      duration: offer.duration,
    })
    await Notification.create({ source: user._id, target: teacher._id, type: 'booking'})
    res.status(200).send();
  } else {
    res.render('checkout/return', { errorMessage: 'Payment not successful.' });
  }
});

module.exports = router;
