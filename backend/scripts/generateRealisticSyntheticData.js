import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import existing models
import User from '../models/User.js';
import Problem from '../models/Problem.js';

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

// AI System Prompts (from your aiService.js)
const editorSystemPrompt = `You are an expert data science editor and mentor specializing in network infrastructure and WiFi optimization problems. Your role is to help students refine and polish their WiFi infrastructure problem statements to make them more precise, measurable, and actionable.

Your task is to provide constructive feedback and specific suggestions to improve the problem statement. Focus on:

1. **Clarity and Specificity**: Make the problem statement clear and unambiguous in the context of network infrastructure
2. **Metrics and Evaluation**: Suggest specific, measurable success criteria relevant to WiFi performance, user satisfaction, or network efficiency
3. **Data Requirements**: Identify what network data, usage patterns, or infrastructure data would be needed and how to obtain it
4. **Scope and Constraints**: Help define realistic boundaries considering network topology, user privacy, and technical limitations
5. **Stakeholder Alignment**: Consider IT administrators, end users, facility managers, and budget decision-makers
6. **Technical Feasibility**: Suggest approaches that are technically sound for network infrastructure contexts

Provide 2-3 specific, actionable suggestions. Be encouraging but direct. Use a supportive, mentor-like tone. Format your response using markdown with **bold** headings and clear numbered points.`;

const challengerSystemPrompt = `You are a creative challenger and innovation catalyst specializing in network infrastructure and WiFi optimization. Your role is to help students explore alternative perspectives and reframe their WiFi infrastructure problems in novel, creative ways.

Your task is to challenge conventional thinking and propose radically different approaches to the problem. Focus on:

1. **Alternative Stakeholders**: Consider dormitory residents, facility managers, IT support staff, budget administrators, accessibility advocates, or environmental sustainability teams
2. **Different Objectives**: Explore goals like equity in access, user satisfaction, cost optimization, energy efficiency, security, or social connectivity
3. **Novel Approaches**: Consider predictive maintenance, user behavior analysis, fairness algorithms, or community-driven solutions
4. **Broader Context**: Connect to issues like digital equity, campus sustainability, student success, or organizational efficiency
5. **Creative Constraints**: Add interesting requirements like privacy protection, budget limitations, or environmental considerations
6. **Cross-Domain Insights**: Apply concepts from urban planning, social networks, resource allocation, or service design

Propose 2-3 alternative problem framings that are creative but still feasible. Challenge assumptions and encourage innovative thinking. Use an inspiring, thought-provoking tone. Format your response using markdown with **bold** headings and clear numbered alternatives.`;

// Generate realistic timestamps between April 24 - May 2, 2026
const generateTimestamp = (dayOffset, hourOffset = 0, minuteOffset = 0) => {
  const startDate = new Date('2026-04-24T08:00:00Z');
  const timestamp = new Date(startDate);
  timestamp.setDate(timestamp.getDate() + dayOffset);
  timestamp.setHours(timestamp.getHours() + hourOffset);
  timestamp.setMinutes(timestamp.getMinutes() + minuteOffset);
  return timestamp;
};

// Generate realistic user data
const generateUser = (index) => {
  return {
    sessionId: `synthetic_user_${index}_${uuidv4().substring(0, 8)}`,
    studyGroup: index % 2 === 0 ? 'editor-first' : 'challenger-first',
    consentGiven: true,
    consentTimestamp: generateTimestamp(0, -24), // Consented day before study
    demographicData: {
      academicLevel: ['undergraduate', 'graduate', 'postgraduate'][Math.floor(Math.random() * 3)],
      dataScienceExperience: ['basic', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)]
    },
    isActive: true,
    lastActive: generateTimestamp(0)
  };
};

