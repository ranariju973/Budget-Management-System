#!/bin/bash

echo "=== Adding Sample Expenses for Analytics Demo ==="

# Login and get token
echo "Getting fresh token..."
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}')

TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token obtained: ${TOKEN:0:20}..."

# Create a budget first
echo "Creating budget..."
BUDGET_RESPONSE=$(curl -s -X POST http://localhost:5001/api/budgets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":2025,"monthNumber":1,"income":80000}')
BUDGET_ID=$(echo $BUDGET_RESPONSE | jq -r '.budget._id')
echo "Budget ID: $BUDGET_ID"

# Add sample expenses with different dates
echo "Adding sample expenses..."

# Current week expenses
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Grocery Shopping",
    "category":"Food & Dining", 
    "amount":2500,
    "date":"'$(date -v-2d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Weekly groceries"
  }' | jq -r '.message'

curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Fuel",
    "category":"Transportation",
    "amount":3000,
    "date":"'$(date -v-1d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Petrol for car"
  }' | jq -r '.message'

curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Restaurant",
    "category":"Food & Dining",
    "amount":1800,
    "date":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Dinner with friends"
  }' | jq -r '.message'

# Previous week expenses
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Electricity Bill",
    "category":"Utilities",
    "amount":4500,
    "date":"'$(date -v-7d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Monthly electricity"
  }' | jq -r '.message'

curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Online Shopping",
    "category":"Shopping",
    "amount":6200,
    "date":"'$(date -v-5d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Clothing and accessories"
  }' | jq -r '.message'

# Previous month expenses
curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Medical Checkup",
    "category":"Healthcare",
    "amount":3500,
    "date":"'$(date -v-15d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Regular health checkup"
  }' | jq -r '.message'

curl -s -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId":"'$BUDGET_ID'",
    "name":"Movie Tickets",
    "category":"Entertainment",
    "amount":800,
    "date":"'$(date -v-20d -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "notes":"Weekend movie"
  }' | jq -r '.message'

echo "Sample expenses added successfully!"
echo "Open http://localhost:5173 to view the analytics dashboard"
