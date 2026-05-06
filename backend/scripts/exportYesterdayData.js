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

async function exportYesterdayData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Set date range for April 5th, 2026
    const startDate = new Date('2026-04-05T00:00:00.000Z');
    const endDate = new Date('2026-04-05T23:59:59.999Z');

    console.log(`\nFetching data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch users created yesterday
    const users = await User.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    // Fetch problems created yesterday
    const problems = await Problem.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    console.log(`\nFound ${users.length} users and ${problems.length} problems from April 5th, 2026`);

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Export Users to CSV
    if (users.length > 0) {
      const userFile = path.join(exportsDir, 'users_2026-04-05.csv');
      const userHeaders = Object.keys(flattenObject(users[0]));
      const userRows = users.map(user => {
        const flatUser = flattenObject(user);
        return userHeaders.map(header => escapeCSV(flatUser[header])).join(',');
      });

      const userCSV = [userHeaders.join(','), ...userRows].join('\n');
      fs.writeFileSync(userFile, userCSV);
      console.log(`\n✅ Users exported to: ${userFile}`);
    } else {
      console.log('\n⚠️  No users found for April 5th, 2026');
    }

    // Export Problems to CSV
    if (problems.length > 0) {
      const problemFile = path.join(exportsDir, 'problems_2026-04-05.csv');
      const problemHeaders = Object.keys(flattenObject(problems[0]));
      const problemRows = problems.map(problem => {
        const flatProblem = flattenObject(problem);
        return problemHeaders.map(header => escapeCSV(flatProblem[header])).join(',');
      });

      const problemCSV = [problemHeaders.join(','), ...problemRows].join('\n');
      fs.writeFileSync(problemFile, problemCSV);
      console.log(`✅ Problems exported to: ${problemFile}`);
    } else {
      console.log('⚠️  No problems found for April 5th, 2026');
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
            ...interaction
          });
        });
      }
    });

    if (allInteractions.length > 0) {
      const interactionFile = path.join(exportsDir, 'interactions_2026-04-05.csv');
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
      console.log('⚠️  No interactions found for April 5th, 2026');
    }

    console.log('\n✨ Export completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Problems: ${problems.length}`);
    console.log(`- Interactions: ${allInteractions.length}`);

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the export
exportYesterdayData()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
