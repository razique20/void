require('dotenv').config();
const mongoose = require('mongoose');

// Simple script to grant admin access
async function setupAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const UserSchema = new mongoose.Schema({ clerkId: String, isAdmin: Boolean });
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // You can specify an email or Clerk ID here
  // For safety, we will make ALL existing users admins for this dev environment, 
  // or you can pass a specific ID.
  const result = await User.updateMany({}, { $set: { isAdmin: true } });
  
  console.log(`Updated ${result.modifiedCount} users to Admin status.`);
  
  await mongoose.disconnect();
  console.log('Done.');
}

setupAdmin().catch(console.error);
