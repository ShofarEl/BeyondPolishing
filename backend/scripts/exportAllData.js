import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import mongoose from 'mongoose';
import fs from 'fs';

// Import models
const UserSchema = new mongoose.Schema({}, { strict: false });
const ProblemSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Problem = mongoose.model('Problem', ProblemSchema);

// Helper function to escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Helper function to flatten nested objects
function flattenObject(obj, prefix = '') {
  let result = {};
  for (let key in obj) {
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
      Object.assign(result, flattenObject(obj[key], `${prefix}${key}_`));
    } else if (Array.isArray(obj[key])) {
      result[`${prefix}${key}`] = JSON.stringify(obj[key]);
    } else {
      result[`${prefix}${key}`] = obj[key];
    }
  }
  return result;
}

async function exportAllData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully\n');

    // Fetch ALL users
    const users = await User.find({}).lean();

    // Fetch ALL problems
    const problems = await Problem.find({}).lean();

    console.log(`📊 Found ${users.length} users and ${problems.length} problems in database\n`);

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];

    // Export Users to CSV
    if (users.length > 0) {
      const userFile = path.join(exportsDir, `users_all_${timestamp}.csv`);
      const userHeaders = Object.keys(flattenObject(users[0]));
      const userRows = users.map(user => {
        const flatUser = flattenObject(user);
        return userHeaders.map(header => escapeCSV(flatUser[header])).join(',');
      });

      const userCSV = [userHeaders.join(','), ...userRows].join('\n');
      fs.writeFileSync(userFile, userCSV);
      console.log(`✅ Users exported to: ${userFile}`);
      console.log(`   Total users: ${users.length}`);
      
      // Show date range of users
      const userDates = users.map(u => new Date(u.createdAt)).sort((a, b) => a - b);
      if (userDates.length > 0) {
        console.log(`   Date range: ${userDates[0].toISOString()} to ${userDates[userDates.length - 1].toISOString()}`);
      }
    } else {
      console.log('⚠️  No users found in database');
    }

    // Export Problems to CSV
    if (problems.length > 0) {
      const problemFile = path.join(exportsDir, `problems_all_${timestamp}.csv`);
      const problemHeaders = Object.keys(flattenObject(problems[0]));
      const problemRows = problems.map(problem => {
        const flatProblem = flattenObject(problem);
        return problemHeaders.map(header => escapeCSV(flatProblem[header])).join(',');
      });

      const problemCSV = [problemHeaders.join(','), ...problemRows].join('\n');
      fs.writeFileSync(problemFile, problemCSV);
      console.log(`\n✅ Problems exported to: ${problemFile}`);
      console.log(`   Total problems: ${problems.length}`);
      
      // Show date range of problems
      const problemDates = problems.map(p => new Date(p.createdAt)).sort((a, b) => a - b);
      if (problemDates.length > 0) {
        console.log(`   Date range: ${problemDates[0].toISOString()} to ${problemDates[problemDates.length - 1].toISOString()}`);
      }
    } else {
      console.log('\n⚠️  No problems found in database');
    }

    // Export Interactions (from problems) to separate CSV
    const allInteractions = [];
    problems.forEach(problem => {
      if (problem.interactions && Array.isArray(problem.interactions)) {
        problem.interactions.forEach(interaction => {
          allInteractions.push({
            problemId: problem.problemId,
            userId: problem.userId,
            taskCategory: problem.taskCategory,
            problemStatus: problem.status,
            problemCreatedAt: problem.createdAt,
            ...interaction
          });
        });
      }
    });

    if (allInteractions.length > 0) {
      const interactionFile = path.join(exportsDir, `interactions_all_${timestamp}.csv`);
      const interactionHeaders = Object.keys(flattenObject(allInteractions[0]));
      const interactionRows = allInteractions.map(interaction => {
        const flatInteraction = flattenObject(interaction);
        return interactionHeaders.map(header => escapeCSV(flatInteraction[header])).join(',');
      });

      const interactionCSV = [interactionHeaders.join(','), ...interactionRows].join('\n');
      fs.writeFileSync(interactionFile, interactionCSV);
      console.log(`\n✅ Interactions exported to: ${interactionFile}`);
      console.log(`   Total interactions: ${allInteractions.length}`);
    } else {
      console.log('\n⚠️  No interactions found in database');
    }

    // Export study statistics
    const stats = {
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      totalProblems: problems.length,
      totalInteractions: allInteractions.length,
      completedProblems: problems.filter(p => p.status === 'completed').length,
      inProgressProblems: problems.filter(p => p.status === 'in-progress').length,
      abandonedProblems: problems.filter(p => p.status === 'abandoned').length,
      editorInteractions: allInteractions.filter(i => i.promptType === 'editor').length,
      challengerInteractions: allInteractions.filter(i => i.promptType === 'challenger').length,
      infrastructureProblems: problems.filter(p => p.taskCategory === 'infrastructure').length,
    };

    const statsFile = path.join(exportsDir, `statistics_all_${timestamp}.json`);
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(`\n✅ Statistics exported to: ${statsFile}`);

    console.log('\n✨ Export completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Problems: ${problems.length}`);
    console.log(`     - Completed: ${stats.completedProblems}`);
    console.log(`     - In Progress: ${stats.inProgressProblems}`);
    console.log(`     - Abandoned: ${stats.abandonedProblems}`);
    console.log(`     - Infrastructure: ${stats.infrastructureProblems}`);
    console.log(`   Interactions: ${allInteractions.length}`);
    console.log(`     - Editor: ${stats.editorInteractions}`);
    console.log(`     - Challenger: ${stats.challengerInteractions}`);

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the export
exportAllData()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