// Generate AI responses using OpenAI API
const generateAIResponse = async (promptType, problemStatement, userInput = '') => {
  const systemPrompt = promptType === 'editor' ? editorSystemPrompt : challengerSystemPrompt;
  const userPrompt = promptType === 'editor' 
    ? `Please review and refine this data science problem statement about WiFi infrastructure:\n\n"${problemStatement}"\n\nConsider the specific context of WiFi infrastructure optimization, network performance, and user experience. Provide specific suggestions to make this problem more precise, measurable, and actionable. Focus on clarity, metrics, data requirements, and technical feasibility in the context of network infrastructure.`
    : `Challenge and reframe this WiFi infrastructure data science problem from a completely different angle:\n\n"${problemStatement}"\n\nConsider alternative perspectives such as: equity in network access, user experience optimization, cost-effectiveness, environmental impact, security concerns, or social implications of connectivity. Propose alternative problem framings that explore different stakeholders, objectives, or approaches. Be creative and innovative while maintaining feasibility in the context of network infrastructure.`;

  const fullUserPrompt = userInput 
    ? `${userPrompt}\n\nAdditional context from user: ${userInput}`
    : userPrompt;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullUserPrompt }
      ],
      max_tokens: 1000,
      temperature: promptType === 'editor' ? 0.7 : 0.8
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error generating ${promptType} response:`, error.message);
    return `Error generating ${promptType} response: ${error.message}`;
  }
};

// Generate realistic user ratings
const generateRating = (promptType, responseQuality = 'good') => {
  const baseRatings = {
    good: { usefulness: 4, cognitiveLoad: 3, satisfaction: 4 },
    excellent: { usefulness: 5, cognitiveLoad: 2, satisfaction: 5 },
    average: { usefulness: 3, cognitiveLoad: 4, satisfaction: 3 },
    poor: { usefulness: 2, cognitiveLoad: 5, satisfaction: 2 }
  };

  const base = baseRatings[responseQuality];
  const variation = () => Math.max(1, Math.min(5, base.usefulness + (Math.random() - 0.5) * 2));

  return {
    usefulness: Math.round(variation()),
    cognitiveLoad: Math.round(Math.max(1, Math.min(5, base.cognitiveLoad + (Math.random() - 0.5) * 2))),
    satisfaction: Math.round(Math.max(1, Math.min(5, base.satisfaction + (Math.random() - 0.5) * 2)))
  };
};

// Generate realistic user feedback
const generateFeedback = (promptType, rating) => {
  const editorFeedbacks = [
    "This helped me clarify my problem statement significantly. The suggestions about metrics were particularly useful.",
    "Good feedback on making the problem more specific. I appreciate the focus on technical feasibility.",
    "The data requirements section was very helpful. Made me think about what I actually need to collect.",
    "Clear and actionable suggestions. Helped me refine my approach to the WiFi optimization problem.",
    "The stakeholder analysis was insightful. I hadn't considered all the different perspectives before."
  ];

  const challengerFeedbacks = [
    "Wow, I never thought about approaching this from an equity perspective. Really opened my eyes to new possibilities.",
    "The alternative stakeholder suggestions were creative and thought-provoking. Changed how I think about the problem.",
    "Interesting reframing around sustainability. Made me consider environmental impacts I hadn't thought of.",
    "The cross-domain insights were fascinating. Applying urban planning concepts to network infrastructure is brilliant.",
    "This challenged my assumptions in a good way. The alternative objectives gave me new directions to explore."
  ];

  const feedbacks = promptType === 'editor' ? editorFeedbacks : challengerFeedbacks;
  
  if (rating.satisfaction >= 4) {
    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
  } else if (rating.satisfaction >= 3) {
    return "Helpful feedback, though I would have liked more specific examples.";
  } else {
    return "The suggestions were a bit too abstract for my current understanding level.";
  }
};

// Generate evolved problem statements
const evolveProblemStatement = (seedProblem, interactions) => {
  const evolutions = [
    // More specific versions
    seedProblem.replace("predict", "develop machine learning models to predict").replace("usage", "bandwidth usage patterns"),
    seedProblem.replace("routers", "WiFi access points and network infrastructure").replace("upgrade", "proactively upgrade"),
    seedProblem + " This should include analyzing historical usage data, identifying peak usage patterns, and developing predictive models with at least 85% accuracy.",
    seedProblem.replace("data usage", "network traffic and bandwidth consumption").replace("growth", "growth trends and seasonal variations"),
    // More comprehensive versions
    `Building on the core idea of ${seedProblem.toLowerCase()}, develop a comprehensive network capacity planning system that integrates usage forecasting, cost-benefit analysis, and stakeholder communication protocols.`,
    `Expand the concept of ${seedProblem.toLowerCase()} to include equity considerations, ensuring that network upgrades prioritize areas with historically poor connectivity while maintaining overall system performance.`,
    `Reframe ${seedProblem.toLowerCase()} as a sustainability-focused initiative that balances network performance needs with energy efficiency and environmental impact considerations.`
  ];

  return evolutions[Math.floor(Math.random() * evolutions.length)];
};

// Generate realistic reasoning
const generateReasoning = (finalProblem, interactions) => {
  const reasoningTemplates = [
    `I chose this problem formulation because it addresses a critical infrastructure need while being technically feasible with available data. The AI feedback helped me refine the scope and consider important stakeholders I initially overlooked. The editor suggestions improved the clarity and measurability of success criteria, while the challenger feedback opened my perspective to equity and sustainability considerations. This balanced approach ensures the solution is both innovative and practical.`,
    
    `Through the AI-assisted refinement process, I realized my initial problem statement was too narrow. The editor feedback helped me specify concrete metrics and data requirements, making the project more actionable. The challenger perspective introduced alternative stakeholder viewpoints that enriched the problem framing. I ultimately chose this formulation because it balances technical rigor with creative problem-solving, addressing both immediate infrastructure needs and broader organizational goals.`,
    
    `The iterative feedback process significantly improved my problem conceptualization. Initially, I focused solely on technical prediction accuracy, but the challenger prompts helped me consider user experience, cost optimization, and environmental impact. The editor feedback ensured my expanded vision remained grounded in feasible methodologies and clear success metrics. This final formulation represents a comprehensive approach that addresses multiple stakeholder needs while maintaining technical soundness.`,
    
    `My problem evolution was guided by the complementary nature of editor and challenger feedback. The editor helped me tighten the technical specifications and identify concrete data sources, while the challenger pushed me to consider innovative approaches like fairness algorithms and community-driven solutions. I selected this final framing because it demonstrates both analytical rigor and creative thinking, essential qualities for impactful data science work.`
  ];

  return reasoningTemplates[Math.floor(Math.random() * reasoningTemplates.length)];
};

// Add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to escape CSV fields
const escapeCsv = (text) => {
  if (!text) return '';
  const escaped = text.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped}"`;
  }
  return escaped;
};

