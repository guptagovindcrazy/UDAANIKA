const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    experience: { type: String, trim: true },
    specialization: [{ type: String, trim: true }],
    availability: { type: String, enum: ['available', 'busy', 'offline'], default: 'available', index: true },
    serviceArea: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    rescuesCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
