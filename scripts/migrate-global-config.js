/**
 * One-off migration: upgrade legacy GlobalConfig docs.
 *
 * Old seed created the doc with every flag false (smartBooking, knowledgeSharing,
 * naturalLanguageAnalytics, sheetsIntegration, ...). Those flags are kill
 * switches for shipped features, so all-false silently locked Intelligence
 * features for every plan once the Enterprise bypass was removed.
 *
 * This flips the shipped-feature kill switches ON and stamps schemaVersion: 1.
 * Deliberately-enabled opt-ins (emailHub, leadManagement, actionAgents, ...)
 * keep their stored value.
 *
 * Run: node scripts/migrate-global-config.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const KILL_SWITCHES = [
  'smartBooking',
  'autonomousGoals',
  'knowledgeSharing',
  'conversationBranching',
  'naturalLanguageAnalytics',
  'sheetsIntegration',
];

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const col = db.collection('globalconfigs');

  const doc = await col.findOne({});
  if (!doc) {
    console.log('No GlobalConfig doc found — nothing to migrate. It will be created with correct defaults on first use.');
    await mongoose.disconnect();
    return;
  }

  if (doc.schemaVersion === 1) {
    console.log('GlobalConfig already at schemaVersion 1 — nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const ff = { ...(doc.featureFlags || {}) };
  for (const k of KILL_SWITCHES) ff[k] = true;

  await col.updateOne({ _id: doc._id }, { $set: { featureFlags: ff, schemaVersion: 1 } });
  console.log('✓ Migrated GlobalConfig:', KILL_SWITCHES.map(k => `${k}=true`).join(', '));

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
