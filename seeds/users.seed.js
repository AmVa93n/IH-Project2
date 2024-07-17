const users = []
//const names = getRandomNames(50)
const langList = ['es','it','pt','fr','de','ru','nl','zh','hu','he','ar']

// seed database with 100 users with randomized languages
for (let i = 0; i < 100; i++) {
  let lang_speak = getRandomSubset(langList)
  const remainingLangs = langList.filter(l => !lang_speak.includes(l))
  let lang_learn = getRandomSubset(remainingLangs)
  let user = {
    username: "User"+i,
    email: "user"+i+"@gmail.com",
    password: "Ab123456",
    gender: "male",
    birthdate: "30th June 1999",
    profilePic: null,
    description: "",
    lang_speak,
    lang_learn,
    private: false,
  }
  users.push(user)
}

function getRandomSubset(arr) {
  const result = [];
  const numberOfElements = Math.floor(Math.random() * 3) + 1; // random number from 1 to 3
  const usedIndices = new Set();

  while (result.length < numberOfElements) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    if (!usedIndices.has(randomIndex)) {
      result.push(arr[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }

  return result;
}

async function getRandomNames(count) {
  try {
    const response = await fetch(`https://randomuser.me/api/?results=${count}`);
    const data = await response.json();
    const names = data.results.map(user => `${user.name.first} ${user.name.last}`);
    return names;
  } catch (error) {
    console.error('Error fetching random names:', error);
  }
}

const mongoose = require('mongoose');
const User = require('../models/User.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ironhack-project2';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    // Create new documents in the users collection
    return User.create(users);
  })
  .then(() => {
    // Once the documents are created, close the DB connection
    return mongoose.connection.close();
  })
  .catch(err => {
    console.log(err);
  });