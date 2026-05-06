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

// Helper to calculate word count
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

async function exportResearchData() {
  try {
    console.log('🔬 Beyond Polishing - Research Data Export');
    console.log('==========================================\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Set date range from April 5th to May 3rd, 2026
    const startDate = new Date('2026-04-05T00:00:00.000Z');
    const endDate = new Date('2026-05-03T23:59:59.999Z');

    console.log(`📅 Date Range: April 5th - May 3rd, 2026`);
    console.log(`   From: ${startDate.toISOString()}`);
    console.log(`   To:   ${endDate.toISOString()}\n`);

    // Fetch users
    const users = await User.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    // Fetch problems
    const problems = await Problem.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    console.log(`📊 Data Found:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Problems: ${problems.length}\n`);

    // Create exports directory
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];

    // ============================================
    // COMBINED RESEARCH DATA CSV
    // ============================================
    
    const combinedData = [];
    
    problems.forEach(problem => {
      const user = users.find(u => u._id?.toString() === problem.userId?.toString() || u.id?.toString() === problem.userId?.toString());
      
      // Base problem data
      const baseData = {
        // Participant Info
        participantId: user?.participantId || user?.sessionId || user?.id || '',
        username: user?.username || user?.sessionId || '',
        studyGroup: user?.studyGroup || '',
        academicLevel: user?.academicLevel || '',
        dataScienceExperience: user?.dataScienceExperience || '',
        consentGiven: user?.consentGiven || '',
        
        // Problem Info
        problemId: problem.problemId || problem.id || '',
        taskCategory: problem.taskCategory || '',
        status: problem.status || '',
        
        // Problem Statements
        initialProblem: problem.initialProblem || '',
        finalProblem: problem.finalProblem || '',
        reasoning: problem.reasoning || '',
        
        // Word Counts
        initialWordCount: countWords(problem.initialProblem),
        finalWordCount: countWords(problem.finalProblem),
        reasoningWordCount: countWords(problem.reasoning),
        
        // Timing
        startTime: problem.startTime || '',
        endTime: problem.endTime || '',
        totalTimeSpent: problem.totalTimeSpent || 0,
        
        // Interaction Counts
        totalInteractions: problem.interactions?.length || problem.interactionCount || 0,
        editorInteractions: problem.interactions?.filter(i => i.promptType === 'editor').length || 0,
        challengerInteractions: problem.interactions?.filter(i => i.promptType === 'challenger').length || 0,
        
        // Device Info
        userAgent: problem.deviceInfo?.userAgent || '',
        platform: problem.deviceInfo?.platform || '',
        screenResolution: problem.deviceInfo?.screenResolution || '',
        
        // Timestamps
        createdAt: problem.createdAt || '',
        updatedAt: problem.updatedAt || '',
      };
      
      // If there are interactions, create a row for each interaction
      if (problem.interactions && problem.interactions.length > 0) {
        problem.interactions.forEach((interaction, index) => {
          combinedData.push({
            ...baseData,
            
            // Interaction Info
            interactionNumber: index + 1,
            interactionId: interaction.interactionId || '',
            promptType: interaction.promptType || '',
            interactionTimestamp: interaction.timestamp || '',
            
            // User Input
            userInput: interaction.userInput || '',
            
            // AI Response
            aiResponse: interaction.aiResponse || '',
            aiResponseWordCount: countWords(interaction.aiResponse),
            
            // User Ratings
            usefulness: interaction.userRating?.usefulness || '',
            cognitiveLoad: interaction.userRating?.cognitiveLoad || '',
            satisfaction: interaction.userRating?.satisfaction || '',
            
            // User Feedback
            userFeedback: interaction.userFeedback || '',
            wasAccepted: interaction.wasAccepted || '',
            timeSpent: interaction.timeSpent || 0,
          });
        });
      } else {
        // No interactions, just add the base data
        combinedData.push({
          ...baseData,
          interactionNumber: 0,
          interactionId: '',
          promptType: '',
          interactionTimestamp: '',
          userInput: '',
          aiResponse: '',
          aiResponseWordCount: 0,
          usefulness: '',
          cognitiveLoad: '',
          satisfaction: '',
          userFeedback: '',
          wasAccepted: '',
          timeSpent: 0,
        });
      }
    });

    if (combinedData.length > 0) {
      const combinedFile = path.join(exportsDir, `research_data_combined_${timestamp}.csv`);
      const headers = Object.keys(combinedData[0]);
      const rows = combinedData.map(row => {
        return headers.map(header => escapeCSV(row[header])).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      fs.writeFileSync(combinedFile, csv);
      console.log(`✅ Combined Research Data exported to:`);
      console.log(`   ${combinedFile}`);
      console.log(`   Total rows: ${combinedData.length}\n`);
    }

    // ============================================
    // SUMMARY STATISTICS
    // ============================================
    
    const stats = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        dateRangeStart: startDate.toISOString(),
        dateRangeEnd: endDate.toISOString(),
      },
      participants: {
        total: users.length,
        editorFirst: users.filter(u => u.studyGroup === 'editor-first').length,
        challengerFirst: users.filter(u => u.studyGroup === 'challenger-first').length,
      },
      problems: {
        total: problems.length,
        completed: problems.filter(p => p.status === 'completed').length,
        inProgress: problems.filter(p => p.status === 'in-progress').length,
        abandoned: problems.filter(p => p.status === 'abandoned').length,
        infrastructure: problems.filter(p => p.taskCategory === 'infrastructure').length,
      },
      interactions: {
        total: combinedData.filter(d => d.interactionNumber > 0).length,
        editor: combinedData.filter(d => d.promptType === 'editor').length,
        challenger: combinedData.filter(d => d.promptType === 'challenger').length,
        rated: combinedData.filter(d => d.usefulness !== '').length,
      },
      averages: {
        interactionsPerProblem: problems.length > 0 
          ? (combinedData.filter(d => d.interactionNumber > 0).length / problems.length).toFixed(2) 
          : 0,
        timeSpentPerProblem: problems.length > 0
          ? (problems.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0) / problems.length).toFixed(2)
          : 0,
        finalWordCount: problems.length > 0
          ? (problems.reduce((sum, p) => sum + countWords(p.finalProblem), 0) / problems.length).toFixed(2)
          : 0,
      }
    };

    const statsFile = path.join(exportsDir, `research_statistics_${timestamp}.json`);
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(`✅ Statistics exported to:`);
    console.log(`   ${statsFile}\n`);

    // ============================================
    // CONSOLE SUMMARY
    // ============================================
    
    console.log('📊 Research Data Summary:');
    console.log('========================\n');
    console.log(`👥 Participants: ${stats.participants.total}`);
    console.log(`   - Editor-First: ${stats.participants.editorFirst}`);
    console.log(`   - Challenger-First: ${stats.participants.challengerFirst}\n`);
    
    console.log(`📝 Problems: ${stats.problems.total}`);
    console.log(`   - Completed: ${stats.problems.completed}`);
    console.log(`   - In Progress: ${stats.problems.inProgress}`);
    console.log(`   - Abandoned: ${stats.problems.abandoned}`);
    console.log(`   - Infrastructure: ${stats.problems.infrastructure}\n`);
    
    console.log(`💬 Interactions: ${stats.interactions.total}`);
    console.log(`   - Editor: ${stats.interactions.editor}`);
    console.log(`   - Challenger: ${stats.interactions.challenger}`);
    console.log(`   - Rated: ${stats.interactions.rated}\n`);
    
    console.log(`📈 Averages:`);
    console.log(`   - Interactions per Problem: ${stats.averages.interactionsPerProblem}`);
    console.log(`   - Time Spent per Problem: ${stats.averages.timeSpentPerProblem} minutes`);
    console.log(`   - Final Word Count: ${stats.averages.finalWordCount} words\n`);

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the export
exportResearchData()
  .then(() => {
    console.log('\n🎉 Research data export completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Export failed:', error);
    process.exit(1);
  });
