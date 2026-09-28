const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runRoutingAndContextTests() {
  console.log('\n================================================================');
  console.log('  ARGO OCEAN AI - NLP, RAG, CONTEXT & ROUTING VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Knowledge Queries (Pure Mode 2, Zero Data Leak)
  // -------------------------------------------------------------
  const knowledgeQueries = [
    'What is ARGO?',
    'What is the ARGO program?',
    'Tell me about ARGO.',
    'What is an ARGO float?',
    'How does the float move?',
    'Why does ARGO measure salinity?',
    'What is GDAC?',
    'Why is ARGO important for climate research?'
  ];

  console.log('--- 1. Testing Mode 2: Pure Knowledge Queries ---');
  for (const q of knowledgeQueries) {
    try {
      const res = await axios.post(`${BASE_URL}/query`, { query: q });
      const d = res.data;
      
      assert(d.success === true, `[${q}] returned success: true`);
      assert(d.type === 'knowledge' || d.queryMode === 'rag_knowledge', `[${q}] routed to Mode 2 (knowledge)`);
      assert(d.dataUsed === null, `[${q}] dataUsed is null (no database observations query)`);
      assert(d.visualization === null, `[${q}] visualization is null (no chart plotted)`);
      assert(d.context?.intent === 'knowledge', `[${q}] context.intent is 'knowledge'`);
      assert(d.context?.activeContext === 'Global / ARGO Knowledge', `[${q}] context.activeContext is 'Global / ARGO Knowledge'`);
      assert(d.context?.region === null, `[${q}] context.region is null (zero region leak)`);
      assert(d.context?.depth === null, `[${q}] context.depth is null (zero depth leak)`);
      assert(d.context?.parameter === null, `[${q}] context.parameter is null (zero parameter leak)`);
      assert(d.keyPrinciples?.length >= 3, `[${q}] keyPrinciples has >= 3 principles (${d.keyPrinciples?.length})`);
      assert(d.sources?.length >= 1, `[${q}] sources contains >= 1 authoritative citations (${d.sources?.length})`);
    } catch (err) {
      assert(false, `[${q}] Error: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // Test 2: Data Queries (Mode 1)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Mode 1: ARGO Observational Data Queries ---');
  try {
    const q1 = 'What is the average temperature in the Bay of Bengal?';
    const res1 = await axios.post(`${BASE_URL}/query`, { query: q1 });
    const d1 = res1.data;
    assert(d1.success === true, `[${q1}] success: true`);
    assert(d1.type === 'average', `[${q1}] type is 'average'`);
    assert(d1.dataUsed?.region === 'Bay of Bengal', `[${q1}] region is Bay of Bengal`);
    assert(d1.dataUsed?.depthValue === 0, `[${q1}] depthValue is 0m (Surface layer)`);
    assert(d1.dataUsed?.depthIsDefault === true, `[${q1}] depthIsDefault is disclosed as true`);
    assert(d1.context?.activeContext?.includes('Bay of Bengal'), `[${q1}] activeContext includes Bay of Bengal`);

    const q2 = 'What is the average temperature at 500 meters in the Indian Ocean?';
    const res2 = await axios.post(`${BASE_URL}/query`, { query: q2 });
    const d2 = res2.data;
    assert(d2.success === true, `[${q2}] success: true`);
    assert(d2.dataUsed?.region === 'Indian Ocean', `[${q2}] region is Indian Ocean`);
    assert(d2.dataUsed?.depthValue === 500, `[${q2}] depthValue is exactly 500m`);
    assert(d2.dataUsed?.depthIsDefault === false, `[${q2}] depthIsDefault is false`);

    const q3 = 'Show temperature at 1000m.';
    const res3 = await axios.post(`${BASE_URL}/query`, { query: q3 });
    const d3 = res3.data;
    assert(d3.success === true, `[${q3}] success: true`);
    assert(d3.dataUsed?.depthValue === 1000, `[${q3}] depthValue is 1000m`);
  } catch (err) {
    assert(false, `Mode 1 queries error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 3: Hybrid Query (Mode 3: Observation + Explanation)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Mode 3: Hybrid Data + Physical Explanation ---');
  try {
    const qHybrid = 'Why is the temperature in the Bay of Bengal different from the Arabian Sea?';
    const resHybrid = await axios.post(`${BASE_URL}/query`, { query: qHybrid });
    const dH = resHybrid.data;
    assert(dH.success === true, `[${qHybrid}] success: true`);
    assert(dH.type === 'hybrid', `[${qHybrid}] type is 'hybrid'`);
    assert(dH.queryMode === 'hybrid_data_rag', `[${qHybrid}] queryMode is 'hybrid_data_rag'`);
    assert(dH.observedResult !== undefined, `[${qHybrid}] observedResult contains numerical observations`);
    assert(dH.scientificExplanation !== undefined, `[${qHybrid}] scientificExplanation contains grounded physics`);
    assert(dH.scientificExplanation?.keyPrinciples?.length >= 2, `[${qHybrid}] scientific explanation has key principles`);
    assert(dH.visualization !== null, `[${qHybrid}] visualization is rendered`);
  } catch (err) {
    assert(false, `Mode 3 hybrid query error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 4: Critical Context Leakage Prevention Test
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Context Leakage Prevention (Data -> Knowledge) ---');
  try {
    // Step 1: User executes a data query
    const resData = await axios.post(`${BASE_URL}/query`, { query: 'What is the average temperature in the Indian Ocean?' });
    const priorContext = resData.data.context;
    assert(priorContext?.region === 'Indian Ocean', 'Initial query set context.region = Indian Ocean');
    assert(priorContext?.parameter === 'temperature', 'Initial query set context.parameter = temperature');

    // Step 2: User immediately asks a knowledge query passing priorContext
    const resFollowUp = await axios.post(`${BASE_URL}/query`, {
      query: 'What is the ARGO program?',
      context: priorContext
    });
    const dFollowUp = resFollowUp.data;
    
    assert(dFollowUp.type === 'knowledge', 'Knowledge query correctly routed to Mode 2 despite prior data context');
    assert(dFollowUp.dataUsed === null, 'dataUsed is null (numerical database query NOT executed)');
    assert(dFollowUp.context?.activeContext === 'Global / ARGO Knowledge', 'Active Context switched to Global / ARGO Knowledge');
    assert(dFollowUp.context?.region === null, 'context.region is null (Indian Ocean was NOT leaked)');
    assert(dFollowUp.context?.depth === null, 'context.depth is null (0m was NOT leaked)');
    assert(dFollowUp.context?.parameter === null, 'context.parameter is null (temperature was NOT leaked)');
  } catch (err) {
    assert(false, `Context leakage test error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 5: Knowledge Anaphoric Follow-up Test
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Knowledge Follow-up (What is float? -> How does it move?) ---');
  try {
    const resK1 = await axios.post(`${BASE_URL}/query`, { query: 'What is an ARGO float?' });
    const kContext = resK1.data.context;
    assert(kContext?.intent === 'knowledge', 'Initial knowledge query created knowledge context');

    const resK2 = await axios.post(`${BASE_URL}/query`, {
      query: 'How does it move?',
      context: kContext
    });
    const dK2 = resK2.data;
    assert(dK2.type === 'knowledge', "'How does it move?' routed to Mode 2 (knowledge)");
    assert(dK2.answer.includes('variable buoyancy engine') || dK2.answer.includes('buoyancy'), 'Answer correctly explains variable buoyancy engine movement');
  } catch (err) {
    assert(false, `Knowledge follow-up test error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 6: Standalone Data Query Overriding Previous Region
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Standalone Data Query Filter Override ---');
  try {
    const resD1 = await axios.post(`${BASE_URL}/query`, { query: 'What is the average temperature in the Bay of Bengal?' });
    const dContext = resD1.data.context;

    const resD2 = await axios.post(`${BASE_URL}/query`, {
      query: 'What is the temperature in the Arabian Sea?',
      context: dContext
    });
    const dD2 = resD2.data;
    assert(dD2.dataUsed?.region === 'Arabian Sea', 'New region Arabian Sea correctly overrode Bay of Bengal');
    assert(dD2.context?.region === 'Arabian Sea', 'context.region updated to Arabian Sea');
  } catch (err) {
    assert(false, `Standalone override test error: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRoutingAndContextTests();
