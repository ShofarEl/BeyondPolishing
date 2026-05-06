import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import Problem from '../models/Problem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearData = async () => {
  console.log('🗑️  Clearing existing synthetic data...\n');
  
  const problemsDeleted = await Problem.deleteMany({});
  const usersDeleted = await User.deleteMany({});
  
  console.log(`   Deleted ${problemsDeleted.deletedCount} problems`);
  console.log(`   Deleted ${usersDeleted.deletedCount} users\n`);
};

const main = async () => {
  try {
    await connectDB();
    await clearData();
    console.log('✅ Database cleared! Now run generateSyntheticData.js\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

main();
