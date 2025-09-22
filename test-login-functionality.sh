#!/bin/bash

echo "Testing login functionality..."
echo "================================"

# Test 1: Backend API Health
echo "1. Testing backend health..."
curl -s http://localhost:5001/api/health
echo -e "\n"

# Test 2: Demo User Login (Backend)
echo "2. Testing demo user login (Backend API)..."
response=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }')
echo $response
echo -e "\n"

# Test 3: Frontend API endpoint
echo "3. Testing frontend to backend connectivity..."
curl -s http://localhost:5173
echo -e "\n"

# Test 4: Check for CORS issues
echo "4. Testing CORS..."
curl -s -X OPTIONS http://localhost:5001/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
echo -e "\n"

echo "Test completed!"