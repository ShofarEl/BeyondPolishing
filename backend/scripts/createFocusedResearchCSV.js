import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to escape CSV fields
const escapeCsv = (text) => {
  if (!text) return '';
  const escaped = text.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped}"`;
  }
  return escaped;
};

const createFocusedResearchCSV = async () => {
  console.log('📊 Creating focused research CSV with required columns...\n');
  
  const inputPath = join(__dirname, '..', 'exports', 'comprehensive_synthetic_data_april24_may2.csv');
  const outputPath = join(__dirname, '..', 'exports', 'research_dataset.csv');
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Input file not found:', inputPath);
    process.exit(1);
  }
  
  const results = [];
  
  // Read the comprehensive CSV file
  return new Promise((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(csv())
      .on('data', (row) => {
        results.push({
          timestamp: row.timestamp,
          sessionId: row.sessionId,
          studyGroup: row.studyGroup,
          academicLevel: row.academicLevel,
          experience: row.experience,
          seedProblem: row.seedProblem,
          editorResponse: row.editorResponse,
          challengerResponse: row.challengerResponse
        });
      })
      .on('end', () => {
        console.log(`✅ Processed ${results.length} records`);
        
        // Create focused research CSV
        const csvHeader = 'timestamp,sessionId,studyGroup,academicLevel,experience,seedProblem,editorResponse,challengerResponse';
        const csvRows = [csvHeader];
        
        results.forEach(result => {
          const row = [
            result.timestamp,
            result.sessionId,
            result.studyGroup,
            result.academicLevel,
            result.experience,
            escapeCsv(result.seedProblem),
            escapeCsv(result.editorResponse),
            escapeCsv(result.challengerResponse)
          ].join(',');
          csvRows.push(row);
        });
        
        const csvContent = csvRows.join('\n');
        fs.writeFileSync(outputPath, csvContent);
        
        console.log('🎉 Focused research CSV created successfully!');
        console.log(`📁 Output file: ${outputPath}`);
        console.log(`📊 Records: ${results.length}`);
        console.log(`📅 Date range: April 24 - May 2, 2026`);
        console.log(`🎯 Columns: 8 focused research variables\n`);
        
        // Show data distribution
        const studyGroups = {};
        const academicLevels = {};
        const experiences = {};
        const uniqueSeeds = new Set();
        
        results.forEach(result => {
          studyGroups[result.studyGroup] = (studyGroups[result.studyGroup] || 0) + 1;
          academicLevels[result.academicLevel] = (academicLevels[result.academicLevel] || 0) + 1;
          experiences[result.experience] = (experiences[result.experience] || 0) + 1;
          uniqueSeeds.add(result.seedProblem);
        });
        
        console.log('📈 Data Distribution:');
        console.log('Study Groups:', studyGroups);
        console.log('Academic Levels:', academicLevels);
        console.log('Experience Levels:', experiences);
        console.log(`Unique Seed Problems: ${uniqueSeeds.size}`);
        
        // Show sample of first record
        console.log('\n📝 Sample Record:');
        const sample = results[0];
        console.log(`Timestamp: ${sample.timestamp}`);
        console.log(`Session ID: ${sample.sessionId}`);
        console.log(`Study Group: ${sample.studyGroup}`);
        console.log(`Academic Level: ${sample.academicLevel}`);
        console.log(`Experience: ${sample.experience}`);
        console.log(`Seed Problem: "${sample.seedProblem}"`);
        console.log(`Editor Response: "${sample.editorResponse.substring(0, 100)}..."`);
        console.log(`Challenger Response: "${sample.challengerResponse.substring(0, 100)}..."`);
        
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
};

// Run the script
createFocusedResearchCSV().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});