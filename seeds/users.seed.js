const mongoose = require('mongoose');
const User = require('../models/User.model');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ironhack-project2';
const langList = ['es','it','pt','fr','de','ru','nl','zh','hu','he','ar','kr','jp','ro','pl']

// seed database with 100 users with randomized names and languages
async function seedDatabase() {
  const names = await getRandomNames(100)
  const response = await fetch('https://restcountries.com/v3.1/all');
  const data = await response.json();
  const countries = data.map(country => country.name.common)
  const users = []

  for (let i = 0; i < 100; i++) {
    let lang_teach = getRandomSubset(langList)
    const remainingLangs = langList.filter(l => !lang_teach.includes(l))
    let lang_learn = getRandomSubset(remainingLangs)
    let day = getRandomNumber(1,28).toString().padStart(2, '0')
    let month = getRandomNumber(1,12).toString().padStart(2, '0')
    let year = getRandomNumber(1960,2005)
    let user = {
      username: names[i],
      email: "user"+i+"@gmail.com",
      password: "Ab123456",
      gender: randomChance(50) ? "male" : "female",
      birthdate: `${year}-${month}-${day}`,
      country: countries[getRandomNumber(0,countries.length)],
      profilePic: null,
      lang_teach,
      lang_learn,
      private: randomChance(5),
      professional: randomChance(20),
    }
    users.push(user)
  }

  await mongoose.connect(MONGO_URI)
  await User.create(users);
  await mongoose.connection.close();
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
    const names = data.results.map(user => `${user.name.first}`);
    return names;
  } catch (error) {
    console.error('Error fetching random names:', error);
  }
}

function randomChance(percentage) {
  return Math.random() * 100 < percentage
}

function getRandomNumber(min, max) {
  return (Math.floor(Math.random() * (max - min + 1))) + min
}

// Run the seeding script
seedDatabase();