const argoDataService = require('../services/argoDataService');
const ArgoProfile = require('../models/ArgoProfile');

// @desc    Get ARGO fleet metadata and summary stats
// @route   GET /api/data/metadata
// @access  Public
const getMetadata = async (req, res) => {
  try {
    const metadata = await argoDataService.getFleetMetadata();
    res.json({ success: true, metadata });
  } catch (error) {
    console.error('[Data Controller Error - Metadata]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve metadata' });
  }
};

// @desc    Search raw profiles with filters & pagination
// @route   POST /api/data/search
// @access  Public
const searchProfiles = async (req, res) => {
  try {
    const { region, floatId, depth, page = 1, limit = 20 } = req.body;
    const filter = {};

    if (region) filter.region = region;
    if (floatId) filter.floatId = floatId;

    const skip = (Math.max(1, page) - 1) * limit;
    const total = await ArgoProfile.countDocuments(filter);
    const profiles = await ArgoProfile.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      profiles,
    });
  } catch (error) {
    console.error('[Data Controller Error - Search]', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// @desc    Get float trajectories for map tracking
// @route   GET /api/data/floats
// @access  Public
const getFloatTracks = async (req, res) => {
  try {
    const { region } = req.query;
    const filter = region ? { region } : {};

    const profiles = await ArgoProfile.find(filter)
      .select('floatId cycleNumber location timestamp region')
      .sort({ floatId: 1, cycleNumber: 1 })
      .lean();

    // Group by floatId
    const floatTracks = {};
    for (const p of profiles) {
      if (!floatTracks[p.floatId]) {
        floatTracks[p.floatId] = {
          floatId: p.floatId,
          region: p.region,
          points: [],
        };
      }
      floatTracks[p.floatId].points.push({
        cycle: p.cycleNumber,
        coordinates: [p.location.coordinates[1], p.location.coordinates[0]], // [lat, lon]
        timestamp: p.timestamp,
      });
    }

    res.json({ success: true, floatTracks: Object.values(floatTracks) });
  } catch (error) {
    console.error('[Data Controller Error - Float Tracks]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve float tracks' });
  }
};

module.exports = {
  getMetadata,
  searchProfiles,
  getFloatTracks,
};
