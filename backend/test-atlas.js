const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB Atlas connection...');
console.log('Connection URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
})
.then(async () => {
  console.log('✅ Successfully connected to MongoDB Atlas!');
  
  // Test basic operations
  const db = mongoose.connection.db;
  
  console.log('\n📊 Database Stats:');
  const collections = await db.listCollections().toArray();
  console.log('Collections found:', collections.map(c => c.name));
  
  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    console.log(`  ${collection.name}: ${count} documents`);
  }
  
  console.log('\n🎉 MongoDB Atlas is working perfectly!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB Atlas connection failed:', error.message);
  process.exit(1);
});