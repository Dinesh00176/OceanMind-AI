/**
 * Automated Verification for Database Operations:
 * User Authentication, JWT Tokens, Query History persistence,
 * and data privacy/credential protection.
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
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

async function runAuthAndHistoryTests() {
  console.log('============================================================');
  console.log('   ARGO OCEAN AI: DATABASE & AUTH INTEGRATION TEST SUITE   ');
  console.log('============================================================\n');

  try {
    // 1. Health check with database connection state
    console.log('[STEP 1] Verify Health & MongoDB Atlas Connectivity');
    const healthRes = await client.get('/health');
    assert(healthRes.status === 200, 'GET /api/health returned HTTP 200 OK');
    assert(healthRes.data.status === 'healthy', 'System status is healthy');
    assert(healthRes.data.database && healthRes.data.database.connected === true, 'Database is actively connected');
    assert(!JSON.stringify(healthRes.data).includes('mongodb'), 'Health check does NOT expose database URI or credentials');

    // 2. User Registration
    console.log('\n[STEP 2] Test User Registration against MongoDB');
    const testEmail = `researcher_${Date.now()}@ocean.org`;
    const testPassword = 'SecureResearchPassword2026!';
    const regRes = await client.post('/auth/register', {
      name: 'Dr. Marine Researcher',
      email: testEmail,
      password: testPassword,
      institution: 'National Institute of Oceanography',
    });
    assert(regRes.status === 201, 'POST /api/auth/register returned HTTP 201');
    assert(regRes.data.token && typeof regRes.data.token === 'string', 'Received JWT token upon registration');
    assert(regRes.data.user.email === testEmail, 'User profile saved with correct email');
    assert(!regRes.data.user.password, 'User password hash is not exposed in response');

    // 3. User Login
    console.log('\n[STEP 3] Test User Login');
    const loginRes = await client.post('/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returned HTTP 200');
    assert(loginRes.data.token, 'Issued valid JWT authentication token');
    const authToken = loginRes.data.token;

    // Authenticated client instance
    const authClient = axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    // 4. Authenticated User Profile
    console.log('\n[STEP 4] Test Authenticated GET /api/auth/me');
    const meRes = await authClient.get('/auth/me');
    assert(meRes.status === 200, 'GET /api/auth/me succeeded');
    assert(meRes.data.user.name === 'Dr. Marine Researcher', 'Retrieved registered user name');

    // 5. Query Execution with History Saving
    console.log('\n[STEP 5] Execute Authenticated Query & Verify MongoDB QueryHistory Save');
    const queryRes = await authClient.post('/query', {
      query: 'What is the average temperature in the Bay of Bengal?',
    });
    assert(queryRes.data.success === true, 'Query executed successfully');
    assert(queryRes.data.type === 'average', 'Query returned average calculation');

    // Brief pause to allow async history save to commit
    await new Promise((r) => setTimeout(r, 600));

    // 6. Fetch Query History
    console.log('\n[STEP 6] Test GET /api/history for Authenticated User');
    const historyRes = await authClient.get('/history');
    assert(historyRes.status === 200, 'GET /api/history succeeded');
    assert(Array.isArray(historyRes.data.history), 'History is an array');
    assert(historyRes.data.history.length >= 1, `Found ${historyRes.data.history.length} history records in MongoDB`);
    const latestItem = historyRes.data.history[0];
    assert(latestItem.query.includes('Bay of Bengal'), 'Saved query text matches submitted query');

    // 7. Delete Query History Item
    console.log('\n[STEP 7] Test DELETE /api/history/:id');
    const delRes = await authClient.delete(`/history/${latestItem._id}`);
    assert(delRes.status === 200, 'DELETE /api/history/:id succeeded');

    // 8. Verify Clear All History
    console.log('\n[STEP 8] Test DELETE /api/history (Clear All)');
    const clearRes = await authClient.delete('/history');
    assert(clearRes.status === 200, 'DELETE /api/history succeeded');

    const historyAfterClear = await authClient.get('/history');
    assert(historyAfterClear.data.history.length === 0, 'History is empty after clear operation');

    console.log('\n============================================================');
    console.log(`   FINAL RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n[Test Error]', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runAuthAndHistoryTests();
