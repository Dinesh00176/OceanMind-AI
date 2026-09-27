const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema(
  {
    depth: {
      type: Number,
      required: true,
      min: 0,
      max: 6000, // Deep ARGO measures down to 6000m
    },
    pressure: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      min: -3,
      max: 40,
    },
    salinity: {
      type: Number,
      min: 20,
      max: 45,
    },
    dissolvedOxygen: {
      type: Number,
      min: 0,
      max: 500,
    },
    qcFlag: {
      type: Number,
      default: 1, // 1=Good, 2=Probably Good
      enum: [1, 2, 3, 4],
    },
  },
  { _id: false }
);

const argoProfileSchema = new mongoose.Schema(
  {
    floatId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    cycleNumber: {
      type: Number,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    region: {
      type: String,
      required: true,
      index: true,
      enum: [
        'Indian Ocean',
        'Arabian Sea',
        'Bay of Bengal',
        'Pacific Ocean',
        'Atlantic Ocean',
        'Southern Ocean',
      ],
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    platformType: {
      type: String,
      default: 'PROVOR_III',
    },
    wmoNumber: {
      type: String,
    },
    dataMode: {
      type: String,
      enum: ['R', 'A', 'D'], // Real-time, Adjusted, Delayed-mode
      default: 'D',
    },
    measurements: [measurementSchema],
  },
  {
    timestamps: true,
  }
);

// Geospatial index for spatial bounding box and distance queries
argoProfileSchema.index({ location: '2dsphere' });

// Compound indexes for fast multi-parameter filtering
argoProfileSchema.index({ region: 1, timestamp: -1 });
argoProfileSchema.index({ floatId: 1, cycleNumber: 1 });
argoProfileSchema.index({ 'measurements.depth': 1 });

module.exports = mongoose.model('ArgoProfile', argoProfileSchema);
