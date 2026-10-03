const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');

let mongod;
exports.connect = async () => { mongod = await MongoMemoryServer.create(); await mongoose.connect(mongod.getUri()); };
exports.clear = async () => { for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({}); };
exports.close = async () => { await mongoose.disconnect(); await mongod.stop(); };

const makeUser = async (role = 'user') => {
  const id = Math.random().toString(36).slice(2, 8);
  const user = await User.create({ name: `Test ${role}`, email: `${role}-${id}@test.dev`, password: 'Password123', role });
  return { user, token: jwt.sign({ id: user._id, role }, process.env.JWT_SECRET) };
};
exports.makeUser = makeUser;

exports.makeVolunteer = async () => {
  const { user, token } = await makeUser('volunteer');
  const profile = await Volunteer.create({ user: user._id, serviceArea: 'Delhi', verificationStatus: 'verified' });
  return { user, token, profile };
};

exports.rescuePayload = (extra = {}) => ({
  description: 'Pigeon with a broken wing near the park gate',
  injuryType: 'Wing injury', severity: 'High', locationName: 'Lodhi Garden, Delhi', contactNumber: '9999999999', ...extra,
});

exports.bearer = (token) => ({ Authorization: `Bearer ${token}` });
