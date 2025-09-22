#!/bin/bash

# Deployment Helper Script for Budget Management App

echo "🚀 Budget Management App - Deployment Helper"
echo "=============================================="

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "📋 Pre-deployment checklist:"
echo ""

# Check for required files
echo "✅ Checking project structure..."
if [ -f "backend/package.json" ] && [ -f "frontend/package.json" ]; then
    echo "   ✓ Package.json files found"
else
    echo "   ❌ Missing package.json files"
    exit 1
fi

if [ -f "backend/.env.example" ] && [ -f "frontend/.env.example" ]; then
    echo "   ✓ Environment examples found"
else
    echo "   ❌ Missing .env.example files"
fi

echo ""
echo "🔧 Testing local builds..."

# Test backend
echo "   Testing backend..."
cd backend
if npm install > /dev/null 2>&1; then
    echo "   ✓ Backend dependencies installed"
else
    echo "   ❌ Backend dependency installation failed"
    exit 1
fi

# Test frontend build
echo "   Testing frontend build..."
cd ../frontend
if npm install > /dev/null 2>&1; then
    echo "   ✓ Frontend dependencies installed"
else
    echo "   ❌ Frontend dependency installation failed"
    exit 1
fi

if npm run build > /dev/null 2>&1; then
    echo "   ✓ Frontend build successful"
else
    echo "   ❌ Frontend build failed"
    exit 1
fi

cd ..

echo ""
echo "🎉 Pre-deployment checks passed!"
echo ""
echo "📝 Next steps:"
echo "1. Set up MongoDB Atlas: https://www.mongodb.com/atlas/database"
echo "2. Deploy backend to Railway: https://railway.app/"
echo "3. Deploy frontend to Vercel: https://vercel.com/"
echo "4. See DEPLOYMENT.md for detailed instructions"
echo ""
echo "💡 Quick links:"
echo "   • MongoDB Atlas: https://www.mongodb.com/atlas/database"
echo "   • Railway: https://railway.app/"
echo "   • Vercel: https://vercel.com/"