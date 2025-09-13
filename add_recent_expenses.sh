#!/bin/bash

echo "=== Adding More Sample Expenses for Analytics Testing ==="

# Login and get token
echo "Getting fresh token..."
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}')

TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token obtained: ${TOKEN:0:20}..."

# Get existing budget ID
BUDGET_RESPONSE=$(curl -s -X GET http://localhost:5001/api/budgets \
  -H "Authorization: Bearer $TOKEN")
BUDGET_ID=$(echo $BUDGET_RESPONSE | jq -r '.budgets[0]._id')
echo "Using existing budget ID: $BUDGET_ID"

# Add expenses across different dates for analytics testing
echo "Adding recent expenses for analytics..."

# Today's expenses
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Coffee Shop",
    "category":"Food & Dining", 
    "amount":450,
    "date":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Morning coffee"
  }' | jq -r '.message'

# Yesterday's expenses
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Lunch",
    "category":"Food & Dining",
    "amount":850,
    "date":"'$(date -v-1d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Office lunch"
  }' | jq -r '.message'

# 3 days ago
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Bus Fare",
    "category":"Transportation",
    "amount":120,
    "date":"'$(date -v-3d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Daily commute"
  }' | jq -r '.message'

# 5 days ago
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Pharmacy",
    "category":"Healthcare",
    "amount":680,
    "date":"'$(date -v-5d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Medicine purchase"
  }' | jq -r '.message'

# 7 days ago
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Movie Tickets",
    "category":"Entertainment",
    "amount":1200,
    "date":"'$(date -v-7d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Weekend entertainment"
  }' | jq -r '.message'

# 10 days ago
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Clothing",
    "category":"Shopping",
    "amount":3200,
    "date":"'$(date -v-10d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"New shirt"
  }' | jq -r '.message'

# 2 weeks ago
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Gym Membership",
    "category":"Sports & Fitness",
    "amount":2500,
    "date":"'$(date -v-14d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Monthly gym fee"
  }' | jq -r '.message'

echo "Additional sample expenses added successfully!"
echo "Open http://localhost:5174 to view the updated analytics dashboard"
