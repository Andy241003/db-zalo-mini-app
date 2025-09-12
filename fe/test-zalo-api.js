// Test Zalo API trực tiếp từ browser console
// Paste đoạn code này vào Console của Chrome DevTools

async function testZaloAPI() {
  const apiUrl = 'http://localhost:8000/api/v1/zalo';
  
  // Test endpoint GET /test
  console.log('🧪 Testing GET /api/v1/zalo/test...');
  try {
    const testResponse = await fetch(`${apiUrl}/test`);
    const testData = await testResponse.json();
    console.log('✅ GET /test Success:', testData);
  } catch (error) {
    console.error('❌ GET /test Error:', error);
  }

  // Test endpoint POST /phone
  console.log('📱 Testing POST /api/v1/zalo/phone...');
  try {
    const phoneResponse = await fetch(`${apiUrl}/phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'test_token_from_zalo_miniapp',
        access_token: 'test_access_token_from_zalo_miniapp'
      })
    });

    if (phoneResponse.ok) {
      const phoneData = await phoneResponse.json();
      console.log('✅ POST /phone Success:', phoneData);
    } else {
      const errorData = await phoneResponse.text();
      console.log('⚠️ POST /phone HTTP Error:', phoneResponse.status, errorData);
    }
  } catch (error) {
    console.error('❌ POST /phone Network Error:', error);
  }
}

// Chạy test
testZaloAPI();
