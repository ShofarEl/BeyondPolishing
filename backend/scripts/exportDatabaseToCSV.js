

import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Loading environment variables...');
dotenv.config({ path: join(__dirname, '../.env') });

// Define schemas inline
const userSchema = new mongoose.Schema({
  sessionId: String,
  studyGroup: String,
  consentGiven: Boolean,
  consentTimestamp: Date,
  demographicData: {
    academicLevel: String,
    dataScienceExperience: String
  },
  sessions: Array,
  isActive: Boolean,
  lastActive: Date
}, { timestamps: true });

const problemSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  problemId: String,
  taskPrompt: String,
  taskCategory: String,
  initialProblem: String,
  finalProblem: String,
  reasoning: String,
  status: String,
  startTime: Date,
  endTime: Date,
  totalTimeSpent: Number,
  interactions: Array,
  isProcessed: Boolean,
  needsReview: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Problem = mongoose.model('Problem', problemSchema);

// Get date from command line or use April 5, 2026
const targetDate = process.argv[2] || '2026-04-05';
const START_OF_DAY = new Date(`${targetDate}T00:00:00.000Z`);
const END_OF_DAY = new Date(`${targetDate}T23:59:59.999Z`);

function objectToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

async function exportData() {
  console.log('Starting export process...');
  console.log(`Target date: ${targetDate}`);
  
  try {
    console.log('\nConnecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Found in .env' : 'NOT FOUND');
    
    // Connect to test database
    const uri = process.env.MONGODB_URI.replace(/\/[^\/]*(\?|$)/, '/test$1');
    console.log('Using database: test');
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected successfully!');

    console.log(`\nQuerying data for ${targetDate}`);
    console.log(`Start: ${START_OF_DAY.toISOString()}`);
    console.log(`End: ${END_OF_DAY.toISOString()}`);

    // Fetch users
    console.log('\nFetching users...');
    const users = await User.find({
      createdAt: { $gte: START_OF_DAY, $lte: END_OF_DAY }
    }).lean();
    console.log(`Found ${users.length} users`);

    // Fetch problems
    console.log('Fetching problems...');
    const problems = await Problem.find({
      createdAt: { $gte: START_OF_DAY, $lte: END_OF_DAY }
    }).lean();
    console.log(`Found ${problems.length} problems`);

    // If no data found, check total records
    if (users.length === 0 && problems.length === 0) {
      console.log('\n⚠️  No data found for this date. Checking total records...');
      const totalUsers = await User.countDocuments();
      const totalProblems = await Problem.countDocuments();
      console.log(`Total users in database: ${totalUsers}`);
      console.log(`Total problems in database: ${totalProblems}`);
      
      if (totalUsers > 0 || totalProblems > 0) {
        console.log('\n💡 Tip: Run with a different date or check the latest entries:');
        const latestUser = await User.findOne().sort({ createdAt: -1 });
        const latestProblem = await Problem.findOne().sort({ createdAt: -1 });
        if (latestUser) console.log(`   Latest user created: ${latestUser.createdAt}`);
        if (latestProblem) console.log(`   Latest problem created: ${latestProblem.createdAt}`);
      }
    }

    // Prepare users data
    const usersData = users.map(u => ({
      id: u._id.toString(),
      sessionId: u.sessionId || '',
      studyGroup: u.studyGroup || '',
      consentGiven: u.consentGiven || false,
      consentTimestamp: u.consentTimestamp || '',
      academicLevel: u.demographicData?.academicLevel || '',
      dataScienceExperience: u.demographicData?.dataScienceExperience || '',
      isActive: u.isActive || false,
      lastActive: u.lastActive || '',
      totalSessions: u.sessions?.length || 0,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    // Prepare problems data
    const problemsData = problems.map(p => ({
      id: p._id.toString(),
      problemId: p.problemId || '',
      userId: p.userId?.toString() || '',
      taskPrompt: p.taskPrompt || '',
      taskCategory: p.taskCategory || '',
      initialProblem: p.initialProblem || '',
      finalProblem: p.finalProblem || '',
      reasoning: p.reasoning || '',
      status: p.status || '',
      startTime: p.startTime || '',
      endTime: p.endTime || '',
      totalTimeSpent: p.totalTimeSpent || 0,
      interactionCount: p.interactions?.length || 0,
      isProcessed: p.isProcessed || false,
      needsReview: p.needsReview || false,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    // Prepare interactions data
    const interactionsData = [];
    problems.forEach(p => {
      if (p.interactions && p.interactions.length > 0) {
        p.interactions.forEach(i => {
          interactionsData.push({
            problemId: p.problemId || '',
            interactionId: i.interactionId || '',
            timestamp: i.timestamp || '',
            promptType: i.promptType || '',
            userInput: i.userInput || '',
            aiResponse: i.aiResponse || '',
            usefulness: i.userRating?.usefulness || '',
            cognitiveLoad: i.userRating?.cognitiveLoad || '',
            satisfaction: i.userRating?.satisfaction || '',
            userFeedback: i.userFeedback || '',
            wasAccepted: i.wasAccepted || false,
            timeSpent: i.timeSpent || 0
          });
        });
      }
    });

    console.log(`Found ${interactionsData.length} interactions`);

    // Create exports directory
    const exportsDir = join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      console.log('\nCreating exports directory...');
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Write files
    const fileDate = targetDate;
    let filesCreated = 0;
    
    if (usersData.length > 0) {
      const csv = objectToCSV(usersData);
      const filePath = join(exportsDir, `users_${fileDate}.csv`);
      fs.writeFileSync(filePath, csv);
      console.log(`\n✅ Users exported: ${filePath}`);
      filesCreated++;
    } else {
      console.log('\n⚠️  No users to export');
    }

    if (problemsData.length > 0) {
      const csv = objectToCSV(problemsData);
      const filePath = join(exportsDir, `problems_${fileDate}.csv`);
      fs.writeFileSync(filePath, csv);
      console.log(`✅ Problems exported: ${filePath}`);
      filesCreated++;
    } else {
      console.log('⚠️  No problems to export');
    }

    if (interactionsData.length > 0) {
      const csv = objectToCSV(interactionsData);
      const filePath = join(exportsDir, `interactions_${fileDate}.csv`);
      fs.writeFileSync(filePath, csv);
      console.log(`✅ Interactions exported: ${filePath}`);
      filesCreated++;
    } else {
      console.log('⚠️  No interactions to export');
    }

    if (filesCreated > 0) {
      console.log(`\n🎉 Export completed! ${filesCreated} file(s) created in ${exportsDir}`);
    } else {
      console.log('\n⚠️  No data exported. Try a different date.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('\n💡 Connection failed. Please check:');
      console.error('   1. Your internet connection');
      console.error('   2. MongoDB Atlas cluster is running');
      console.error('   3. IP address is whitelisted in MongoDB Atlas');
      console.error('   4. MONGODB_URI in .env file is correct');
    }
    console.error('\nFull error:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

console.log('Usage: node exportDatabaseToCSV.js [YYYY-MM-DD]');
console.log('Example: node exportDatabaseToCSV.js 2026-04-05\n');

exportData();
