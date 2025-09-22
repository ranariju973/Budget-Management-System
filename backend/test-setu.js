#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Mock token - you'll need to replace this with a real JWT token from login
const mockToken = 'your-jwt-token-here';

async function testSetuEndpoints() {
  console.log('🧪 Testing Setu API Integration...\n');

  // Test 1: Check Setu connection status (without auth)
  try {
    console.log('1. Testing connection status endpoint...');
    const response = await axios.get(`${BASE_URL}/setu/connection-status`, {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Connection status endpoint working');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Connection status test failed:', error.response?.data || error.message);
  }

  // Test 2: Create Setu authorization link
  try {
    console.log('\n2. Testing create link endpoint...');
    const response = await axios.get(`${BASE_URL}/setu/create-link`, {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Create link endpoint working');
    console.log('   Link created:', response.data.link_url ? 'Yes' : 'No');
  } catch (error) {
    console.log('❌ Create link test failed:', error.response?.data || error.message);
  }

  // Test 3: Verify environment variables are loaded
  console.log('\n3. Checking environment variables...');
  console.log('   SETU_CLIENT_ID:', process.env.SETU_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('   SETU_CLIENT_SECRET:', process.env.SETU_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   SETU_AUTH_URL:', process.env.SETU_AUTH_URL ? '✅ Set' : '❌ Missing');

  console.log('\n🎉 Setu API integration test completed!');
  console.log('\nNotes:');
  console.log('- To fully test, you need a valid JWT token from user login');
  console.log('- The Setu OAuth flow will require browser interaction');
  console.log('- Backend is ready for Indian bank connectivity');
}

// Load environment variables
require('dotenv').config();

testSetuEndpoints().catch(console.error);