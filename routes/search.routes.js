const express = require('express');
const router = express.Router();
const User = require('../models/User.model');


router.get('/', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.json([]);
  }

  try {
    // Find users that are learning or teaching the queried language
    const users = await User.find({
      $or: [
        { lang_learn: query },   
        { lang_teach: query }    
      ]
    }).select('username country lang_learn lang_teach');

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
