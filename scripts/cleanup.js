const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function cleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);
  
  const db = mongoose.connection.db;

  const collectionsToClear = [
    'systemlogs',
    'leads',
    'ratelimits'
  ];

  console.log('\n--- VOID DATABASE CLEANUP ---');
  
  for (const collectionName of collectionsToClear) {
    try {
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`✓ Cleared ${collectionName}: ${result.deletedCount} items removed.`);
    } catch (err) {
      console.log(`✗ Error clearing ${collectionName}: ${err.message}`);
    }
  }

  // Optional: Add more if needed (e.g. 'conversations')
  // const conversationsResult = await db.collection('conversations').deleteMany({});
  // console.log(`✓ Cleared conversations: ${conversationsResult.deletedCount} items removed.`);

  console.log('\nCleanup complete.');
  process.exit(0);
}

cleanup();
