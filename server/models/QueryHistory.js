const mongoose = require('mongoose');

const queryHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    intent: {
      type: String,
      default: 'query',
    },
    parameter: {
      type: String,
      default: 'temperature',
    },
    region: {
      type: String,
    },
    depth: {
      type: Number,
    },
    summaryAnswer: {
      type: String,
      required: true,
    },
    keyFindings: {
      type: [String],
      default: [],
    },
    visualizationType: {
      type: String,
      default: 'depth_profile',
    },
    dataSummary: {
      sampleCount: Number,
      profileCount: Number,
      floatCount: Number,
      dateRange: String,
      depthRange: String,
    },
    analysisData: {
      type: mongoose.Schema.Types.Mixed,
    },
    predictionData: {
      type: mongoose.Schema.Types.Mixed,
    },
    chartData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

queryHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('QueryHistory', queryHistorySchema);
