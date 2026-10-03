const mongoose = require('mongoose');

const birdSchema = new mongoose.Schema(
  {
    commonName: { type: String, required: true, unique: true, trim: true },
    scientificName: { type: String, trim: true },
    habitat: { type: String, trim: true },
    migrationPattern: { type: String, trim: true },
    conservationStatus: {
      type: String,
      enum: ['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Unknown'],
      default: 'Unknown',
    },
    image: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

birdSchema.index({ commonName: 'text', scientificName: 'text' });

module.exports = mongoose.model('Bird', birdSchema);
