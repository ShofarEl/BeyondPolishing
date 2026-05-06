import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The 30 seed problems
const seedProblems = [
  "Predict data usage growth so we know which routers to upgrade before they fall over.",
  "We want to stop upgrading routers after the damage is done. If we can predict how usage is trending on each device, we can get replacements in before anyone notices a problem.",
  "Forecast router load from historical bandwidth data and flag the ones closest to their limits.",
  "Use past traffic data to figure out which routers will need replacing and roughly when.",
  "Every few months a router gets hammered and performance tanks for an entire floor. There's got to be a way to see that coming. The data is all there in the logs, we just need to actually use it to predict when capacity is about to run out and act before it does.",
  "Build a usage forecast that drives the router upgrade schedule instead of user complaints.",
  "Predict which access points will be overwhelmed by network demand in the next quarter.",
  "The IT team is always playing catch-up because nobody sees the usage spikes coming. A model that projects data demand per router, even a rough one, would let us plan upgrades properly instead of scrambling for hardware every time something starts choking.",
  "Analyze how bandwidth usage has been growing on each router and estimate when it will hit its ceiling.",
  "Model data consumption trends across all access points and produce a prioritized upgrade list for the next budget cycle.",
  "We have two years of router traffic logs. We should be able to look at those trends, project them forward, and come out with a ranked list of which routers to replace this year, which to watch, and which are fine for now.",
  "Forecast data usage per router and surface the ones that will hit capacity before the next refresh cycle.",
  "Use bandwidth history to predict future demand and decide which routers need upgrading and in what order.",
  "Our procurement lead needs six months of lead time to order hardware. If we could predict which routers are going to be strained six months from now, based on actual usage trends, we could hand her a list instead of guessing.",
  "Predict how much load each router will be carrying six months out and flag the ones that will struggle.",
  "Identify routers where usage is climbing fast enough to justify swapping them out before they become a bottleneck.",
  "Use network usage data to forecast router saturation and build an upgrade plan around those predictions.",
  "We keep spending on emergency router replacements because we only notice the problem when users start complaining. If we modeled usage growth per access point we could see it coming weeks or months ahead and plan properly instead of reacting.",
  "Predict future bandwidth demand at the access point level and match it against each router's rated capacity.",
  "Look at how data usage is trending on each router and estimate the date it will need replacing.",
  "Forecast per-router usage so the network team has something concrete to bring to the annual hardware planning meeting rather than rough estimates based on last year's complaints.",
  "Build something that watches usage trends per router and raises a flag when an upgrade is coming up in the next 60 to 90 days.",
  "Use historical traffic patterns to predict which routers will be under too much load by year end.",
  "Predict router upgrade timing from data usage trends so the team stops finding out about problems the hard way.",
  "We are opening three new offices next year and nobody knows whether the existing routers there can handle the additional load or if we need to budget for upgrades before anyone moves in. A demand forecast built on current usage trends would actually answer that question.",
  "Forecast how data demand will grow across the network and turn that into a scheduled router upgrade plan.",
  "Use router logs to spot which access points are trending toward saturation and give IT enough warning to do something about it.",
  "Project data usage growth per access point so upgrade decisions are based on where demand is heading, not where it already is.",
  "Analyze bandwidth consumption over time and predict which routers are going to need replacing in the next two quarters.",
  "Right now the upgrade process goes: router slows down, users complain, ticket gets filed, IT investigates, hardware gets ordered, it arrives late. Predicting usage growth per router would let us cut that whole cycle short and just swap hardware before step one ever happens."
];

// Editor prompt
const editorSystemPrompt = `You are an expert data science editor and mentor specializing in network infrastructure and router optimization problems. Your role is to help students refine and polish their router infrastructure problem statements to make them more precise, measurable, and actionable.

Your task is to provide constructive feedback and specific suggestions to improve the problem statement. Focus on:

1. **Clarity and Specificity**: Make the problem statement clear and unambiguous in the context of network infrastructure
2. **Metrics and Evaluation**: Suggest specific, measurable success criteria relevant to router performance, network efficiency, or user satisfaction
3. **Data Requirements**: Identify what network data, usage patterns, or infrastructure data would be needed and how to obtain it
4. **Scope and Constraints**: Help define realistic boundaries considering network topology, budget limitations, and technical constraints
5. **Stakeholder Alignment**: Consider IT administrators, end users, procurement teams, and budget decision-makers
6. **Technical Feasibility**: Suggest approaches that are technically sound for network infrastructure contexts

Provide 2-3 specific, actionable suggestions. Be encouraging but direct. Use a supportive, mentor-like tone. Format your response using markdown with **bold** headings and clear numbered points.`;

// Challenger prompt
const challengerSystemPrompt = `You are a creative challenger and innovation catalyst specializing in network infrastructure and router optimization. Your role is to help students explore alternative perspectives and reframe their router infrastructure problems in novel, creative ways.

Your task is to challenge conventional thinking and propose radically different approaches to the problem. Focus on:

1. **Alternative Stakeholders**: Consider end users, facility managers, IT support staff, budget administrators, accessibility advocates, or environmental sustainability teams
2. **Different Objectives**: Explore goals like equity in access, user satisfaction, cost optimization, energy efficiency, security, or organizational productivity
3. **Novel Approaches**: Consider predictive maintenance, user behavior analysis, fairness algorithms, or community-driven solutions
4. **Broader Context**: Connect to issues like digital equity, organizational sustainability, employee productivity, or operational efficiency
5. **Creative Constraints**: Add interesting requirements like privacy protection, budget limitations, or environmental considerations
6. **Cross-Domain Insights**: Apply concepts from urban planning, resource allocation, service design, or organizational psychology

Propose 2-3 alternative problem framings that are creative but still feasible. Challenge assumptions and encourage innovative thinking. Use an inspiring, thought-provoking tone. Format your response using markdown with **bold** headings and clear numbered alternatives.`;

