/**
 * Automated Verification Test Suite for ARGO Ocean AI Platform
 * Tests all 3 operational modes (Data Analysis, RAG Knowledge, Hybrid Data + RAG),
 * the exact 5 required questions, edge cases, context inheritance, and pluralization.
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('============================================================');
  console.log('   ARGO OCEAN AI: 3-MODE COMPREHENSIVE VERIFICATION SUITE   ');
  console.log('============================================================\n');

  try {
    // -------------------------------------------------------------
    // TEST 1 (Mode 1): Bay of Bengal Average Temperature
    // -------------------------------------------------------------
    console.log('[TEST 1] "What is the average temperature of the ocean in the Bay of Bengal?"');
    const res1 = await client.post('/query', {
      query: 'What is the average temperature of the ocean in the Bay of Bengal?',
    });
    const d1 = res1.data;
    assert(d1.success === true, 'API returns success: true');
    assert(d1.type === 'average', `Intent is average (got: ${d1.type})`);
    assert(d1.dataUsed.region === 'Bay of Bengal', `Region is Bay of Bengal (got: ${d1.dataUsed.region})`);
    assert(d1.dataUsed.depthIsDefault === true, 'No depth specified: explicitly flagged as default');
    assert(d1.dataUsed.depthValue === 0, `Defaults to surface layer 0m (got: ${d1.dataUsed.depthValue})`);
    assert(d1.dataUsed.floatCount > 0, `Float count is positive (got: ${d1.dataUsed.floatCount})`);
    assert(d1.answer.includes('average observed sea temperature is'), 'Answer contains calculated mean');
    assert(d1.visualization?.type === 'time_series', 'Visualization is time_series');
    console.log(`  -> Calculated Answer: ${d1.answer.slice(0, 100)}...\n`);

    // -------------------------------------------------------------
    // TEST 2 (Mode 1): Indian Ocean Multi-Parameter Depth Profile
    // -------------------------------------------------------------
    console.log('[TEST 2] "Show the temperature and salinity profile at different depths in the Indian Ocean."');
    const res2 = await client.post('/query', {
      query: 'Show the temperature and salinity profile at different depths in the Indian Ocean.',
    });
    const d2 = res2.data;
    assert(d2.success === true, 'API returns success: true');
    assert(d2.type === 'profile', `Intent is profile (got: ${d2.type})`);
    assert(Array.isArray(d2.dataUsed.parameters), 'dataUsed.parameters is an array');
    assert(d2.dataUsed.parameters.includes('temperature') && d2.dataUsed.parameters.includes('salinity'), 'Both temperature and salinity extracted');
    assert(d2.visualization?.type === 'depth_profile', 'Visualization is depth_profile');
    assert(Array.isArray(d2.visualization.curve) && d2.visualization.curve.length > 5, `Depth curve has multiple levels (count: ${d2.visualization.curve?.length})`);
    const sampleLevel = d2.visualization.curve[0];
    assert(sampleLevel.temperature !== undefined && sampleLevel.salinity !== undefined, 'Curve levels contain BOTH temperature and salinity');
    assert(d2.answer.includes('Temp') && d2.answer.includes('Salinity'), 'Answer discusses both parameters');
    console.log(`  -> Curve Sample @ ${sampleLevel.depth}m: Temp=${sampleLevel.temperature}°C, Salinity=${sampleLevel.salinity} PSU\n`);

    // -------------------------------------------------------------
    // TEST 3 (Mode 1): 2024 Indian Ocean Temperature Filter
    // -------------------------------------------------------------
    console.log('[TEST 3] "What was the average sea temperature in the Indian Ocean during 2024?"');
    const res3 = await client.post('/query', {
      query: 'What was the average sea temperature in the Indian Ocean during 2024?',
    });
    const d3 = res3.data;
    assert(d3.success === true, 'API returns success: true');
    assert(d3.type === 'average', `Intent is average (got: ${d3.type})`);
    assert(d3.dataUsed.dateRange === '2024', `Year filter 2024 strictly applied (got: ${d3.dataUsed.dateRange})`);
    assert(d3.dataUsed.depthValue === 0, 'Evaluated at surface 0m default');
    assert(d3.answer.includes('during 2024'), 'Answer explicitly references 2024 observation bracket');
    console.log(`  -> 2024 Observation Answer: ${d3.answer.slice(0, 100)}...\n`);

    // -------------------------------------------------------------
    // TEST 4 (Mode 1): Regional Comparison (Bay of Bengal vs Arabian Sea)
    // -------------------------------------------------------------
    console.log('[TEST 4] "Compare the temperature and salinity between the Bay of Bengal and the Arabian Sea."');
    const res4 = await client.post('/query', {
      query: 'Compare the temperature and salinity between the Bay of Bengal and the Arabian Sea.',
    });
    const d4 = res4.data;
    assert(d4.success === true, 'API returns success: true');
    assert(d4.type === 'comparison', `Intent is comparison (got: ${d4.type})`);
    assert(d4.visualization?.type === 'regional_bar', 'Visualization is regional_bar');
    assert(Array.isArray(d4.visualization.chartData) && d4.visualization.chartData.length >= 2, 'Chart data has both regions');
    const rBob = d4.visualization.chartData.find((r) => r.region === 'Bay of Bengal');
    const rAs = d4.visualization.chartData.find((r) => r.region === 'Arabian Sea');
    assert(rBob && rAs, 'Both Bay of Bengal and Arabian Sea present in comparison');
    assert(rBob?.temperature !== undefined && rBob?.salinity !== undefined, 'Bay of Bengal row has both temp and salinity');
    assert(rAs?.temperature !== undefined && rAs?.salinity !== undefined, 'Arabian Sea row has both temp and salinity');
    assert(d4.dataUsed.floatCount > 0, `Total unique floats calculated (got: ${d4.dataUsed.floatCount})`);
    console.log(`  -> BoB: Temp=${rBob?.temperature}°C, Sal=${rBob?.salinity} PSU | AS: Temp=${rAs?.temperature}°C, Sal=${rAs?.salinity} PSU\n`);

    // -------------------------------------------------------------
    // TEST 5 (Mode 1): 500m 5-Year Temporal Trend Analysis
    // -------------------------------------------------------------
    console.log('[TEST 5] "Show the trend of ocean temperature at 500 meters depth over the last 5 years."');
    const res5 = await client.post('/query', {
      query: 'Show the trend of ocean temperature at 500 meters depth over the last 5 years.',
    });
    const d5 = res5.data;
    assert(d5.success === true, 'API returns success: true');
    assert(d5.type === 'trend', `Intent is trend (got: ${d5.type})`);
    assert(d5.dataUsed.depthValue === 500, `Target depth is 500m (got: ${d5.dataUsed.depthValue})`);
    assert(d5.visualization?.trendSummary !== undefined, 'trendSummary object is present');
    const ts = d5.visualization.trendSummary;
    assert(ts.start_value !== null && ts.end_value !== null, `Start value (${ts.start_value}) and end value (${ts.end_value}) present`);
    assert(ts.trend_direction !== undefined, `Trend direction present: ${ts.trend_direction}`);
    assert(d5.answer.includes('Starting value is') && d5.answer.includes('Trend:'), 'Answer has textual trend metrics summary');
    console.log(`  -> Trend Summary: Start=${ts.start_value}°C, End=${ts.end_value}°C, Change=${ts.change}°C, Dir=${ts.trend_direction}\n`);

    // -------------------------------------------------------------
    // TEST 6 (Mode 2): RAG Knowledge — What is an ARGO float?
    // -------------------------------------------------------------
    console.log('[TEST 6] (RAG) "What is an ARGO float?"');
    const res6 = await client.post('/query', {
      query: 'What is an ARGO float?',
    });
    const d6 = res6.data;
    assert(d6.success === true, 'API returns success: true');
    assert(d6.type === 'knowledge', `Query routed to knowledge mode (got: ${d6.type})`);
    assert(d6.queryMode === 'rag_knowledge', 'queryMode is rag_knowledge');
    assert(d6.dataUsed === null, 'Numerical data is NOT used for pure conceptual knowledge');
    assert(d6.answer.includes('autonomous, free-drifting robotic') || d6.answer.includes('ARGO float'), 'Answer explains ARGO float');
    assert(Array.isArray(d6.sources) && d6.sources.length > 0, `Official sources cited (count: ${d6.sources?.length})`);
    assert(d6.sources[0].doc_title !== undefined, `Top source title: ${d6.sources[0]?.doc_title}`);
    console.log(`  -> Knowledge Answer: ${d6.answer.slice(0, 100)}...\n`);

    // -------------------------------------------------------------
    // TEST 7 (Mode 2): RAG Knowledge — How does an ARGO float work?
    // -------------------------------------------------------------
    console.log('[TEST 7] (RAG) "How does an ARGO float work?"');
    const res7 = await client.post('/query', {
      query: 'How does an ARGO float work?',
    });
    const d7 = res7.data;
    assert(d7.success === true, 'API returns success: true');
    assert(d7.type === 'knowledge', 'Query routed to knowledge mode');
    assert(d7.answer.includes('buoyancy engine') || d7.answer.includes('Archimedes'), 'Explains buoyancy engine / Archimedes principle');
    assert(d7.answer.includes('10-day cycle') || d7.answer.includes('parking depth'), 'Explains 10-day operational cycle');
    console.log(`  -> Float Operation Answer: ${d7.answer.slice(0, 100)}...\n`);

    // -------------------------------------------------------------
    // TEST 8 (Mode 2): RAG Knowledge — ARGO Data System & GDAC
    // -------------------------------------------------------------
    console.log('[TEST 8] (RAG) "What is the ARGO Data System and GDAC?"');
    const res8 = await client.post('/query', {
      query: 'What is the ARGO Data System and GDAC?',
    });
    const d8 = res8.data;
    assert(d8.success === true, 'API returns success: true');
    assert(d8.type === 'knowledge', 'Query routed to knowledge mode');
    assert(d8.answer.includes('GDAC') || d8.answer.includes('DAC'), 'Explains DACs and GDAC architecture');
    assert(d8.answer.includes('Coriolis') || d8.answer.includes('mirrors'), 'Identifies GDAC mirror centers');
    console.log(`  -> Data System Answer: ${d8.answer.slice(0, 100)}...\n`);

    // -------------------------------------------------------------
    // TEST 9 (Mode 2): RAG Knowledge — Quality Control Procedures
    // -------------------------------------------------------------
    console.log('[TEST 9] (RAG) "What are ARGO quality-control procedures?"');
    const res9 = await client.post('/query', {
      query: 'What are ARGO quality-control procedures?',
    });
    const d9 = res9.data;
    assert(d9.success === true, 'API returns success: true');
    assert(d9.type === 'knowledge', 'Query routed to knowledge mode');
    assert(d9.answer.includes('Real-Time') && d9.answer.includes('Delayed-Mode'), 'Explains two-tier RTQC and DMQC');
    assert(d9.answer.includes('19') || d9.answer.includes('tests'), 'Mentions automated test suite');
    assert(Array.isArray(d9.keyPrinciples) && d9.keyPrinciples.length > 0, 'Core QC principles extracted');
    console.log(`  -> QC Procedures Answer: ${d9.answer.slice(0, 100)}...\n`);

    // -------------------------------------------------------------
    // TEST 10 (Mode 3): Hybrid — 500m Temperature + Physics Explanation
    // -------------------------------------------------------------
    console.log('[TEST 10] (HYBRID) "The temperature at 500m is 2.34°C. Why is it lower than the surface temperature?"');
    const res10 = await client.post('/query', {
      query: 'The temperature at 500m is 2.34°C. Why is it lower than the surface temperature?',
    });
    const d10 = res10.data;
    assert(d10.success === true, 'API returns success: true');
    assert(d10.type === 'hybrid', `Query routed to hybrid mode (got: ${d10.type})`);
    assert(d10.queryMode === 'hybrid_data_rag', 'queryMode is hybrid_data_rag');
    assert(d10.dataUsed !== null && d10.dataUsed.observationCount > 0, 'Numerical ARGO observations used');
    assert(d10.dataUsed.depthValue === 500, `Depth evaluated at 500m (got: ${d10.dataUsed.depthValue})`);
    assert(d10.scientificExplanation !== undefined, 'scientificExplanation block is present');
    assert(d10.scientificExplanation.explanation.includes('Beer-Lambert') || d10.scientificExplanation.explanation.includes('Solar') || d10.scientificExplanation.explanation.includes('thermocline'), 'Explains physical solar attenuation / thermocline');
    assert(Array.isArray(d10.sources) && d10.sources.length >= 2, 'Cites BOTH observational data source and literature');
    assert(d10.sources.some((s) => s.type === 'argo_data'), 'Contains ARGO observational data source');
    assert(d10.sources.some((s) => s.type === 'literature'), 'Contains oceanographic literature citation');
    console.log(`  -> Hybrid Answer Preview: ${d10.answer.slice(0, 140)}...\n`);

    // -------------------------------------------------------------
    // TEST 11: Anaphoric Context Continuation
    // -------------------------------------------------------------
    console.log('[TEST 11] Context Continuation: "Now show it at 1000m" following Test 5');
    const res11 = await client.post('/query', {
      query: 'Now show it at 1000m',
      context: d5.context,
    });
    const d11 = res11.data;
    assert(d11.success === true, 'API returns success: true');
    assert(d11.dataUsed.depthValue === 1000, `Depth changed to 1000m via anaphora (got: ${d11.dataUsed.depthValue})`);
    assert(d11.dataUsed.parameters.includes('temperature'), 'Inherited parameter temperature from context');
    console.log(`  -> Context Follow-up: Depth=${d11.dataUsed.depthValue}m, Param=${d11.dataUsed.parameter}\n`);

    // -------------------------------------------------------------
    // TEST 12: Standalone Query Does NOT Inherit 1000m Depth
    // -------------------------------------------------------------
    console.log('[TEST 12] Context Isolation: New standalone query following 1000m query');
    const res12 = await client.post('/query', {
      query: 'What is the average temperature in the Arabian Sea?',
      context: d11.context, // previous context had depth: 1000
    });
    const d12 = res12.data;
    assert(d12.success === true, 'API returns success: true');
    assert(d12.dataUsed.region === 'Arabian Sea', `Region changed to Arabian Sea (got: ${d12.dataUsed.region})`);
    assert(d12.dataUsed.depthValue === 0, `Did NOT leak 1000m depth; defaulted to surface 0m (got: ${d12.dataUsed.depthValue})`);
    assert(d12.dataUsed.depthIsDefault === true, 'Depth marked as default');
    console.log(`  -> Isolated Query Result: Region=${d12.dataUsed.region}, Depth=${d12.dataUsed.depthValue}m (default: ${d12.dataUsed.depthIsDefault})\n`);

    // -------------------------------------------------------------
    // TEST 13: Domain Guardrail / Unrelated query
    // -------------------------------------------------------------
    console.log('[TEST 13] Domain Guardrail: "How do I bake a chocolate cake?"');
    const res13 = await client.post('/query', {
      query: 'How do I bake a chocolate cake?',
    });
    const d13 = res13.data;
    assert(d13.type === 'unrelated' || d13.valid === false, `Unrelated query handled gracefully (got type: ${d13.type})`);
    assert(d13.suggestedFollowUps && d13.suggestedFollowUps.length > 0, 'Offers oceanographic follow-up suggestions');
    console.log(`  -> Guardrail Message: ${d13.answer.slice(0, 80)}...\n`);

  } catch (err) {
    console.error('Fatal test error:', err.response?.data || err.message);
    failed++;
  }

  console.log('============================================================');
  console.log(`   FINAL RESULTS: ${passed} PASSED | ${failed} FAILED       `);
  console.log('============================================================\n');

  if (failed === 0) {
    console.log('ALL VERIFICATION ASSERTIONS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error(`FAILED: ${failed} assertions did not pass.`);
    process.exit(1);
  }
}

runTests();
