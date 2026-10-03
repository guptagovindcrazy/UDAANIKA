// Development seed. WARNING: wipes all collections. Demo credentials only — never use in production.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const Bird = require('../models/Bird');
const Rescue = require('../models/Rescue');
const MigrationObservation = require('../models/MigrationObservation');

const PASSWORD = 'Demo@1234';
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const BIRDS = [
  ['Indian Peafowl', 'Pavo cristatus', 'Open woodland and farmland', 'Resident', 'Least Concern', 'India\'s national bird, known for the male\'s iridescent train.'],
  ['Sarus Crane', 'Antigone antigone', 'Wetlands and paddy fields', 'Resident, local movements', 'Vulnerable', 'The world\'s tallest flying bird, often seen in mated pairs.'],
  ['Bar-headed Goose', 'Anser indicus', 'High-altitude lakes and rivers', 'Crosses the Himalayas each winter', 'Least Concern', 'Famed for flying over the Himalayas to winter in India.'],
  ['Demoiselle Crane', 'Grus virgo', 'Steppe, wetlands, lake shores', 'Central Asia to India each winter', 'Least Concern', 'Large flocks winter at Khichan, Rajasthan.'],
  ['Greater Flamingo', 'Phoenicopterus roseus', 'Saline lakes and lagoons', 'Partial migrant', 'Least Concern', 'Filter feeds in shallow brackish water.'],
  ['Great Indian Bustard', 'Ardeotis nigriceps', 'Dry grasslands', 'Resident', 'Critically Endangered', 'One of the heaviest flying birds; fewer than 200 remain.'],
  ['Common Kingfisher', 'Alcedo atthis', 'Streams, ponds and lakes', 'Resident, some local movement', 'Least Concern', 'Plunge-dives for small fish.'],
  ['Black-necked Stork', 'Ephippiorhynchus asiaticus', 'Freshwater wetlands', 'Resident', 'Near Threatened', 'Tall stork with glossy black-and-white plumage.'],
];

const LOCATIONS = [
  ['Keoladeo National Park, Bharatpur', 27.1596, 77.5226],
  ['Chilika Lake, Odisha', 19.7176, 85.3199],
  ['Sultanpur Bird Sanctuary, Haryana', 28.4602, 76.8931],
  ['Nal Sarovar, Gujarat', 22.7996, 72.0405],
  ['Pong Dam Lake, Himachal Pradesh', 31.9718, 76.0156],
];

// species, injury, severity, location idx, final status, reporter idx, volunteer idx, daysAgo
const RESCUES = [
  ['Indian Peafowl', 'Leg injury', 'Medium', 0, 'Completed', 0, 0, 25],
  ['Black-necked Stork', 'Wing injury', 'High', 0, 'Rescued', 1, 1, 12],
  ['Common Kingfisher', 'Head trauma', 'High', 2, 'In Progress', 2, 0, 5],
  ['Greater Flamingo', 'Exhaustion', 'Medium', 3, 'Assigned', 3, 2, 3],
  ['Sarus Crane', 'Entangled', 'Critical', 1, 'Pending', 0, null, 1],
  ['Bar-headed Goose', 'Exhaustion', 'Low', 4, 'Completed', 1, 2, 40],
  [null, 'Orphaned chick', 'Medium', 2, 'Pending', 2, null, 2],
  ['Indian Peafowl', 'Poisoning', 'Critical', 3, 'Cancelled', 3, null, 18],
  ['Demoiselle Crane', 'Wing injury', 'Medium', 0, 'Completed', 2, 1, 33],
  ['Common Kingfisher', 'Other', 'Low', 4, 'Rejected', 0, null, 9],
];

