#!/bin/bash

# MongoDB Data Migration Script
# Exports data from local MongoDB and imports to MongoDB Atlas

echo "🔄 MongoDB Data Migration to Atlas"
echo "=================================="

# Local MongoDB connection
LOCAL_DB="mongodb://localhost:27017/budget_management"

# Atlas MongoDB connection  
ATLAS_DB="mongodb+srv://rijurana:vF8R07GI30jc0THe@cluster0.ttituq0.mongodb.net/budget_management"

# Create temporary directory for exports
TEMP_DIR="./mongodb_export_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"

echo "📤 Exporting data from local MongoDB..."

# Export all collections
echo "   Exporting users collection..."
mongodump --uri="$LOCAL_DB" --collection=users --out="$TEMP_DIR" 2>/dev/null

echo "   Exporting expenses collection..."
mongodump --uri="$LOCAL_DB" --collection=expenses --out="$TEMP_DIR" 2>/dev/null

echo "   Exporting budgets collection..."  
mongodump --uri="$LOCAL_DB" --collection=budgets --out="$TEMP_DIR" 2>/dev/null

echo "   Exporting borrowings collection..."
mongodump --uri="$LOCAL_DB" --collection=borrowings --out="$TEMP_DIR" 2>/dev/null

echo "   Exporting income collection..."
mongodump --uri="$LOCAL_DB" --collection=income --out="$TEMP_DIR" 2>/dev/null

echo ""
echo "📥 Importing data to MongoDB Atlas..."

# Import all collections to Atlas
echo "   Importing users collection..."
mongorestore --uri="$ATLAS_DB" --collection=users "$TEMP_DIR/budget_management/users.bson" --drop 2>/dev/null

echo "   Importing expenses collection..."
mongorestore --uri="$ATLAS_DB" --collection=expenses "$TEMP_DIR/budget_management/expenses.bson" --drop 2>/dev/null

echo "   Importing budgets collection..."
mongorestore --uri="$ATLAS_DB" --collection=budgets "$TEMP_DIR/budget_management/budgets.bson" --drop 2>/dev/null

echo "   Importing borrowings collection..."
mongorestore --uri="$ATLAS_DB" --collection=borrowings "$TEMP_DIR/budget_management/borrowings.bson" --drop 2>/dev/null

echo "   Importing income collection..."
mongorestore --uri="$ATLAS_DB" --collection=income "$TEMP_DIR/budget_management/income.bson" --drop 2>/dev/null

echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Data migration completed!"
echo ""
echo "🔍 Verifying data in Atlas..."

# Test Atlas connection
if mongosh "$ATLAS_DB" --eval "db.users.countDocuments()" --quiet 2>/dev/null; then
    echo "   ✓ Successfully connected to MongoDB Atlas"
    echo "   ✓ Users count: $(mongosh "$ATLAS_DB" --eval "print(db.users.countDocuments())" --quiet 2>/dev/null)"
    echo "   ✓ Expenses count: $(mongosh "$ATLAS_DB" --eval "print(db.expenses.countDocuments())" --quiet 2>/dev/null)"
    echo "   ✓ Budgets count: $(mongosh "$ATLAS_DB" --eval "print(db.budgets.countDocuments())" --quiet 2>/dev/null)"
else
    echo "   ❌ Could not verify Atlas connection"
fi

echo ""
echo "🎉 Migration complete! Your app is now using MongoDB Atlas."