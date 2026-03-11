import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Drop old participantId index if it exists
    try {
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      await usersCollection.dropIndex('participantId_1');
      console.log('✅ Dropped old participantId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ participantId_1 index does not exist');
      } else {
        console.log('⚠️ Could not drop participantId_1 index:', error.message);
      }
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('📦 MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('📦 MongoDB error:', err);
});

export default connectDB;
