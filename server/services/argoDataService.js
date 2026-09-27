const ArgoProfile = require('../models/ArgoProfile');

class ArgoDataService {
  /**
   * Retrieves profiles matching NLP parsed criteria.
   */
  async getProfiles(parsedQuery, limit = 500) {
    const filter = {};

    // 1. Float ID filter
    if (parsedQuery.float_id) {
      filter.floatId = parsedQuery.float_id;
    }

    // 2. Region / Geographic Filter
    if (parsedQuery.landmark && parsedQuery.landmark.bounds) {
      const [minLat, maxLat, minLon, maxLon] = parsedQuery.landmark.bounds;
      filter.location = {
        $geoWithin: {
          $box: [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
        },
      };
    } else if (parsedQuery.region) {
      filter.region = parsedQuery.region;
    }

    // 3. Temporal Filter (exact ISO bounds or year bounds)
    if (parsedQuery.time_range && parsedQuery.time_range.start && parsedQuery.time_range.end) {
      filter.timestamp = {
        $gte: new Date(parsedQuery.time_range.start),
        $lte: new Date(parsedQuery.time_range.end),
      };
    } else if (parsedQuery.start_year || parsedQuery.end_year) {
      const startYear = parsedQuery.start_year || 2018;
      const endYear = parsedQuery.end_year || 2025;
      filter.timestamp = {
        $gte: new Date(`${startYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${endYear}-12-31T23:59:59.999Z`),
      };
    }

    // 4. Depth Filter for measurements (only if not a vertical water column profile)
    const isProfile = parsedQuery.depth_obj?.isProfile || parsedQuery.intent === 'profile';
    const targetDepthVal = parsedQuery.depth_val !== undefined && parsedQuery.depth_val !== null
      ? parsedQuery.depth_val
      : (typeof parsedQuery.depth === 'object' && parsedQuery.depth !== null ? parsedQuery.depth.value : parsedQuery.depth);

    if (targetDepthVal !== null && targetDepthVal !== undefined && !isProfile) {
      const numDepth = Number(targetDepthVal);
      if (!isNaN(numDepth)) {
        filter['measurements'] = {
          $elemMatch: {
            depth: { $gte: Math.max(0, numDepth - 60), $lte: numDepth + 60 },
          },
        };
      }
    }

    const profiles = await ArgoProfile.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return profiles;
  }

  /**
   * Extracts parameter values at a specific depth layer across profiles.
   */
  extractValuesAtDepth(profiles, depth, parameter = 'temperature') {
    const values = [];
    const timeSeries = [];
    const usedFloats = new Set();

    for (const prof of profiles) {
      let matched = null;
      let minDiff = Infinity;
      for (const m of prof.measurements) {
        const diff = Math.abs(m.depth - depth);
        if (diff < minDiff && m[parameter] !== undefined && m[parameter] !== null) {
          minDiff = diff;
          matched = m;
        }
      }
      if (matched && minDiff <= 75) {
        values.push(matched[parameter]);
        usedFloats.add(prof.floatId);
        timeSeries.push({
          timestamp: prof.timestamp,
          [parameter]: matched[parameter],
          depth: matched.depth,
          floatId: prof.floatId,
          region: prof.region,
          location: prof.location,
        });
      }
    }

    return {
      values,
      timeSeries,
      uniqueFloats: Array.from(usedFloats),
      floatCount: usedFloats.size,
      profileCount: profiles.length,
      observationCount: values.length,
    };
  }

  /**
   * Extracts multiple parameters at a specific depth layer simultaneously.
   */
  extractMultiValuesAtDepth(profiles, depth, parameters = ['temperature', 'salinity']) {
    const valuesByParam = {};
    for (const p of parameters) {
      valuesByParam[p] = [];
    }
    const timeSeries = [];
    const usedFloats = new Set();

    for (const prof of profiles) {
      let matched = null;
      let minDiff = Infinity;
      for (const m of prof.measurements) {
        const diff = Math.abs(m.depth - depth);
        if (diff < minDiff) {
          minDiff = diff;
          matched = m;
        }
      }
      if (matched && minDiff <= 75) {
        usedFloats.add(prof.floatId);
        const point = {
          timestamp: prof.timestamp,
          depth: matched.depth,
          floatId: prof.floatId,
          region: prof.region,
          location: prof.location,
        };
        for (const p of parameters) {
          if (matched[p] !== undefined && matched[p] !== null) {
            valuesByParam[p].push(matched[p]);
            point[p] = matched[p];
          }
        }
        timeSeries.push(point);
      }
    }

    return {
      valuesByParam,
      timeSeries,
      uniqueFloats: Array.from(usedFloats),
      floatCount: usedFloats.size,
      profileCount: profiles.length,
      observationCount: timeSeries.length,
    };
  }

  /**
   * Retrieves fleet metadata & summary counts for the dashboard.
   */
  async getFleetMetadata() {
    const totalProfiles = await ArgoProfile.countDocuments();
    const uniqueFloats = await ArgoProfile.distinct('floatId');
    const regions = await ArgoProfile.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
          lastObservation: { $max: '$timestamp' },
          firstObservation: { $min: '$timestamp' },
        },
      },
    ]);

    return {
      totalProfiles,
      totalFloats: uniqueFloats.length,
      floatIds: uniqueFloats,
      regions: regions.map((r) => ({
        region: r._id,
        profilesCount: r.count,
        firstObservation: r.firstObservation,
        lastObservation: r.lastObservation,
      })),
    };
  }

  /**
   * Retrieves profiles for regional comparison across single or multiple parameters.
   */
  async getComparisonData(regions, depth = 0, parameters = ['temperature']) {
    const comparisonResults = {};

    for (const reg of regions) {
      const profiles = await ArgoProfile.find({ region: reg })
        .sort({ timestamp: -1 })
        .limit(300)
        .lean();

      const extracted = this.extractMultiValuesAtDepth(profiles, depth, parameters);
      comparisonResults[reg] = {
        valuesByParam: extracted.valuesByParam,
        timeSeries: extracted.timeSeries,
        uniqueFloats: extracted.uniqueFloats,
        floatCount: extracted.floatCount,
        profileCount: profiles.length,
        observationCount: extracted.observationCount,
      };
    }

    return comparisonResults;
  }
}

module.exports = new ArgoDataService();
