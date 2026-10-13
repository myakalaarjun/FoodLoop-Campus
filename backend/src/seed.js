import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import Listing from './models/Listing.js';

if (!process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 12) {
  throw new Error('Set DEMO_PASSWORD to a unique password of at least 12 characters before seeding.');
}

const demoPeople = [
  { name: 'Jamie Rivera', email: 'jamie.donor@example.test', role: 'donor', organization: { name: 'North Quad Kitchen' } },
  { name: 'Morgan Lee', email: 'morgan.recipient@example.test', role: 'recipient', organization: { name: 'Campus Community Pantry', description: 'Fictional demo organization for local food access.', capacity: 60, dietaryNeeds: ['peanuts'], pickupAvailability: [], verified: true } },
  { name: 'Sam Patel', email: 'sam.volunteer@example.test', role: 'volunteer', organization: {} }
];

try {
  await connectDatabase();
  const people = {};
  for (const details of demoPeople) {
    let user = await User.findOne({ email: details.email });
    if (!user) user = await User.create({ ...details, password: process.env.DEMO_PASSWORD });
    people[details.role] = user;
  }
  const existing = await Listing.findOne({ donor: people.donor._id, title: 'Harvest bowl lunch packs' });
  if (!existing) {
    const pickupStart = new Date(Date.now() + 60 * 60 * 1000);
    const deadline = new Date(Date.now() + 5 * 60 * 60 * 1000);
    await Listing.create({
      donor: people.donor._id,
      title: 'Harvest bowl lunch packs',
      description: 'Fictional freshly prepared grain bowls with seasonal vegetables.',
      category: 'Prepared meals',
      quantity: 24,
      quantityAvailable: 24,
      unit: 'meals',
      allergens: ['sesame'],
      handlingInstructions: 'Keep chilled; collect from the west kitchen entrance.',
      pickupLocation: 'North Quad Kitchen, west entrance',
      pickupStart,
      deadline
    });
  }
  console.log('Fictional demo data is ready. Demo emails: jamie.donor@example.test, morgan.recipient@example.test, sam.volunteer@example.test');
  console.log('Sign in with the DEMO_PASSWORD value you supplied. No administrator account is created.');
} finally {
  await mongoose.disconnect();
}
