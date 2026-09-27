/**
 * ARGO Oceanographic Dataset Seeding Script
 * Generates and loads high-fidelity scientific ARGO profiling floats data
 * into MongoDB with geospatial 2dsphere indexes.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ArgoProfile = require('../models/ArgoProfile');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/argo_ocean_db';

// Oceanographic basin configurations and baseline properties
const BASIN_SPECS = [
  {
    region: 'Arabian Sea',
    floatCount: 5,
    wmoPrefix: '2902',
    baseLat: 17.0,
    baseLon: 71.0,
    latSpread: 6.0,
    lonSpread: 7.0,
    surfTempMean: 28.5,
    deepTemp: 2.2,
    thermoclineDepth: 80,
    surfSalMean: 36.4, // High salinity Arabian Sea Water (ASW)
    deepSal: 34.7,
    omzDepth: 400, // Intense Oxygen Minimum Zone
  },
  {
    region: 'Bay of Bengal',
    floatCount: 5,
    wmoPrefix: '2903',
    baseLat: 14.0,
    baseLon: 83.5,
    latSpread: 6.0,
    lonSpread: 7.5,
    surfTempMean: 29.0,
    deepTemp: 2.3,
    thermoclineDepth: 70,
    surfSalMean: 32.2, // Low salinity freshwater plume from river runoff
    deepSal: 34.8,
    omzDepth: 500,
  },
  {
    region: 'Indian Ocean',
    floatCount: 6,
    wmoPrefix: '1902',
    baseLat: -5.0,
    baseLon: 75.0,
    latSpread: 8.0,
    lonSpread: 12.0,
    surfTempMean: 28.0,
    deepTemp: 2.0,
    thermoclineDepth: 110,
    surfSalMean: 35.1,
    deepSal: 34.7,
    omzDepth: 600,
  },
  {
    region: 'Pacific Ocean',
    floatCount: 5,
    wmoPrefix: '5906',
    baseLat: 12.0,
    baseLon: 155.0,
    latSpread: 8.0,
    lonSpread: 15.0,
    surfTempMean: 27.5,
    deepTemp: 1.8,
    thermoclineDepth: 140,
    surfSalMean: 34.6,
    deepSal: 34.65,
    omzDepth: 700,
  },
  {
    region: 'Atlantic Ocean',
    floatCount: 4,
    wmoPrefix: '6902',
    baseLat: 28.0,
    baseLon: -45.0,
    latSpread: 8.0,
    lonSpread: 12.0,
    surfTempMean: 24.0,
    deepTemp: 2.5,
    thermoclineDepth: 160,
    surfSalMean: 36.8, // Subtropical high salinity
    deepSal: 34.9, // North Atlantic Deep Water
    omzDepth: 800,
  },
  {
    region: 'Southern Ocean',
    floatCount: 3,
    wmoPrefix: '5904',
    baseLat: -58.0,
    baseLon: 40.0,
    latSpread: 4.0,
    lonSpread: 20.0,
    surfTempMean: 2.5,
    deepTemp: 1.2,
    thermoclineDepth: 200,
    surfSalMean: 33.8,
    deepSal: 34.7,
    omzDepth: 1000,
  },
];

const STANDARD_DEPTHS = [0, 10, 25, 50, 100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000];

// Physical oceanographic vertical stratification curve calculation
function calculatePhysicalProfile(basin, depth, dayOfYear, yearNoise) {
  // Seasonal surface thermal oscillation (±1.8°C sinusoidal)
  const seasonalOffset = 1.8 * Math.sin((2 * Math.PI * (dayOfYear - 100)) / 365);
  const effectiveSurfTemp = basin.surfTempMean + seasonalOffset + yearNoise;
  
  // Thermocline decay curve (steep gradient between 50m and 300m)
  const zTherm = basin.thermoclineDepth;
  const temp = basin.deepTemp + (effectiveSurfTemp - basin.deepTemp) / (1 + Math.exp((depth - zTherm) / 65));
  
  // Salinity halocline curve
  let salinity;
  if (depth <= 50) {
    salinity = basin.surfSalMean + (Math.random() * 0.2 - 0.1);
  } else if (depth <= 200) {
    const fraction = (depth - 50) / 150;
    salinity = basin.surfSalMean + fraction * (basin.deepSal - basin.surfSalMean);
  } else {
    salinity = basin.deepSal + (Math.random() * 0.08 - 0.04);
  }

  // Dissolved Oxygen: Surface saturation ~210 µmol/kg, OMZ minimum at omzDepth, slight recovery in deep water
  let dOxygen;
  if (depth <= 30) {
    dOxygen = 215 + Math.random() * 10;
  } else if (depth < basin.omzDepth) {
    const omzMin = basin.region === 'Arabian Sea' ? 25 : 60;
    const frac = (depth - 30) / (basin.omzDepth - 30);
    dOxygen = 215 - frac * (215 - omzMin);
  } else {
    const omzMin = basin.region === 'Arabian Sea' ? 25 : 60;
    const frac = Math.min(1.0, (depth - basin.omzDepth) / 1200);
    dOxygen = omzMin + frac * 85;
  }

  // Pressure in decibars roughly equals depth in meters
  const pressure = depth * 1.01;

  return {
    depth,
    pressure: Math.round(pressure * 10) / 10,
    temperature: Math.round(temp * 100) / 100,
    salinity: Math.round(salinity * 100) / 100,
    dissolvedOxygen: Math.round(dOxygen * 10) / 10,
    qcFlag: 1, // ARGO Quality Control Flag 1 = Good
  };
}

async function seedDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/argo_ocean_db';
  const isAtlas = uri.includes('mongodb+srv://') || uri.includes('.mongodb.net');
  
  console.log(`[ARGO Seeder] Connecting to ${isAtlas ? 'MongoDB Atlas' : 'local MongoDB'}...`);
  
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  console.log(`[ARGO Seeder] Successfully connected to database: ${mongoose.connection.name}`);

  console.log('[ARGO Seeder] Ensuring geospatial and compound indexes...');
  await ArgoProfile.syncIndexes();

  console.log('[ARGO Seeder] Refreshing ArgoProfile collection...');
  await ArgoProfile.deleteMany({});

  const profilesToInsert = [];
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

  console.log('[ARGO Seeder] Generating synthetic multi-year ARGO profiles...');

  for (const basin of BASIN_SPECS) {
    for (let f = 1; f <= basin.floatCount; f++) {
      const floatId = `${basin.wmoPrefix}${String(f).padStart(3, '0')}`;
      let curLat = basin.baseLat + (Math.random() * basin.latSpread - basin.latSpread / 2);
      let curLon = basin.baseLon + (Math.random() * basin.lonSpread - basin.lonSpread / 2);
      
      let cycle = 1;

      // Each float profiles roughly every 10 days over years 2018-2025
      for (const year of years) {
        // Multi-year warming trend noise (~ +0.03°C per year global signal)
        const yearNoise = (year - 2018) * 0.035 + (Math.random() * 0.2 - 0.1);
        
        // 6 to 8 cycles per year per float (sampled representation)
        const numCyclesInYear = 7;
        for (let c = 0; c < numCyclesInYear; c++) {
          const dayOfYear = Math.floor((c / numCyclesInYear) * 350) + 10;
          const timestamp = new Date(Date.UTC(year, 0, dayOfYear, 12, 0, 0));

          // Float drift: current vector creates slight movement between cycles
          curLat += (Math.random() * 0.25 - 0.12);
          curLon += (Math.random() * 0.35 - 0.15);

          // Generate vertical measurements from surface down to 2000m
          const measurements = STANDARD_DEPTHS.map((depth) =>
            calculatePhysicalProfile(basin, depth, dayOfYear, yearNoise)
          );

          profilesToInsert.push({
            floatId,
            cycleNumber: cycle++,
            location: {
              type: 'Point',
              coordinates: [
                Math.round(curLon * 10000) / 10000,
                Math.round(curLat * 10000) / 10000,
              ],
            },
            region: basin.region,
            timestamp,
            platformType: 'PROVOR_III',
            wmoNumber: floatId,
            dataMode: 'D',
            measurements,
          });
        }
      }
    }
  }

  console.log(`[ARGO Seeder] Inserting ${profilesToInsert.length} ARGO profiles...`);
  await ArgoProfile.insertMany(profilesToInsert);

  const total = await ArgoProfile.countDocuments();
  const floatCount = (await ArgoProfile.distinct('floatId')).length;
  console.log(`[ARGO Seeder] Successfully seeded ${total} profiles across ${floatCount} floats!`);

  await mongoose.disconnect();
  console.log('[ARGO Seeder] Database disconnected.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[ARGO Seeder Error]', err.message);
      process.exit(1);
    });
}

module.exports = seedDatabase;
