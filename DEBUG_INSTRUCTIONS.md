# Frontend Debug Instructions

## Quick Browser Console Test

1. Open https://budget-management-system-frontend.onrender.com in your browser
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to the Console tab
4. Copy and paste this code:

```javascript
// Test API Health
async function testAuth() {
    const API_BASE = 'https://budget-management-system-wd3i.onrender.com/api';
    
    console.log('🔍 Testing API Health...');
    try {
        const healthResponse = await fetch(`${API_BASE}/health`, {
            credentials: 'include'
        });
        const healthData = await healthResponse.text();
        console.log('✅ Health Check:', healthResponse.status, healthData);
    } catch (error) {
        console.error('❌ Health Check Failed:', error);
    }
    
    console.log('🔍 Testing Registration...');
    try {
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Debug Test User',
                email: 'debug@test.com',
                password: 'Password123'
            })
        });
        const registerData = await registerResponse.json();
        console.log('📝 Register Response:', registerResponse.status, registerData);
        
        // If registration fails because user exists, try login
        if (registerResponse.status === 400) {
            console.log('🔍 User exists, testing login...');
            const loginResponse = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'debug@test.com',
                    password: 'Password123'
                })
            });
            const loginData = await loginResponse.json();
            console.log('🔑 Login Response:', loginResponse.status, loginData);
        }
    } catch (error) {
        console.error('❌ Auth Test Failed:', error);
    }
    
    console.log('📋 Checking cookies...');
    console.log('Cookies:', document.cookie);
}

// Run the test
testAuth();
```

## Using the Debug HTML File

1. Open the file `frontend-debug-test.html` in your browser
2. Use the test buttons to check each functionality
3. Look for detailed response information

## Common Issues to Check

1. **Network Tab in DevTools**: Look for failed requests
2. **Console Errors**: Check for JavaScript errors
3. **CORS Issues**: Look for CORS-related error messages
4. **Cookie Setting**: Check if cookies are being set properly

## Expected Behavior

- Health check should return: `{"message":"Budget Management API is running!"}`
- Registration should either succeed or fail with "User already exists"
- Login should succeed with proper credentials
- Cookies should be visible in the browser

## Password Requirements

Remember: Password must have:
- At least 6 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number

Example valid password: `Password123`