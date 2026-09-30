async function testSuite() {
  console.log('--- E2E Test Suite for Unify Platform ---');

  // 1. Test Client HTML
  try {
    const clientRes = await fetch('http://localhost:5173/');
    const html = await clientRes.text();
    console.log('✅ Client HTML status:', clientRes.status, '| Length:', html.length);
    console.log('   Title:', html.match(/<title>(.*?)<\/title>/)?.[1]);
  } catch (e) {
    console.error('❌ Client fetch failed:', e.message);
  }

  // 2. Test Server Health
  try {
    const healthRes = await fetch('http://localhost:8080/api/health');
    const health = await healthRes.json();
    console.log('✅ Server Health:', health);
  } catch (e) {
    console.error('❌ Server health failed:', e.message);
  }

  // 3. Test Server Status
  try {
    const statusRes = await fetch('http://localhost:8080/api/status');
    const status = await statusRes.json();
    console.log('✅ Server Status:', status);
  } catch (e) {
    console.error('❌ Server status failed:', e.message);
  }

  // 4. Test Authenticated Route Protection
  try {
    const unauthChat = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Hello', lens: 'Agriculture' }),
    });
    console.log('✅ Auth Protection Check (No Token):', unauthChat.status, '(Expected 401 Unauthorized)');
  } catch (e) {
    console.error('❌ Auth check failed:', e.message);
  }

  // 5. Test Demo/Sandbox Authenticated Access
  try {
    const demoSources = await fetch('http://localhost:8080/api/sources', {
      headers: {
        'Authorization': 'Bearer demo-test-token',
      },
    });
    console.log('✅ Demo Token Sources Access:', demoSources.status);
    const data = await demoSources.json();
    console.log('   Sources returned:', data.sources ? data.sources.length : data);
  } catch (e) {
    console.error('❌ Demo token test failed:', e.message);
  }

  // 6. Test Chat Validation with Invalid Lens
  try {
    const badLensRes = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer demo-test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'Hello', lens: 'InvalidLens' }),
    });
    console.log('✅ Zod Validation Check (Invalid Lens):', badLensRes.status, '(Expected 400 Bad Request)');
    const errData = await badLensRes.json();
    console.log('   Error message:', errData.message);
  } catch (e) {
    console.error('❌ Zod validation test failed:', e.message);
  }

  console.log('--- Test Suite Complete ---');
}

testSuite();
