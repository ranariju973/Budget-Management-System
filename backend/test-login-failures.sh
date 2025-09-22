#!/usr/bin/env bash

echo "🔐 Testing Login Failure Scenarios"
echo "=================================="

BASE_URL="http://localhost:5001/api/auth"

echo -e "\n1. Testing with wrong password:"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"WrongPassword123"}' | jq '.'

echo -e "\n2. Testing with non-existent email:"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"Test123456"}' | jq '.'

echo -e "\n3. Testing with empty email:"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":"Test123456"}' | jq '.'

echo -e "\n4. Testing with empty password:"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":""}' | jq '.'

echo -e "\n5. Testing with invalid email format:"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email-format","password":"Test123456"}' | jq '.'

echo -e "\n6. Testing with missing email field:"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"Test123456"}' | jq '.'

echo -e "\n7. Testing with missing password field:"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | jq '.'

echo -e "\n8. Testing with malformed JSON:"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"' | jq '.' 2>/dev/null || echo "JSON parsing failed as expected"

echo -e "\n9. Testing with no Content-Type header:"
curl -s -X POST "$BASE_URL/login" \
  -d '{"email":"test@example.com","password":"Test123456"}' | jq '.'

echo -e "\n10. Testing successful login (for comparison):"
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}' | jq '.'

echo -e "\n✅ Login failure testing completed!"