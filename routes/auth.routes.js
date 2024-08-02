const express = require("express");
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the models in order to interact with the database
const User = require("../models/User.model");

// Require necessary middleware
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");
//const upload = require("../middleware/file-storage");
const fileUploader = require('../middleware/cloudinary');

//================//
// SIGNUP 
//================//

router.get("/signup", isLoggedOut, (req, res) => {
  res.render("auth/signup");
});

router.post("/signup", fileUploader.single('profilepic'), isLoggedOut, async (req, res) => {
  const { username, email, password, gender, birthdate, country, lang_teach, lang_learn, professional, private} = req.body;
  const profilePic = req.file ? req.file.path : null;
  const isPrivate = !!private
  const isProfessional = !!professional
  let stripeAccountId = null

  // Check that username, email, and password are provided
  if ([username,email,password,birthdate,country].some(field => field === "")) {
    res.status(400).render("auth/signup", {errorMessage: "Some mandatory fields are missing. Please provide your username, email, password, birth date and country of residence."});
    return;
  }

  if (!lang_learn && !lang_teach) {
    res.status(400).render("auth/signup", {errorMessage: "Please choose at least one language you'd like to teach or learn"});
    return;
  }

  if (password.length < 8) {
    res.status(400).render("auth/signup", {errorMessage: "Your password needs to be at least 8 characters long."});
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

  if (isProfessional) {
    try {
      const stripeAccount = await stripe.accounts.create({
        country: 'US',
        email: email,
        type: 'standard',
      });
      stripeAccountId = stripeAccount.id
    } catch (error) {
      console.error("An error occurred when calling the Stripe API to create an account", error);
    }
  }

  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.create({ username, email, password: hashedPassword, gender, birthdate, country, profilePic, stripeAccountId,
      lang_teach, lang_learn, private: isPrivate, professional: isProfessional, chats: [], offers: []});
    res.redirect("/auth/login");
    
  } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render("auth/signup", { errorMessage: error.message });
      } else if (error.code === 11000) {
        res.status(500).render("auth/signup", {
          errorMessage: "This email address is already taken. Please choose a different email address.",
        });
      } else {
        next(error);
      }
  }
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

module.exports = router;
