const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema(
  {
    species: { type: String, required: true, trim: true, index: true },
    observer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: true, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    observationDate: { type: Date, required: true, index: true },
    count: { type: Number, min: 1, default: 1 },
    direction: { type: String, enum: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] },
    weather: { type: String, trim: true },
    notes: { type: String, maxlength: 1000 },
    image: { type: String },
  },
  { timestamps: true }
);

migrationSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('MigrationObservation', migrationSchema);
