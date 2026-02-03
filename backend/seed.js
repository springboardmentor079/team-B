require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Petition = require('./models/Petition');
const Poll = require('./models/Poll');
const Signature = require('./models/Signature');
const Vote = require('./models/Vote');
const SecurityUtil = require('./utils/security');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create sample user if none
    let user = await User.findOne({ email: 'demo@civix.local' });
    if (!user) {
      const hashed = await SecurityUtil.hashPassword('Password123!');
      user = new User({
        name: 'Demo User',
        email: 'demo@civix.local',
        password: hashed,
        role: 'citizen',
        emailVerified: true,
        location: { jurisdiction: { city: 'DemoCity', state: 'DC' }, address: '123 Demo St' }
      });
      await user.save();
      console.log('Created demo user');
    }

    // Create a petition
    let petition = await Petition.findOne({ title: 'Demo Petition' });
    if (!petition) {
      petition = new Petition({
        title: 'Demo Petition',
        description: 'This is a demo petition for testing',
        createdBy: user._id,
        location: { jurisdiction: { city: 'DemoCity', state: 'DC' }, address: '123 Demo St' }
      });
      await petition.save();
      console.log('Created demo petition');
    }

    // Create signature
    const existingSig = await Signature.findOne({ petition: petition._id, user: user._id });
    if (!existingSig) {
      const sig = new Signature({ petition: petition._id, user: user._id });
      await sig.save();
      console.log('Created demo signature');
    }

    // Create a poll
    let poll = await Poll.findOne({ title: 'Demo Poll' });
    if (!poll) {
      poll = new Poll({
        title: 'Demo Poll',
        options: [{ label: 'Yes' }, { label: 'No' }],
        createdBy: user._id
      });
      await poll.save();
      console.log('Created demo poll');
    }

    // Create vote
    const existingVote = await Vote.findOne({ poll: poll._id, user: user._id });
    if (!existingVote) {
      const vote = new Vote({ poll: poll._id, user: user._id, choice: 0 });
      await vote.save();
      console.log('Created demo vote');
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

run();
