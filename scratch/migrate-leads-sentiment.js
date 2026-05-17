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
    
    // Set default sentiment to 'warm' for any lead that does not have it set
    const res = await db.collection('leads').updateMany(
      { sentiment: { $exists: false } },
      { $set: { sentiment: 'warm' } }
    );
    console.log(`Initialized sentiment on ${res.modifiedCount} existing leads.`);

    // Perform an intelligent keyword scoring pass on existing leads
    const leads = await db.collection('leads').find({}).toArray();
    for (const lead of leads) {
      const interestStr = (lead.interest || '').toLowerCase();
      let sentiment = lead.sentiment || 'warm';

      if (interestStr.includes('buy') || 
          interestStr.includes('price') || 
          interestStr.includes('pricing') || 
          interestStr.includes('cost') ||
          interestStr.includes('quote') || 
          interestStr.includes('book') || 
          interestStr.includes('schedule') || 
          interestStr.includes('meeting') ||
          interestStr.includes('demo') ||
          interestStr.includes('ready to sign')) {
        sentiment = 'hot';
      } else if (interestStr.includes('test') || 
                 interestStr.includes('junk') || 
                 interestStr.includes('spam') ||
                 interestStr.includes('complaint') || 
                 interestStr.includes('angry')) {
        sentiment = 'cold';
      }

      if (sentiment !== lead.sentiment) {
        await db.collection('leads').updateOne(
          { _id: lead._id },
          { $set: { sentiment } }
        );
        console.log(`Updated existing lead "${lead.contactInfo?.name}" to: ${sentiment.toUpperCase()}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
