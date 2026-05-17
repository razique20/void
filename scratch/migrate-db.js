const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

let envFileContent = '';
try {
  envFileContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
} catch {
  try {
    envFileContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  } catch (err) {
    console.error("Could not read .env or .env.local", err);
    process.exit(1);
  }
}

const match = envFileContent.match(/MONGODB_URI\s*=\s*(.*)/);
if (!match) {
  console.error("Could not find MONGODB_URI");
  process.exit(1);
}

const MONGODB_URI = match[1].trim().replace(/['"]/g, '');

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Update Arabic agent to Arabic
    const resArabic = await db.collection('workers').updateOne(
      { name: /Arabic agent/i },
      { $set: { language: 'Arabic' } }
    );
    console.log("Updated Arabic Agent:", resArabic.modifiedCount);

    // Update french agent to French
    const resFrench = await db.collection('workers').updateOne(
      { name: /french agent/i },
      { $set: { language: 'French' } }
    );
    console.log("Updated French Agent:", resFrench.modifiedCount);

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