// Main generation function
const generateSyntheticData = async () => {
  console.log('🚀 Starting realistic synthetic data generation...\n');
  
  await connectDB();
  
  // Clear existing synthetic data
  console.log('🧹 Clearing existing synthetic data...');
  await User.deleteMany({ sessionId: { $regex: /^synthetic_user_/ } });
  await Problem.deleteMany({});
  
  const allResults = [];
  const users = [];
  const problems = [];
  
  // Generate 50 users (more realistic sample size)
  console.log('👥 Generating users...');
  for (let i = 0; i < 50; i++) {
    const user = generateUser(i);
    users.push(user);
  }
  
  // Save users to database
  const savedUsers = await User.insertMany(users);
  console.log(`✅ Created ${savedUsers.length} users`);
  
  // Generate problems and interactions
  console.log('\n📝 Generating problems and AI interactions...');
  
  for (let userIndex = 0; userIndex < savedUsers.length; userIndex++) {
    const user = savedUsers[userIndex];
    const seedProblem = seedProblems[userIndex % seedProblems.length];
    
    console.log(`Processing user ${userIndex + 1}/${savedUsers.length}: ${user.name}`);
    
    // Generate problem start time (distributed across the study period)
    const dayOffset = Math.floor((userIndex / savedUsers.length) * 8); // Spread across 8 days
    const hourOffset = Math.floor(Math.random() * 10) + 8; // Between 8 AM and 6 PM
    const minuteOffset = Math.floor(Math.random() * 60);
    
    const startTime = generateTimestamp(dayOffset, hourOffset, minuteOffset);
    
    // Create initial problem
    const problemId = uuidv4();
    const initialProblem = seedProblem;
    
    const problem = {
      userId: user._id,
      problemId,
      taskPrompt: "Frame a data science problem for WiFi infrastructure optimization",
      taskCategory: "infrastructure",
      initialProblem,
      finalProblem: initialProblem, // Will be updated
      reasoning: '',
      status: 'in-progress',
      startTime,
      endTime: null,
      totalTimeSpent: 0,
      interactions: [],
      deviceInfo: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        screenResolution: "1920x1080",
        platform: "Win32"
      },
      createdAt: startTime,
      updatedAt: startTime
    };
    
    // Determine interaction order based on study group
    const isEditorFirst = user.studyGroup === 'editor-first';
    const firstPromptType = isEditorFirst ? 'editor' : 'challenger';
    const secondPromptType = isEditorFirst ? 'challenger' : 'editor';
    
    // Generate first interaction
    console.log(`  🔧 Generating ${firstPromptType} response...`);
    const firstResponse = await generateAIResponse(firstPromptType, initialProblem);
    
    const firstInteractionTime = new Date(startTime.getTime() + Math.random() * 30 * 60 * 1000); // Within 30 minutes
    const firstRating = generateRating(firstPromptType);
    
    const firstInteraction = {
      interactionId: uuidv4(),
      timestamp: firstInteractionTime,
      promptType: firstPromptType,
      userInput: initialProblem,
      aiResponse: firstResponse,
      userRating: firstRating,
      userFeedback: generateFeedback(firstPromptType, firstRating),
      wasAccepted: firstRating.satisfaction >= 3,
      timeSpent: Math.floor(Math.random() * 300) + 120 // 2-7 minutes
    };
    
    problem.interactions.push(firstInteraction);
    
    // Add delay to respect rate limits
    await delay(1000);
    
    // Generate second interaction (with evolved problem)
    const evolvedProblem = evolveProblemStatement(initialProblem, [firstInteraction]);
    
    console.log(`  💡 Generating ${secondPromptType} response...`);
    const secondResponse = await generateAIResponse(secondPromptType, evolvedProblem);
    
    const secondInteractionTime = new Date(firstInteractionTime.getTime() + (Math.random() * 60 + 30) * 60 * 1000); // 30-90 minutes later
    const secondRating = generateRating(secondPromptType);
    
    const secondInteraction = {
      interactionId: uuidv4(),
      timestamp: secondInteractionTime,
      promptType: secondPromptType,
      userInput: evolvedProblem,
      aiResponse: secondResponse,
      userRating: secondRating,
      userFeedback: generateFeedback(secondPromptType, secondRating),
      wasAccepted: secondRating.satisfaction >= 3,
      timeSpent: Math.floor(Math.random() * 400) + 180 // 3-10 minutes
    };
    
    problem.interactions.push(secondInteraction);
    
    // Complete the problem
    const finalProblem = evolveProblemStatement(evolvedProblem, problem.interactions);
    const reasoning = generateReasoning(finalProblem, problem.interactions);
    
    const endTime = new Date(secondInteractionTime.getTime() + (Math.random() * 30 + 15) * 60 * 1000); // 15-45 minutes later
    const totalTimeSpent = Math.round((endTime - startTime) / (1000 * 60)); // in minutes
    
    problem.finalProblem = finalProblem;
    problem.reasoning = reasoning;
    problem.status = 'completed';
    problem.endTime = endTime;
    problem.totalTimeSpent = totalTimeSpent;
    problem.updatedAt = endTime;
    
    problems.push(problem);
    
    // Add to CSV results
    allResults.push({
      timestamp: firstInteractionTime.toISOString(),
      sessionId: user.sessionId,
      studyGroup: user.studyGroup,
      academicLevel: user.demographicData.academicLevel,
      experience: user.demographicData.dataScienceExperience,
      seedProblem,
      initialProblem,
      finalProblem,
      reasoning,
      editorResponse: firstPromptType === 'editor' ? firstResponse : secondResponse,
      challengerResponse: firstPromptType === 'challenger' ? firstResponse : secondResponse,
      editorRating: firstPromptType === 'editor' ? firstRating : secondRating,
      challengerRating: firstPromptType === 'challenger' ? firstRating : secondRating,
      totalTimeSpent,
      completionTime: endTime.toISOString()
    });
    
    // Add delay between users
    await delay(1500);
  }
  
  // Save problems to database
  console.log('\n💾 Saving problems to database...');
  const savedProblems = await Problem.insertMany(problems);
  console.log(`✅ Created ${savedProblems.length} problems with interactions`);
  
  // Generate CSV export
  console.log('\n📊 Generating CSV export...');
  const csvHeader = 'timestamp,sessionId,studyGroup,academicLevel,experience,seedProblem,initialProblem,finalProblem,reasoning,editorResponse,challengerResponse,editorUsefulness,editorCognitiveLoad,editorSatisfaction,challengerUsefulness,challengerCognitiveLoad,challengerSatisfaction,totalTimeSpent,completionTime';
  
  const csvRows = [csvHeader];
  allResults.forEach(result => {
    const row = [
      result.timestamp,
      result.sessionId,
      result.studyGroup,
      result.academicLevel,
      result.experience,
      escapeCsv(result.seedProblem),
      escapeCsv(result.initialProblem),
      escapeCsv(result.finalProblem),
      escapeCsv(result.reasoning),
      escapeCsv(result.editorResponse),
      escapeCsv(result.challengerResponse),
      result.editorRating.usefulness,
      result.editorRating.cognitiveLoad,
      result.editorRating.satisfaction,
      result.challengerRating.usefulness,
      result.challengerRating.cognitiveLoad,
      result.challengerRating.satisfaction,
      result.totalTimeSpent,
      result.completionTime
    ].join(',');
    csvRows.push(row);
  });
  
  const csvContent = csvRows.join('\n');
  const exportPath = join(__dirname, '..', 'exports', 'realistic_synthetic_data.csv');
  
  // Ensure exports directory exists
  const exportsDir = join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  fs.writeFileSync(exportPath, csvContent);
  
  console.log('\n🎉 Realistic synthetic data generation complete!');
  console.log(`📁 CSV File: ${exportPath}`);
  console.log(`👥 Users: ${savedUsers.length}`);
  console.log(`📝 Problems: ${savedProblems.length}`);
  console.log(`🤖 AI Interactions: ${savedProblems.length * 2}`);
  console.log(`📅 Date range: April 24 - May 2, 2026`);
  console.log(`💾 Data saved to MongoDB`);
  
  // Show sample statistics
  const editorFirstCount = allResults.filter(r => r.studyGroup === 'editor-first').length;
  const challengerFirstCount = allResults.filter(r => r.studyGroup === 'challenger-first').length;
  const avgTimeSpent = allResults.reduce((sum, r) => sum + r.totalTimeSpent, 0) / allResults.length;
  
  console.log('\n📈 Sample Statistics:');
  console.log(`Editor-first group: ${editorFirstCount} participants`);
  console.log(`Challenger-first group: ${challengerFirstCount} participants`);
  console.log(`Average completion time: ${Math.round(avgTimeSpent)} minutes`);
  
  await mongoose.disconnect();
  console.log('📦 Disconnected from MongoDB');
};

// Run the generation
generateSyntheticData().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});