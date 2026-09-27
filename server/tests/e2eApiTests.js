/**
 * End-to-End API Integration Tests for ARGO Ocean AI
 * Tests all primary user experience queries from Prompt Section 2 & 35
 */

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const app = require('../server');
const axios = require('axios');
let server;

const PORT = 5099;
const client = axios.create({
  baseURL: `http://localhost:${PORT}/api`,
  timeout: 10000,
});

async function runE2ETests() {
  console.log('\n============================================================');
  console.log('       ARGO OCEAN AI - END-TO-END REST API TESTS           ');
  console.log('============================================================\n');

  // Start Express on test port 5099
  server = app.listen(PORT);
  console.log(`[E2E Setup] Express test server listening on port ${PORT}`);

  let passed = 0;
  let total = 0;

  function check(condition, desc) {
    total++;
    if (!condition) {
      console.error(`  ❌ FAIL: ${desc}`);
      throw new Error(`E2E assertion failed: ${desc}`);
    } else {
      passed++;
      console.log(`  ✅ PASS: ${desc}`);
    }
  }

  try {
    // 1. Health check
    const healthRes = await client.get('/health');
    check(healthRes.data.status === 'healthy', 'GET /api/health returns healthy status');

    // 2. Query 1: Average sea temperature near Indian Ocean
    console.log('\n--- Query 1: Average Sea Temp in Indian Ocean ---');
    const q1Res = await client.post('/query', {
      query: 'What is the average sea temperature near the Indian Ocean?',
    });
    check(q1Res.data.success === true, 'Query 1 returned success');
    check(q1Res.data.answer.includes('Indian Ocean'), 'Answer references Indian Ocean');
    check(q1Res.data.keyFindings.length > 0, 'Generated key scientific findings');
    check(q1Res.data.dataUsed.profileCount > 0, 'Reported observational profile count');

    // 3. Query 2: Temperature profile at different depths in Arabian Sea
    console.log('\n--- Query 2: Vertical Depth Profile in Arabian Sea ---');
    const q2Res = await client.post('/query', {
      query: 'Show the temperature profile at different depths in the Arabian Sea.',
    });
    check(q2Res.data.success === true, 'Query 2 returned success');
    check(q2Res.data.visualization?.type === 'depth_profile', 'Selected depth_profile visualization');
    check(Array.isArray(q2Res.data.visualization?.curve), 'Curve contains depth stratification levels');
    check(q2Res.data.visualization.curve.length > 5, 'Contains multiple depth levels (0 to 2000m)');

    // 4. Query 3: Regional Salinity Comparison
    console.log('\n--- Query 3: Regional Salinity Comparison ---');
    const q3Res = await client.post('/query', {
      query: 'Compare salinity between the Indian Ocean and Pacific Ocean.',
    });
    check(q3Res.data.success === true, 'Query 3 returned success');
    check(q3Res.data.visualization?.type === 'regional_bar', 'Selected regional_bar visualization');
    check(q3Res.data.visualization.chartData.length === 2, 'Chart data contains both ocean basins');

    // 5. Query 4: Forecast Prediction for Indian Ocean
    console.log('\n--- Query 4: 12-Month ML Prediction ---');
    const q4Res = await client.post('/query', {
      query: 'Predict the temperature trend for the Indian Ocean for the next 12 months.',
    });
    check(q4Res.data.success === true, 'Query 4 returned success');
    check(q4Res.data.prediction !== null, 'Model prediction object returned');
    check(q4Res.data.prediction.refusal === false, 'Prediction was validated and accepted');
    check(q4Res.data.prediction.forecast.length === 12, '12-month forward projection generated');
    check(q4Res.data.prediction.metrics.r2_score !== undefined, 'Model R² metric evaluated');

    // 6. Query 5: Coastal observations near Chennai
    console.log('\n--- Query 5: Landmark Query (near Chennai) ---');
    const q5Res = await client.post('/query', {
      query: 'Show ARGO observations near Chennai.',
    });
    check(q5Res.data.success === true, 'Query 5 returned success');
    check(q5Res.data.visualization?.type === 'interactive_map', 'Selected interactive_map visualization');
    check(q5Res.data.visualization.markers.length > 0, 'Retrieved GPS markers for float cycles');

    // 7. Query 6: Ambiguous Query Clarification
    console.log('\n--- Query 6: Ambiguity Handling ---');
    const q6Res = await client.post('/query', {
      query: 'Show temperature',
    });
    check(q6Res.data.type === 'clarification_needed', 'Correctly identified incomplete query');
    check(q6Res.data.suggestedFollowUps.length > 0, 'Offered targeted clarification questions');

    // 8. Query 7: Domain Guardrail (Unrelated question)
    console.log('\n--- Query 7: Domain Guardrail ---');
    const q7Res = await client.post('/query', {
      query: 'What is the recipe for baking a chocolate cake?',
    });
    check(q7Res.data.type === 'unrelated', 'Recognized non-oceanographic question');
    check(q7Res.data.answer.toLowerCase().includes('oceanographic'), 'Explains domain scope politely');

    // 9. Query 8: Multi-turn Context Conversation
    console.log('\n--- Query 8: Context-Aware Dialogue Memory ---');
    // First turn: "Show temperature at 500 meters in the Indian Ocean."
    const turn1Res = await client.post('/query', {
      query: 'Show temperature at 500 meters in the Indian Ocean.',
    });
    check(turn1Res.data.context.depth === 500, 'Context retained depth = 500m');
    check(turn1Res.data.context.region === 'Indian Ocean', 'Context retained region = Indian Ocean');

    // Second turn: "Now show 1000 meters." (No region or parameter specified - should retain Indian Ocean & temperature)
    const turn2Res = await client.post('/query', {
      query: 'Now show 1000 meters.',
      context: turn1Res.data.context,
    });
    check(turn2Res.data.context.depth === 1000, 'Updated depth to 1000m');
    check(turn2Res.data.context.region === 'Indian Ocean', 'Retained Indian Ocean from conversation memory');
    check(turn2Res.data.dataUsed.parameter.toLowerCase() === 'temperature', 'Retained temperature parameter from context');

    // 10. Fleet Metadata endpoint
    console.log('\n--- Fleet Metadata Endpoint ---');
    const metaRes = await client.get('/data/metadata');
    check(metaRes.data.success === true, 'GET /api/data/metadata returned success');
    check(metaRes.data.metadata.totalProfiles >= 1000, 'Reports global profile inventory count');

    console.log('\n============================================================');
    console.log(`ALL END-TO-END API TESTS PASSED: ${passed}/${total} (100% Success)`);
    console.log('============================================================\n');

  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runE2ETests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[E2E Error]', err);
    if (server) server.close();
    process.exit(1);
  });
