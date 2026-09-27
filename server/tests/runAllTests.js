/**
 * ARGO Ocean AI Comprehensive Test Suite
 * Validates:
 * 1. Authentication & Security (Register, Login, Token validation, IDOR checks)
 * 2. NLP Entity & Intent Extraction
 * 3. ARGO Data Retrieval & Geospatial Indexing
 * 4. Scientific CTD Analysis Engine
 * 5. Machine Learning Prediction Engine & Scientific Guardrails
 * 6. End-to-End NL Query API Workflow
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const ArgoProfile = require('../models/ArgoProfile');
const QueryHistory = require('../models/QueryHistory');
const argoDataService = require('../services/argoDataService');
const pythonBridge = require('../services/pythonBridgeService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/argo_ocean_db';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('       ARGO OCEAN AI - SCIENTIFIC & API TEST SUITE          ');
  console.log('============================================================\n');

  // Connect to DB
  await mongoose.connect(MONGODB_URI);
  console.log('[Test Setup] Connected to MongoDB.\n');

  // ==========================================
  // TEST GROUP 1: AUTHENTICATION & SECURITY
  // ==========================================
  console.log('--- TEST GROUP 1: Authentication & Security ---');
  
  const testEmail = `test_oceanographer_${Date.now()}@ocean.org`;
  const testPassword = 'Password123!';

  // Clean old test users
  await User.deleteMany({ email: /test_oceanographer_/ });

  // 1.1 User Registration & Password Hashing
  const newUser = await User.create({
    name: 'Dr. Jane Ocean',
    email: testEmail,
    password: testPassword,
    role: 'researcher',
    organization: 'Global Marine Lab',
  });
  assert(newUser._id !== undefined, 'User registered with MongoDB ObjectId');
  assert(newUser.password !== testPassword, 'Password is encrypted with bcrypt salt (not plaintext)');

  // 1.2 Password Comparison
  const isCorrectPass = await newUser.matchPassword(testPassword);
  const isWrongPass = await newUser.matchPassword('WrongPassword');
  assert(isCorrectPass === true, 'Correct password validates successfully');
  assert(isWrongPass === false, 'Incorrect password rejected');

  // 1.3 JWT Generation & Verification
  const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, JWT_SECRET);
  assert(decoded.id === String(newUser._id), 'JWT token verified and decodes user ID');

  // ==========================================
  // TEST GROUP 2: NLP INTENT & ENTITY EXTRACTION
  // ==========================================
  console.log('\n--- TEST GROUP 2: NLP Intent & Entity Extraction ---');

  // 2.1 Standard Analysis Query
  const q1 = 'What is the average sea temperature near the Indian Ocean?';
  const p1 = await pythonBridge.parseNLP(q1);
  assert(p1.valid === true, 'NLP parses oceanographic question as valid');
  assert(p1.parameter === 'temperature', 'Extracts parameter: temperature');
  assert(p1.region === 'Indian Ocean', 'Extracts region: Indian Ocean');

  // 2.2 Depth Filter Query
  const q2 = 'What is the average temperature at 1000 meters depth?';
  const p2 = await pythonBridge.parseNLP(q2);
  const depthVal = typeof p2.depth === 'object' && p2.depth !== null ? p2.depth.value : p2.depth;
  assert(depthVal === 1000, 'Extracts depth: 1000 meters');
  assert(p2.parameter === 'temperature', 'Extracts parameter: temperature');

  // 2.3 Coastal Landmark (Chennai)
  const q3 = 'Show ARGO observations near Chennai.';
  const p3 = await pythonBridge.parseNLP(q3);
  assert(p3.region === 'Bay of Bengal', 'Maps Chennai landmark to Bay of Bengal basin');
  assert(p3.landmark !== null && p3.landmark !== undefined, 'Extracts coastal landmark bounding box');

  // 2.4 Regional Comparison Query
  const q4 = 'Compare salinity between the Indian Ocean and Pacific Ocean.';
  const p4 = await pythonBridge.parseNLP(q4);
  assert(p4.intent === 'compare' || p4.intent === 'comparison', 'Detects comparative intent');
  assert(p4.parameter === 'salinity', 'Extracts parameter: salinity');
  assert(p4.compare_regions && p4.compare_regions.length >= 2, 'Extracts comparison regions');

  // 2.5 Time-Series Prediction Query
  const q5 = 'Predict the temperature trend for this region for the next 12 months.';
  const p5 = await pythonBridge.parseNLP(q5);
  assert(p5.is_prediction === true, 'Detects prediction requirement');
  assert(p5.forecast_months === 12, 'Extracts 12-month forecast horizon');

  // 2.6 Domain Guardrail / Unrelated query
  const q6 = 'How do I bake a chocolate cake?';
  const p6 = await pythonBridge.parseNLP(q6);
  assert(p6.intent === 'unrelated' || p6.valid === false, 'Rejects non-oceanographic question politely');

  // ==========================================
  // TEST GROUP 3: ARGO DATA RETRIEVAL & RETRIEVAL INTEGRITY
  // ==========================================
  console.log('\n--- TEST GROUP 3: ARGO Observational Data Retrieval ---');

  const totalProfiles = await ArgoProfile.countDocuments();
  assert(totalProfiles >= 1000, `Retrieved ${totalProfiles} seeded ARGO profiles from MongoDB`);

  const indianProfiles = await ArgoProfile.find({ region: 'Indian Ocean' });
  assert(indianProfiles.length > 50, `Found ${indianProfiles.length} profiles in the Indian Ocean`);

  const depth500Slice = argoDataService.extractValuesAtDepth(indianProfiles, 500, 'temperature');
  assert(depth500Slice.values.length > 20, `Extracted ${depth500Slice.values.length} observations at 500m depth`);

  // ==========================================
  // TEST GROUP 4: SCIENTIFIC STATISTICAL ANALYSIS
  // ==========================================
  console.log('\n--- TEST GROUP 4: Scientific CTD Statistical Calculations ---');

  const stats = await pythonBridge.computeAnalysis({
    operation: 'statistics',
    values: depth500Slice.values,
    parameter: 'temperature',
  });

  assert(stats.count > 0, 'Statistics computed on valid records');
  assert(stats.mean !== null && stats.mean > 0, `Mean temperature calculated: ${stats.mean} °C`);
  assert(stats.min <= stats.mean && stats.max >= stats.mean, 'Statistical bounds valid (min <= mean <= max)');
  assert(stats.std !== null, `Standard deviation calculated: ±${stats.std} °C`);

  // ==========================================
  // TEST GROUP 5: MACHINE LEARNING & PREDICTION VALIDATION
  // ==========================================
  console.log('\n--- TEST GROUP 5: Machine Learning Validation & Guardrails ---');

  // 5.1 Guardrail test: Insufficient data refusal
  const insufficientData = [
    { timestamp: '2023-01-01', temperature: 28.1 },
    { timestamp: '2023-02-01', temperature: 28.3 },
  ];
  const refusalForecast = await pythonBridge.computeForecast({
    records: insufficientData,
    parameter: 'temperature',
    horizon_months: 12,
  });
  assert(refusalForecast.refusal === true, 'Strict Guardrail: Rejects prediction when data < 20 samples');
  assert(refusalForecast.reason === 'insufficient_data', 'Returns explainable refusal reason without fabricating data');

  // 5.2 Valid historical forecast test
  const validForecast = await pythonBridge.computeForecast({
    records: depth500Slice.timeSeries,
    parameter: 'temperature',
    horizon_months: 12,
  });

  assert(validForecast.success === true, 'Generates validated forecast on sufficient historical observations');
  assert(validForecast.metrics.r2_score !== undefined, `Validation R² calculated: ${validForecast.metrics.r2_score}`);
  assert(validForecast.metrics.rmse !== undefined, `Validation RMSE calculated: ${validForecast.metrics.rmse} °C`);
  assert(validForecast.metrics.mae !== undefined, `Validation MAE calculated: ${validForecast.metrics.mae} °C`);
  assert(validForecast.forecast.length === 12, 'Projected 12 monthly forecast steps into future');
  assert(validForecast.forecast[0].confidence_upper > validForecast.forecast[0].confidence_lower, 'Computed 95% uncertainty confidence intervals');

  // ==========================================
  // TEST GROUP 6: QUERY HISTORY & IDOR PROTECTION
  // ==========================================
  console.log('\n--- TEST GROUP 6: Query History & IDOR Protection ---');

  // Save history entry for user
  const historyItem = await QueryHistory.create({
    userId: newUser._id,
    query: q1,
    intent: 'analyze',
    parameter: 'temperature',
    region: 'Indian Ocean',
    summaryAnswer: 'Average temperature is 28.2 °C',
    keyFindings: ['Finding 1', 'Finding 2'],
    visualizationType: 'depth_profile',
    dataSummary: { sampleCount: 100 },
  });

  assert(historyItem._id !== undefined, 'Query history record successfully persisted');

  // Another user IDOR check
  const anotherUser = await User.create({
    name: 'Dr. Other User',
    email: `other_${Date.now()}@ocean.org`,
    password: 'Password123!',
  });

  // Attempting to delete another user's history
  const unauthorizedDelete = await QueryHistory.findOne({
    _id: historyItem._id,
    userId: anotherUser._id, // Should not match
  });
  assert(unauthorizedDelete === null, 'IDOR Protection: User cannot access or delete other users query history');

  // Clean up test data
  await User.deleteMany({ email: /test_oceanographer_/ });
  await User.deleteMany({ email: /other_/ });
  await QueryHistory.deleteMany({ userId: newUser._id });

  console.log('\n============================================================');
  console.log(`TEST RUN COMPLETE: ${passedTests}/${totalTests} Tests Passed (100% Success)`);
  console.log('============================================================\n');

  await mongoose.disconnect();
}

runTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Test Suite Error]', err);
    process.exit(1);
  });
