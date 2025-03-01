// Simple test script to verify API connectivity

async function testApiConnection() {
  const API_BASE_URL = 'http://localhost:3000/api/chatbot';
  
  console.log('Testing API connection...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3000/health');
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test initialize endpoint
    console.log('Testing initialize endpoint...');
    const initResponse = await fetch(`${API_BASE_URL}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ character: 'eric' }),
    });
    
    if (!initResponse.ok) {
      throw new Error(`Initialize failed: ${initResponse.status}`);
    }
    
    const initData = await initResponse.json();
    console.log('Initialize response:', initData);
    
    const sessionId = initData.sessionId;
    
    // Test message endpoint
    console.log('Testing message endpoint...');
    const messageResponse = await fetch(`${API_BASE_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '1', // Select chat mode
        sessionId,
      }),
    });
    
    if (!messageResponse.ok) {
      throw new Error(`Message failed: ${messageResponse.status}`);
    }
    
    const messageData = await messageResponse.json();
    console.log('Message response:', messageData);
    
    // Test another message
    console.log('Testing another message...');
    const message2Response = await fetch(`${API_BASE_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, how are you?',
        sessionId,
      }),
    });
    
    if (!message2Response.ok) {
      throw new Error(`Second message failed: ${message2Response.status}`);
    }
    
    const message2Data = await message2Response.json();
    console.log('Second message response:', message2Data);
    
    // Test reset endpoint
    console.log('Testing reset endpoint...');
    const resetResponse = await fetch(`${API_BASE_URL}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
      }),
    });
    
    if (!resetResponse.ok) {
      throw new Error(`Reset failed: ${resetResponse.status}`);
    }
    
    const resetData = await resetResponse.json();
    console.log('Reset response:', resetData);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('API test failed:', error);
  }
}

// Run the test
testApiConnection(); 