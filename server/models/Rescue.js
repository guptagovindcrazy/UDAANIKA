const mongoose = require('mongoose');
const crypto = require('crypto');
const { STATUSES } = require('../utils/rescueWorkflow');

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, maxlength: 500 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const rescueSchema = new mongoose.Schema(
  {
    requestId: { type: String, unique: true, index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', index: true },
    birdSpecies: { type: String, trim: true },
    birdIdentificationConfidence: { type: Number, min: 0, max: 1 },
    description: { type: String, required: true, maxlength: 1500 },
    injuryType: {
      type: String,
      enum: ['Wing injury', 'Leg injury', 'Head trauma', 'Entangled', 'Poisoning', 'Exhaustion', 'Orphaned chick', 'Other'],
      required: true,
    },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    imageUrl: { type: String },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    locationName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: STATUSES, default: 'Pending', index: true },
    statusHistory: [historySchema],
    volunteerNotes: { type: String, maxlength: 1500 },
    adminNotes: { type: String, maxlength: 1500 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

rescueSchema.index({ createdAt: -1 });
rescueSchema.index({ latitude: 1, longitude: 1 });

rescueSchema.pre('validate', function generateId(next) {
  if (!this.requestId) this.requestId = `UDN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  next();
});

module.exports = mongoose.model('Rescue', rescueSchema);
