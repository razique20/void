const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read MONGODB_URI from .env.local or .env
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
  console.error("Could not find MONGODB_URI in env files");
  process.exit(1);
}

const MONGODB_URI = match[1].trim().replace(/['"]/g, '');

async function run() {
  console.log("Connecting to MONGODB_URI:", MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const workers = await db.collection('workers').find({}).toArray();
    console.log("ALL WORKERS IN DB:");
    workers.forEach(w => {
      console.log(`- ID: ${w._id}, Name: ${w.name}, Language: ${w.language}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
