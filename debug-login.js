// Debug script to test frontend login API call
const testLogin = async () => {
  console.log('Testing frontend login API call...');
  
  const apiUrl = 'http://localhost:5001/api';
  const credentials = {
    email: 'john.doe@example.com',
    password: 'password123'
  };
  
  try {
    console.log('Making request to:', `${apiUrl}/auth/login`);
    console.log('With credentials:', credentials);
    
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
    } else {
      console.log('❌ Login failed!');
      console.log('Error:', data.message);
    }
    
  } catch (error) {
    console.log('❌ Network error!');
    console.error('Error:', error);
  }
};

// Also test with the other credentials
const testLogin2 = async () => {
  console.log('\nTesting with test@example.com...');
  
  const apiUrl = 'http://localhost:5001/api';
  const credentials = {
    email: 'test@example.com',
    password: 'Test123'
  };
  
  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed!');
    }
    
  } catch (error) {
    console.log('❌ Network error!');
    console.error('Error:', error);
  }
};

// Run both tests
testLogin().then(() => testLogin2());