// Generate timestamps between April 10 and May 2, 2026
const generateTimestamp = (index) => {
  const startDate = new Date('2026-04-10T08:00:00');
  const endDate = new Date('2026-05-02T18:00:00');
  const totalMs = endDate - startDate;
  const stepMs = totalMs / 29; // 30 problems, so 29 intervals
  const timestamp = new Date(startDate.getTime() + (stepMs * index));
  return timestamp.toISOString();
};

// Helper function to escape CSV fields
const escapeCsv = (text) => {
  if (!text) return '';
  const escaped = text.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped}"`;
  }
  return escaped;
};

// Add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateEditorResponse = async (problemStatement) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: editorSystemPrompt },
      { role: 'user', content: `Please review and refine this router infrastructure problem statement:\n\n"${problemStatement}"\n\nConsider the specific context of router infrastructure optimization, network performance, and user experience. Provide specific suggestions to make this problem more precise, measurable, and actionable. Focus on clarity, metrics, data requirements, and technical feasibility in the context of network infrastructure.` }
    ],
    max_tokens: 800,
    temperature: 0.7
  });
  
  return completion.choices[0].message.content.trim();
};

const generateChallengerResponse = async (problemStatement) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: challengerSystemPrompt },
      { role: 'user', content: `Challenge and reframe this router infrastructure problem from a completely different angle:\n\n"${problemStatement}"\n\nConsider alternative perspectives such as: equity in network access, user experience optimization, cost-effectiveness, environmental impact, security concerns, or organizational implications of connectivity. Propose alternative problem framings that explore different stakeholders, objectives, or approaches. Be creative and innovative while maintaining feasibility in the context of network infrastructure.` }
    ],
    max_tokens: 800,
    temperature: 0.8
  });
  
  return completion.choices[0].message.content.trim();
};

const generateCreativeResponses = async () => {
  console.log('🚀 Generating creative AI responses for 30 seed problems...\n');
  
  const results = [];
  
  for (let i = 0; i < seedProblems.length; i++) {
    const seedProblem = seedProblems[i];
    console.log(`Processing ${i + 1}/30: "${seedProblem.substring(0, 50)}..."`);
    
    try {
      // Generate editor response
      console.log('  🔧 Generating editor response...');
      const editorResponse = await generateEditorResponse(seedProblem);
      
      // Add delay between calls
      await delay(1000);
      
      // Generate challenger response
      console.log('  💡 Generating challenger response...');
      const challengerResponse = await generateChallengerResponse(seedProblem);
      
      results.push({
        timestamp: generateTimestamp(i),
        seedProblem,
        editorResponse,
        challengerResponse
      });
      
      console.log(`  ✅ Completed ${i + 1}/30\n`);
      
      // Add delay between problems
      await delay(1500);
      
    } catch (error) {
      console.error(`  ❌ Error processing problem ${i + 1}:`, error.message);
      
      // Add fallback responses if API fails
      results.push({
        timestamp: generateTimestamp(i),
        seedProblem,
        editorResponse: `Error generating editor response: ${error.message}`,
        challengerResponse: `Error generating challenger response: ${error.message}`
      });
    }
  }
  
  return results;
};

const exportToCSV = (results) => {
  const header = 'timestamp,seedProblem,editorResponse,challengerResponse';
  const rows = [header];
  
  results.forEach(result => {
    const row = [
      result.timestamp,
      escapeCsv(result.seedProblem),
      escapeCsv(result.editorResponse),
      escapeCsv(result.challengerResponse)
    ].join(',');
    rows.push(row);
  });
  
  return rows.join('\n');
};

const main = async () => {
  try {
    console.log('🎯 Starting creative response generation with OpenAI...\n');
    
    // Generate responses
    const results = await generateCreativeResponses();
    
    // Export to CSV
    const csvContent = exportToCSV(results);
    const exportPath = join(__dirname, '..', 'exports', 'creative_responses_openai.csv');
    
    // Ensure exports directory exists
    const exportsDir = join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    fs.writeFileSync(exportPath, csvContent);
    
    console.log('🎉 Creative responses generated successfully!');
    console.log(`📁 File: ${exportPath}`);
    console.log(`📊 Records: ${results.length}`);
    console.log(`📅 Date range: April 10 - May 2, 2026`);
    console.log(`🤖 AI-generated editor and challenger responses for each seed problem\n`);
    
    // Show sample of first result
    if (results.length > 0) {
      console.log('📝 Sample result:');
      console.log(`Seed: ${results[0].seedProblem.substring(0, 80)}...`);
      console.log(`Editor: ${results[0].editorResponse.substring(0, 100)}...`);
      console.log(`Challenger: ${results[0].challengerResponse.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();