const PATH = ['Pending', 'Assigned', 'In Progress', 'Rescued', 'Completed'];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Volunteer, Bird, Rescue, MigrationObservation].map((m) => m.deleteMany({})));

  const admin = await User.create({ name: 'Udaanika Admin', email: 'admin@udaanika.dev', password: PASSWORD, role: 'admin', location: 'Delhi' });
  const users = [];
  for (const [name, email, location] of [
    ['Aarav Sharma', 'aarav@udaanika.dev', 'Delhi'], ['Diya Patel', 'diya@udaanika.dev', 'Ahmedabad'],
    ['Kabir Singh', 'kabir@udaanika.dev', 'Gurugram'], ['Meera Nair', 'meera@udaanika.dev', 'Bharatpur'],
  ]) users.push(await User.create({ name, email, password: PASSWORD, location, phone: '98765432' + String(10 + users.length) }));

  const volunteers = [];
  for (const [name, email, area, spec, exp] of [
    ['Rohan Verma', 'rohan@udaanika.dev', 'Delhi NCR', ['Raptors', 'Wing injuries'], '5 years with a wildlife rescue NGO'],
    ['Ananya Iyer', 'ananya@udaanika.dev', 'Rajasthan', ['Waterbirds', 'Cranes'], 'Veterinary student, 2 years volunteering'],
    ['Imran Qureshi', 'imran@udaanika.dev', 'Gujarat', ['Flamingos', 'Waterbirds'], '8 years bird rehabilitation'],
  ]) {
    const user = await User.create({ name, email, password: PASSWORD, role: 'volunteer', location: area, phone: '99887766' + String(10 + volunteers.length) });
    volunteers.push(await Volunteer.create({
      user: user._id, serviceArea: area, specialization: spec, experience: exp,
      availability: 'available', verificationStatus: 'verified', emergencyContact: '1800000000',
    }));
  }

  await Bird.insertMany(BIRDS.map(([commonName, scientificName, habitat, migrationPattern, conservationStatus, description]) =>
    ({ commonName, scientificName, habitat, migrationPattern, conservationStatus, description })));

  for (const [species, injuryType, severity, loc, status, rep, vol, age] of RESCUES) {
    const chain = status === 'Cancelled' ? ['Pending', 'Cancelled'] : status === 'Rejected' ? ['Pending', 'Rejected'] : PATH.slice(0, PATH.indexOf(status) + 1);
    const [locationName, latitude, longitude] = LOCATIONS[loc];
    await Rescue.create({
      reportedBy: users[rep]._id,
      assignedVolunteer: vol !== null && chain.includes('Assigned') ? volunteers[vol]._id : undefined,
      birdSpecies: species || undefined,
      birdIdentificationConfidence: species ? 0.8 + (age % 15) / 100 : undefined,
      description: `${injuryType} noticed near ${locationName}. Bird is unable to fly and needs assistance.`,
      injuryType, severity, locationName, latitude, longitude, contactNumber: users[rep].phone, status,
      statusHistory: chain.map((s, i) => ({ status: s, changedBy: s === 'Pending' ? users[rep]._id : admin._id, at: daysAgo(age - i * 0.2) })),
      completedAt: status === 'Completed' ? daysAgo(Math.max(age - 2, 0)) : undefined,
      createdAt: daysAgo(age),
    });
  }
  await Volunteer.updateMany({}, { $set: { rescuesCompleted: 1 } });

  const obs = [];
  const species = ['Bar-headed Goose', 'Demoiselle Crane', 'Greater Flamingo', 'Sarus Crane', 'Black-necked Stork'];
  for (let i = 0; i < 18; i += 1) {
    const [location, latitude, longitude] = LOCATIONS[i % LOCATIONS.length];
    obs.push({
      species: species[i % species.length], observer: users[i % users.length]._id, location, latitude, longitude,
      observationDate: daysAgo(10 + i * 17), count: 5 + ((i * 13) % 80),
      direction: ['S', 'SW', 'SE', 'N', 'NW'][i % 5], weather: ['Clear', 'Foggy', 'Overcast', 'Light wind'][i % 4],
      notes: 'Flock observed resting and feeding near the water.',
    });
  }
  await MigrationObservation.insertMany(obs);

  console.log('Seed complete.\nDemo logins (development only), password for all: ' + PASSWORD);
  console.log('  admin@udaanika.dev | aarav@udaanika.dev (user) | rohan@udaanika.dev (volunteer)');
  await mongoose.disconnect();
}

seed().catch(async (err) => { console.error(err); await mongoose.disconnect(); process.exit(1); });
