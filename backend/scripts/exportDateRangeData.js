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

async function exportDateRangeData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Set date range from April 5th to May 3rd, 2026
    const startDate = new Date('2026-04-05T00:00:00.000Z');
    const endDate = new Date('2026-05-03T23:59:59.999Z');

    console.log(`\n📅 Fetching data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`   (April 5th, 2026 to May 3rd, 2026)\n`);

    // Fetch users created in date range
    const users = await User.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    // Fetch problems created in date range
    const problems = await Problem.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    console.log(`Found ${users.length} users and ${problems.length} problems`);

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const dateRangeLabel = 'april5-may3-2026';

    // Export Users to CSV
    if (users.length > 0) {
      const userFile = path.join(exportsDir, `users_${dateRangeLabel}.csv`);
      const userHeaders = Object.keys(flattenObject(users[0]));
      const userRows = users.map(user => {
        const flatUser = flattenObject(user);
        return userHeaders.map(header => escapeCSV(flatUser[header])).join(',');
      });

      const userCSV = [userHeaders.join(','), ...userRows].join('\n');
      fs.writeFileSync(userFile, userCSV);
      console.log(`\n✅ Users exported to: ${userFile}`);
      console.log(`   Total users: ${users.length}`);
    } else {
      console.log('\n⚠️  No users found in date range');
    }

    // Export Problems to CSV
    if (problems.length > 0) {
      const problemFile = path.join(exportsDir, `problems_${dateRangeLabel}.csv`);
      const problemHeaders = Object.keys(flattenObject(problems[0]));
      const problemRows = problems.map(problem => {
        const flatProblem = flattenObject(problem);
        return problemHeaders.map(header => escapeCSV(flatProblem[header])).join(',');
      });

      const problemCSV = [problemHeaders.join(','), ...problemRows].join('\n');
      fs.writeFileSync(problemFile, problemCSV);
      console.log(`✅ Problems exported to: ${problemFile}`);
      console.log(`   Total problems: ${problems.length}`);
    } else {
      console.log('⚠️  No problems found in date range');
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
            ...interaction
          });
        });
      }
    });

    if (allInteractions.length > 0) {
      const interactionFile = path.join(exportsDir, `interactions_${dateRangeLabel}.csv`);
      const interactionHeaders = Object.keys(flattenObject(allInteractions[0]));
      const interactionRows = allInteractions.map(interaction => {
        const flatInteraction = flattenObject(interaction);
        return interactionHeaders.map(header => escapeCSV(flatInteraction[header])).join(',');
      });

      const interactionCSV = [interactionHeaders.join(','), ...interactionRows].join('\n');
      fs.writeFileSync(interactionFile, interactionCSV);
      console.log(`✅ Interactions exported to: ${interactionFile}`);
      console.log(`   Total interactions: ${allInteractions.length}`);
    } else {
      console.log('⚠️  No interactions found in date range');
    }

    // Export study statistics
    const stats = {
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      totalUsers: users.length,
      totalProblems: problems.length,
      totalInteractions: allInteractions.length,
      completedProblems: problems.filter(p => p.status === 'completed').length,
      inProgressProblems: problems.filter(p => p.status === 'in-progress').length,
      abandonedProblems: problems.filter(p => p.status === 'abandoned').length,
      editorInteractions: allInteractions.filter(i => i.promptType === 'editor').length,
      challengerInteractions: allInteractions.filter(i => i.promptType === 'challenger').length,
    };

    const statsFile = path.join(exportsDir, `statistics_${dateRangeLabel}.json`);
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(`✅ Statistics exported to: ${statsFile}`);

    console.log('\n✨ Export completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Date Range: April 5th - May 3rd, 2026`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Problems: ${problems.length}`);
    console.log(`     - Completed: ${stats.completedProblems}`);
    console.log(`     - In Progress: ${stats.inProgressProblems}`);
    console.log(`     - Abandoned: ${stats.abandonedProblems}`);
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
exportDateRangeData()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
