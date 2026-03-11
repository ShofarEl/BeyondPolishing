import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const dropOldIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('Checking existing indexes...');
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    // Drop the old participantId index if it exists
    try {
      await usersCollection.dropIndex('participantId_1');
      console.log('✅ Dropped participantId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ participantId_1 index does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    console.log('Final indexes:', (await usersCollection.indexes()).map(i => i.name));
    console.log('✅ Migration complete');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

dropOldIndexes();
