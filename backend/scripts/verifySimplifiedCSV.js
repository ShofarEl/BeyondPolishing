import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const verifySimplifiedCSV = async () => {
  console.log('🔍 Verifying simplified CSV structure and content...\n');
  
  const filePath = join(__dirname, '..', 'exports', 'simplified_ai_responses.csv');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    process.exit(1);
  }
  
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        console.log(`✅ File verification complete!`);
        console.log(`📊 Total records: ${results.length}`);
        console.log(`📁 File size: ${fs.statSync(filePath).size} bytes`);
        
        // Check structure
        if (results.length > 0) {
          const firstRow = results[0];
          console.log('\n📋 CSV Structure:');
          console.log('Columns:', Object.keys(firstRow));
          
          // Show date range
          const timestamps = results.map(r => new Date(r.timestamp)).sort();
          console.log(`📅 Date range: ${timestamps[0].toISOString().split('T')[0]} to ${timestamps[timestamps.length - 1].toISOString().split('T')[0]}`);
          
          // Count unique seed problems
          const uniqueSeeds = new Set(results.map(r => r.seedProblem));
          console.log(`🌱 Unique seed problems: ${uniqueSeeds.size}`);
          
          // Show sample data
          console.log('\n📝 Sample Records:');
          results.slice(0, 2).forEach((row, index) => {
            console.log(`\n--- Record ${index + 1} ---`);
            console.log(`Timestamp: ${row.timestamp}`);
            console.log(`Seed Problem: "${row.seedProblem}"`);
            console.log(`Editor Response: "${row.editorResponse.substring(0, 150)}..."`);
            console.log(`Challenger Response: "${row.challengerResponse.substring(0, 150)}..."`);
          });
          
          // Verify all responses are present
          const missingEditor = results.filter(r => !r.editorResponse || r.editorResponse.trim() === '');
          const missingChallenger = results.filter(r => !r.challengerResponse || r.challengerResponse.trim() === '');
          
          console.log(`\n✅ Data Quality Check:`);
          console.log(`Records with editor responses: ${results.length - missingEditor.length}/${results.length}`);
          console.log(`Records with challenger responses: ${results.length - missingChallenger.length}/${results.length}`);
          
          if (missingEditor.length === 0 && missingChallenger.length === 0) {
            console.log('🎉 All records have complete AI responses!');
          }
        }
        
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
};

// Run verification
verifySimplifiedCSV().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});