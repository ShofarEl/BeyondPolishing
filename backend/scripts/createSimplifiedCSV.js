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

const createSimplifiedCSV = async () => {
  console.log('📊 Creating simplified CSV with seed problems and AI responses...\n');
  
  const inputPath = join(__dirname, '..', 'exports', 'comprehensive_synthetic_data_april24_may2.csv');
  const outputPath = join(__dirname, '..', 'exports', 'simplified_ai_responses.csv');
  
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
          seedProblem: row.seedProblem,
          editorResponse: row.editorResponse,
          challengerResponse: row.challengerResponse
        });
      })
      .on('end', () => {
        console.log(`✅ Processed ${results.length} records`);
        
        // Create simplified CSV
        const csvHeader = 'timestamp,seedProblem,editorResponse,challengerResponse';
        const csvRows = [csvHeader];
        
        results.forEach(result => {
          const row = [
            result.timestamp,
            escapeCsv(result.seedProblem),
            escapeCsv(result.editorResponse),
            escapeCsv(result.challengerResponse)
          ].join(',');
          csvRows.push(row);
        });
        
        const csvContent = csvRows.join('\n');
        fs.writeFileSync(outputPath, csvContent);
        
        console.log('🎉 Simplified CSV created successfully!');
        console.log(`📁 Output file: ${outputPath}`);
        console.log(`📊 Records: ${results.length}`);
        console.log(`📅 Date range: April 24 - May 2, 2026`);
        console.log(`🤖 Contains AI-generated editor and challenger responses\n`);
        
        // Show sample of first few records
        console.log('📝 Sample records:');
        results.slice(0, 3).forEach((result, index) => {
          console.log(`\n${index + 1}. Timestamp: ${result.timestamp}`);
          console.log(`   Seed: "${result.seedProblem.substring(0, 60)}..."`);
          console.log(`   Editor: "${result.editorResponse.substring(0, 80)}..."`);
          console.log(`   Challenger: "${result.challengerResponse.substring(0, 80)}..."`);
        });
        
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
};

// Run the script
createSimplifiedCSV().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});