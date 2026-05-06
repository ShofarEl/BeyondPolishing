import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import Problem from '../models/Problem.js';
import User from '../models/User.js';

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

const exportPairedData = async () => {
  console.log('📊 Exporting paired responses (Editor + Challenger per participant)...\n');

  const users = await User.find();
  const problems = await Problem.find({ status: 'completed' }).populate('userId');
  
  // Group problems by user
  const userProblems = {};
  problems.forEach(problem => {
    const userId = problem.userId._id.toString();
    if (!userProblems[userId]) {
      userProblems[userId] = [];
    }
    userProblems[userId].push(problem);
  });

  // Helper function to escape CSV fields
  const escapeCsv = (text) => {
    if (!text) return '';
    const escaped = text.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  // CSV Header
  const csvHeader = [
    'participantId',
    'studyGroup',
    'academicLevel',
    'experienceLevel',
    'taskCategory',
    'seedProblem',
    'editorResponse',
    'challengerResponse',
    'finalProblemAfterEditor',
    'finalProblemAfterChallenger',
    'reasoningEditor',
    'reasoningChallenger',
    'originalityEditor',
    'originalityChallenger',
    'feasibilityEditor',
    'feasibilityChallenger',
    'clarityEditor',
    'clarityChallenger',
    'depthEditor',
    'depthChallenger',
    'cognitiveLoadEditor',
    'cognitiveLoadChallenger',
    'satisfactionEditor',
    'satisfactionChallenger'
  ].join(',');

  const csvRows = [csvHeader];

  let participantNum = 1;
  
  for (const user of users) {
    const userId = user._id.toString();
    const userProblemList = userProblems[userId] || [];
    
    if (userProblemList.length < 2) continue; // Skip if not both conditions
    
    // Find editor and challenger problems
    const editorProblem = userProblemList.find(p => p.interactions[0]?.promptType === 'editor');
    const challengerProblem = userProblemList.find(p => p.interactions[0]?.promptType === 'challenger');
    
    if (!editorProblem || !challengerProblem) continue;
    
    const editorInteraction = editorProblem.interactions[0];
    const challengerInteraction = challengerProblem.interactions[0];
    
    const row = [
      `P${String(participantNum).padStart(3, '0')}`,
      user.studyGroup,
      user.demographicData.academicLevel,
      user.demographicData.dataScienceExperience,
      editorProblem.taskCategory, // Using first problem's category
      escapeCsv(editorProblem.initialProblem), // Seed problem
      escapeCsv(editorInteraction?.aiResponse || ''),
      escapeCsv(challengerInteraction?.aiResponse || ''),
      escapeCsv(editorProblem.finalProblem),
      escapeCsv(challengerProblem.finalProblem),
      escapeCsv(editorProblem.reasoning),
      escapeCsv(challengerProblem.reasoning),
      editorProblem.evaluation.creativity.originality.toFixed(2),
      challengerProblem.evaluation.creativity.originality.toFixed(2),
      editorProblem.evaluation.feasibility.technicalFeasibility.toFixed(2),
      challengerProblem.evaluation.feasibility.technicalFeasibility.toFixed(2),
      editorProblem.evaluation.reasoning.clarity.toFixed(2),
      challengerProblem.evaluation.reasoning.clarity.toFixed(2),
      editorProblem.evaluation.reasoning.depth.toFixed(2),
      challengerProblem.evaluation.reasoning.depth.toFixed(2),
      editorInteraction?.userRating?.cognitiveLoad?.toFixed(2) || '0',
      challengerInteraction?.userRating?.cognitiveLoad?.toFixed(2) || '0',
      editorInteraction?.userRating?.satisfaction?.toFixed(2) || '0',
      challengerInteraction?.userRating?.satisfaction?.toFixed(2) || '0'
    ].join(',');

    csvRows.push(row);
    participantNum++;
  }

  const csvContent = csvRows.join('\n');
  const exportPath = join(__dirname, '..', 'exports', 'paired_responses_data.csv');
  
  fs.writeFileSync(exportPath, csvContent);
  console.log(`✅ Paired responses exported to: ${exportPath}`);
  console.log(`   Total participants: ${participantNum - 1}\n`);

  // Also create a human-readable text export for review
  let textExport = '='.repeat(80) + '\n';
  textExport += 'PAIRED RESPONSES EXPORT - EDITOR vs CHALLENGER\n';
  textExport += '='.repeat(80) + '\n\n';

  participantNum = 1;
  for (const user of users) {
    const userId = user._id.toString();
    const userProblemList = userProblems[userId] || [];
    
    if (userProblemList.length < 2) continue;
    
    const editorProblem = userProblemList.find(p => p.interactions[0]?.promptType === 'editor');
    const challengerProblem = userProblemList.find(p => p.interactions[0]?.promptType === 'challenger');
    
    if (!editorProblem || !challengerProblem) continue;
    
    textExport += `PARTICIPANT P${String(participantNum).padStart(3, '0')}\n`;
    textExport += `Study Group: ${user.studyGroup}\n`;
    textExport += `Category: ${editorProblem.taskCategory}\n`;
    textExport += '-'.repeat(80) + '\n\n';
    
    textExport += `SEED PROBLEM:\n${editorProblem.initialProblem}\n\n`;
    
    textExport += `EDITOR RESPONSE:\n${editorProblem.interactions[0]?.aiResponse || 'N/A'}\n\n`;
    
    textExport += `CHALLENGER RESPONSE:\n${challengerProblem.interactions[0]?.aiResponse || 'N/A'}\n\n`;
    
    textExport += `FINAL PROBLEM (After Editor):\n${editorProblem.finalProblem}\n\n`;
    
    textExport += `FINAL PROBLEM (After Challenger):\n${challengerProblem.finalProblem}\n\n`;
    
    textExport += `SCORES COMPARISON:\n`;
    textExport += `  Originality:    Editor=${editorProblem.evaluation.creativity.originality.toFixed(2)}, Challenger=${challengerProblem.evaluation.creativity.originality.toFixed(2)}\n`;
    textExport += `  Feasibility:    Editor=${editorProblem.evaluation.feasibility.technicalFeasibility.toFixed(2)}, Challenger=${challengerProblem.evaluation.feasibility.technicalFeasibility.toFixed(2)}\n`;
    textExport += `  Clarity:        Editor=${editorProblem.evaluation.reasoning.clarity.toFixed(2)}, Challenger=${challengerProblem.evaluation.reasoning.clarity.toFixed(2)}\n`;
    textExport += `  Depth:          Editor=${editorProblem.evaluation.reasoning.depth.toFixed(2)}, Challenger=${challengerProblem.evaluation.reasoning.depth.toFixed(2)}\n`;
    textExport += `  Cognitive Load: Editor=${editorProblem.interactions[0]?.userRating?.cognitiveLoad?.toFixed(2) || 'N/A'}, Challenger=${challengerProblem.interactions[0]?.userRating?.cognitiveLoad?.toFixed(2) || 'N/A'}\n`;
    
    textExport += '\n' + '='.repeat(80) + '\n\n';
    participantNum++;
  }

  const textPath = join(__dirname, '..', 'exports', 'paired_responses_readable.txt');
  fs.writeFileSync(textPath, textExport);
  console.log(`✅ Human-readable export created: ${textPath}\n`);
};

const main = async () => {
  try {
    await connectDB();
    await exportPairedData();
    console.log('✅ Export complete! Closing connection...\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

main();
