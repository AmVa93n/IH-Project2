const mongoose = require('mongoose');
const User = require('../models/User.model');
const Offer = require('../models/Offer.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ironhack-project2';

// seed database with 1-5 offers per professional profile
async function seedDatabase() {
    await mongoose.connect(MONGO_URI)
    const profUsers = await User.find({professional: true})
    
    for (let user of profUsers) {
        let offerCount = getRandomNumber(1,5)
        const locTypes = ['online','at-student','at-teacher']
        const classTypes = ['private','group']
        for (let i = 1; i < offerCount+1; i++) {
            let classType = randomElement(classTypes)
            let maxGroupSize = classType == 'group' ? getRandomNumber(2,15) : null
            let offer = {
                name: "my amazing offer "+i,
                language: randomElement(user.lang_teach),
                locationType: randomElement(locTypes),
                classType,
                maxGroupSize,
                duration: getRandomNumber(60,180),
                price: getRandomNumber(10,100),
            }
            let offerDB = await Offer.create(offer);
            user.offers.push(offerDB._id)
            await user.save()
        }
    }

    await mongoose.connection.close();
  }
  
  function randomElement(array) {
    let index = getRandomNumber(0,array.length-1)
    return array[index]
  }
  
  function randomChance(percentage) {
    return Math.random() * 100 < percentage
  }
  
  function getRandomNumber(min, max) {
    return (Math.floor(Math.random() * (max - min + 1))) + min
  }
  
  // Run the seeding script
  seedDatabase();