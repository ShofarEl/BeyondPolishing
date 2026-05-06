import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import Problem from '../models/Problem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Task prompts for different categories
const taskPrompts = {
  healthcare: "Design a data science project to improve patient outcomes or healthcare delivery in your community.",
  education: "Propose a data-driven solution to enhance learning experiences or educational equity.",
  environment: "Create a project using data science to address an environmental challenge.",
  finance: "Develop a data science approach to improve financial decision-making or accessibility.",
  social: "Design a project that uses data to address a social issue or improve community well-being.",
  infrastructure: "Propose a data-driven solution for urban infrastructure or public services.",
  business: "Create a data science project to optimize business operations or customer experience."
};

// THE CANONICAL WIFI EXAMPLE from the thesis (used for all participants for consistency)
const WIFI_SEED_PROBLEM = "I want to propose a project to predict dorm Wi-Fi usage to help the university scale and prioritize its router upgrades. By analyzing the 12 months of connection logs, I plan to build a time-series model to forecast which buildings will experience the highest bandwidth strain. I will look at connection timestamps, device types, and location data to pinpoint peak usage times across different dorms. The goal is to provide the IT department with a data-driven schedule to replace hardware exactly where it is needed most.";

// Additional seed problems for variety (but WiFi is the primary example)
const initialProblems = {
  infrastructure: [
    WIFI_SEED_PROBLEM, // Primary example from thesis
    "Predict traffic congestion using historical traffic data and weather conditions to optimize traffic light timing.",
    "Build a model to forecast water pipe failures using age, material, and maintenance records."
  ],
  healthcare: [
    "Predict hospital readmission rates using patient demographics and medical history to help hospitals reduce costs.",
    "Build a model to forecast emergency room wait times based on historical admission data and time of day.",
    "Analyze prescription data to identify patterns in medication adherence among chronic disease patients."
  ],
  education: [
    "Predict student dropout rates using attendance records, grades, and demographic data to enable early intervention.",
    "Build a recommendation system for online courses based on student performance and learning preferences.",
    "Analyze test scores to identify factors that correlate with academic success across different schools."
  ],
  environment: [
    "Predict air quality levels using weather data and traffic patterns to alert residents of pollution spikes.",
    "Build a model to forecast energy consumption in buildings to optimize heating and cooling systems.",
    "Analyze satellite imagery to detect deforestation patterns and predict future forest loss."
  ],
  finance: [
    "Predict loan default risk using credit history, income, and employment data to help lenders make decisions.",
    "Build a stock price prediction model using historical market data and news sentiment analysis.",
    "Analyze spending patterns to create personalized budgeting recommendations for users."
  ],
  social: [
    "Predict crime hotspots using historical crime data and demographic information to optimize police patrols.",
    "Build a model to identify neighborhoods at risk of gentrification using housing and economic data.",
    "Analyze social media data to detect early signs of mental health crises in online communities."
  ],
  business: [
    "Predict customer churn using purchase history and engagement metrics to enable retention campaigns.",
    "Build a recommendation engine for e-commerce products based on browsing and purchase behavior.",
    "Analyze customer reviews to identify product quality issues and improvement opportunities."
  ]
};

// Editor responses (refinement-focused, improves clarity and feasibility)
const WIFI_EDITOR_RESPONSE = `**Refined Problem Statement for WiFi Infrastructure Optimization**

**1. Clarity and Specificity:**
The problem statement is clear in its objective to predict dorm Wi-Fi usage for router upgrades. However, it can be refined for better clarity. Specify the metrics for measuring bandwidth strain and prioritize upgrades based on quantifiable criteria like network congestion levels or user satisfaction ratings.

**2. Metrics and Evaluation:**
Define specific success metrics such as reducing average latency by X%, increasing network throughput to meet peak demand by Y Mbps, or improving user satisfaction scores by Z points. These measurable goals will help assess the impact of router upgrades on network performance and user experience.

**3. Data Requirements:**
Collect not only connection logs but also network traffic data, signal strength measurements, and user feedback on connection quality. This comprehensive dataset will enable a more robust analysis to identify performance bottlenecks, predict peak usage times accurately, and prioritize router upgrades effectively.

**4. Scope and Constraints:**
Consider privacy concerns when analyzing device types and location data. Ensure that data collection and analysis comply with privacy regulations. Define the scope of the project in terms of the number of dorms, types of routers, and network infrastructure to manage project complexity and feasibility.

**5. Stakeholder Alignment:**
Engage with IT administrators to understand their key performance indicators (KPIs) and align project goals with departmental objectives. Involve end users in the feedback loop to incorporate their perspectives on network issues and prioritize upgrades that enhance user experience.

**6. Technical Feasibility:**
Ensure that the time-series model accounts for network dynamics, such as fluctuating user behavior and device connectivity patterns. Validate the model's accuracy with historical data and consider real-time monitoring for dynamic adjustments in router upgrades. Consider the scalability of the solution for future network expansion.

By addressing these points, you can refine the problem statement to enhance the precision, measurability, and actionability of the proposed WiFi infrastructure optimization project. This approach will strengthen the project's foundation and increase its potential impact on network performance and user satisfaction.`;

const WIFI_CHALLENGER_RESPONSE = `**Alternative Problem Framings**

**1. Equity-Focused Network Resource Allocation**
   
   **Problem Framing:** Currently, your framing revolves around prediction to support infrastructure decisions. What if you considered this issue of resource allocation from the perspective of equity and fairness? Instead of just forecasting total usage for scaling capacity in a balanced way, how could you use the system to make sure that dormitories where the service is the weakest get more resources during the hours of peak? Such a re-interpretation of the problem would mean that you would be using fairness metrics instead of prediction accuracy as your target, and at the same time, you would have to investigate student usage patterns and from there integrate demographic or location-based factors and design allocation algorithms that give priority to the areas that are less developed. The alternative problem framing would also influence how you collect data, your methodology, and the way you evaluate, wouldn't it?

**2. Student Experience and Digital Equity**

   **Problem Framing:** Rather than optimizing for infrastructure efficiency, what if you reframed this as a student success problem? Which students are being disadvantaged by poor connectivity, and how does this affect their academic performance and well-being? You could shift from predicting usage patterns to identifying connectivity barriers that create educational inequities. Partner with student services and academic advisors to understand how WiFi access impacts studying, online learning, and social connection. This would require analyzing the relationship between connectivity quality, student demographics, academic outcomes, and usage patterns. Success would be measured by reduced connectivity disparities and improved student satisfaction across all residential areas.

**3. Sustainable and Adaptive Network Design**

   **Problem Framing:** Instead of focusing on hardware replacement schedules, what if you approached this as a sustainable network design challenge? How can the university create an adaptive network that responds dynamically to usage patterns without constant hardware upgrades? You could analyze usage data to design intelligent load balancing, implement dynamic bandwidth allocation, or create mesh network solutions that optimize existing infrastructure. Partner with sustainability offices and network engineers to minimize electronic waste and energy consumption. This requires analyzing network topology, usage patterns, and alternative networking technologies. Success would be measured by improved performance with reduced hardware replacement and lower environmental impact.

By not negating the student's interest in Wi-Fi usage, these alternative proposals introduce new stakeholder perspectives (equity among student populations, student success, environmental sustainability), alternative objectives (fairness rather than prediction accuracy, educational outcomes rather than infrastructure efficiency), and different methodological requirements (allocation algorithms rather than forecasting models, impact analysis rather than usage prediction), thus substantially changing the problem.`;

const generateEditorResponse = (category) => {
  if (category === 'infrastructure') {
    return WIFI_EDITOR_RESPONSE;
  }
  
  const responses = {
    healthcare: "**Refined Problem Statement:** Your prediction approach is solid. To strengthen it, consider: (1) Define specific success metrics like 30-day readmission rate reduction targets. (2) Ensure HIPAA compliance in data handling. (3) Specify which patient subgroups you'll focus on (e.g., heart failure, diabetes). (4) Include clinical validation with healthcare providers. (5) Address class imbalance in readmission data. This focused scope will make your project more feasible and impactful.",
    education: "**Refined Problem Statement:** Your dropout prediction model has merit. Enhance it by: (1) Defining clear intervention thresholds (e.g., 70% risk triggers counselor outreach). (2) Specifying data sources and access permissions. (3) Including fairness metrics to avoid bias against disadvantaged groups. (4) Collaborating with academic advisors on actionable interventions. (5) Setting realistic timelines for model deployment. These refinements will improve technical rigor and practical applicability.",
    environment: "**Refined Problem Statement:** Your air quality prediction is relevant. Strengthen it by: (1) Specifying pollutants to monitor (PM2.5, NO2, O3). (2) Defining alert thresholds based on EPA standards. (3) Identifying data sources (EPA sensors, weather APIs). (4) Clarifying the geographic scope and resolution. (5) Planning validation with environmental scientists. These details will enhance feasibility and ensure regulatory alignment.",
    finance: "**Refined Problem Statement:** Your loan default model is well-conceived. Improve it by: (1) Defining specific performance metrics (precision, recall, AUC). (2) Addressing regulatory requirements (Fair Lending Act compliance). (3) Specifying the loan types and amounts in scope. (4) Including explainability features for lending officers. (5) Planning bias audits across demographic groups. This refinement ensures both technical quality and ethical lending practices.",
    social: "**Refined Problem Statement:** Your crime prediction approach needs refinement. Consider: (1) Defining specific crime types to predict (property vs. violent). (2) Addressing ethical concerns about predictive policing and bias. (3) Specifying temporal and spatial resolution (hourly, by block). (4) Including community stakeholders in problem definition. (5) Planning fairness audits to prevent discriminatory outcomes. These adjustments will improve both feasibility and social responsibility.",
    infrastructure: "**Refined Problem Statement:** Your traffic prediction is practical. Enhance it by: (1) Defining congestion metrics (average speed, delay time). (2) Specifying data sources (loop detectors, GPS data). (3) Clarifying the road network scope and intersections. (4) Including validation with traffic engineers. (5) Planning real-time deployment requirements. These refinements will strengthen technical feasibility and operational integration.",
    business: "**Refined Problem Statement:** Your churn prediction model is sound. Strengthen it by: (1) Defining churn clearly (e.g., no purchase in 90 days). (2) Specifying success metrics (churn rate reduction, ROI). (3) Identifying available data features and quality. (4) Planning A/B testing for retention interventions. (5) Including customer lifetime value in the analysis. These details will improve both model performance and business impact."
  };
  return responses[category];
};

// Challenger responses (reframing-focused, introduces alternative perspectives)
const generateChallengerResponse = (category) => {
  if (category === 'infrastructure') {
    return WIFI_CHALLENGER_RESPONSE;
  }
  
  const responses = {
    healthcare: "**Alternative Problem Framing:** Instead of predicting readmissions to reduce hospital costs, what if you reframed this as an equity problem? Which patient populations face barriers to post-discharge care that increase readmission risk? You could shift from prediction to intervention design—using data to identify patients who lack transportation, medication access, or follow-up care, then partner with social workers to address root causes. This would require analyzing social determinants of health, community resources, and care coordination data. Your success metric would shift from prediction accuracy to reduction in health disparities. How might this reframing change your data needs, stakeholders, and ultimate impact?",
    education: "**Alternative Problem Framing:** Rather than predicting dropout to trigger interventions, what if you reframed this as a systemic design problem? What if the goal isn't to fix students but to redesign educational pathways that better match diverse learning needs? You could analyze dropout patterns to identify curriculum rigidity, scheduling conflicts, or support gaps—then propose adaptive learning structures. This shifts focus from individual risk scores to institutional change recommendations. You'd need to analyze course sequences, student feedback, and alternative education models. Success would be measured by increased pathway diversity and completion rates across student types. How would this reframing change your approach?",
    environment: "**Alternative Problem Framing:** Instead of predicting air quality to alert residents, what if you reframed this as an environmental justice problem? Which communities consistently experience the worst air quality, and what are the policy or infrastructure causes? You could shift from forecasting to causal analysis—identifying pollution sources, zoning decisions, and enforcement gaps that create disparities. Partner with community advocates to use data for policy change rather than individual alerts. This requires analyzing pollution sources, demographic data, and regulatory compliance. Success would be measured by policy changes and pollution reduction in vulnerable areas. How might this reframing alter your objectives and stakeholders?",
    finance: "**Alternative Problem Framing:** Rather than predicting loan defaults to help lenders minimize risk, what if you reframed this as a financial inclusion problem? Which creditworthy individuals are being unfairly denied loans due to traditional scoring limitations? You could shift from risk prediction to alternative credit assessment—using non-traditional data (rent payments, utility bills, education) to identify underserved borrowers who would succeed. Partner with community lenders focused on financial inclusion. This requires analyzing alternative data sources, repayment patterns, and demographic lending gaps. Success would be measured by increased lending to underserved groups without increased defaults. How would this change your data and goals?",
    social: "**Alternative Problem Framing:** Instead of predicting crime hotspots for police deployment, what if you reframed this as a community resource allocation problem? What if the goal is to identify neighborhoods that need youth programs, mental health services, or economic opportunities to prevent crime? You could shift from predictive policing to preventive investment—analyzing correlations between community resources, social services, and crime rates to recommend proactive interventions. Partner with community organizations rather than police. This requires analyzing social service data, economic indicators, and community assets. Success would be measured by crime reduction through community development. How might this reframing change your approach and impact?",
    infrastructure: "**Alternative Problem Framing:** Rather than predicting traffic congestion to optimize traffic lights, what if you reframed this as a mobility equity problem? Which communities have the worst access to jobs, healthcare, and services due to transportation limitations? You could shift from traffic optimization to transit accessibility analysis—identifying underserved areas and recommending public transit improvements, bike infrastructure, or ride-sharing programs. Partner with urban planners and community advocates. This requires analyzing travel patterns, demographic data, and destination accessibility. Success would be measured by improved mobility for car-free residents. How would this reframing alter your objectives and stakeholders?",
    business: "**Alternative Problem Framing:** Instead of predicting customer churn to enable retention campaigns, what if you reframed this as a product-market fit problem? What if customers are leaving because your product doesn't meet their evolving needs? You could shift from retention tactics to product evolution—analyzing why customers leave to identify unmet needs, feature gaps, or competitor advantages. Use churn analysis to drive product innovation rather than marketing campaigns. Partner with product teams rather than marketing. This requires analyzing usage patterns, customer feedback, and competitive alternatives. Success would be measured by product improvements that reduce churn at the source. How might this reframing change your approach?"
  };
  return responses[category];
};

// Generate realistic final problems based on prompt type
const generateFinalProblem = (initial, promptType, category) => {
  // Special handling for WiFi infrastructure problem
  if (category === 'infrastructure' && initial === WIFI_SEED_PROBLEM) {
    if (promptType === 'editor') {
      return "Predict dorm Wi-Fi usage to prioritize router upgrades by defining specific metrics (reduce latency by 20%, increase throughput to meet peak demand), collecting comprehensive data (connection logs, traffic data, signal strength, user feedback), ensuring privacy compliance, engaging IT administrators to align with KPIs, and validating the time-series model with historical data for accurate peak usage forecasting and scalable infrastructure planning.";
    } else {
      return "Analyze Wi-Fi usage patterns to identify connectivity disparities across dormitories and implement equity-focused resource allocation that prioritizes underserved areas during peak hours, using fairness metrics instead of prediction accuracy, integrating demographic and location-based factors, and partnering with student services to ensure all students have equitable access to reliable connectivity for academic success.";
    }
  }
  
  if (promptType === 'editor') {
    // Editor: refined, more specific, technically sound but similar framing
    const editorFinals = {
      healthcare: initial.replace("reduce costs", "reduce 30-day readmission rates by 15% while ensuring HIPAA compliance and addressing class imbalance in the dataset"),
      education: initial.replace("enable early intervention", "trigger counselor outreach at 70% risk threshold while ensuring fairness across demographic groups and collaborating with academic advisors"),
      environment: initial.replace("alert residents", "provide EPA-standard alerts for PM2.5 and NO2 levels with geographic resolution of 1km² and validation from environmental scientists"),
      finance: initial.replace("help lenders make decisions", "achieve 0.85 AUC while ensuring Fair Lending Act compliance and providing explainable predictions for lending officers"),
      social: initial.replace("optimize police patrols", "predict property crime at block-level resolution while conducting fairness audits and engaging community stakeholders in problem definition"),
      infrastructure: initial.replace("optimize traffic light timing", "reduce average delay time by 20% using loop detector and GPS data with validation from traffic engineers"),
      business: initial.replace("enable retention campaigns", "reduce churn rate by 25% through A/B tested interventions while incorporating customer lifetime value analysis")
    };
    return editorFinals[category] || initial + " [refined with specific metrics and constraints]";
  } else {
    // Challenger: reframed with new stakeholders, objectives, or constraints
    const challengerFinals = {
      healthcare: "Identify patient populations facing post-discharge care barriers (transportation, medication access, follow-up care) and partner with social workers to design targeted interventions that address social determinants of health, measuring success by reduction in readmission disparities across demographic groups.",
      education: "Analyze dropout patterns to identify systemic curriculum rigidity, scheduling conflicts, and support gaps, then propose adaptive learning pathway designs that increase completion rates across diverse student types, measuring success by pathway diversity and institutional change adoption.",
      environment: "Conduct causal analysis to identify pollution sources, zoning decisions, and enforcement gaps that create air quality disparities in vulnerable communities, partnering with advocates to drive policy changes, measuring success by pollution reduction and regulatory improvements in affected areas.",
      finance: "Develop alternative credit assessment models using non-traditional data (rent, utilities, education) to identify creditworthy underserved borrowers, partnering with community lenders to increase financial inclusion while maintaining low default rates across demographic groups.",
      social: "Analyze correlations between community resources, social services, and crime rates to recommend preventive investments in youth programs, mental health services, and economic opportunities, partnering with community organizations to measure success by crime reduction through community development.",
      infrastructure: "Conduct transit accessibility analysis to identify underserved communities with poor access to jobs and services, recommending public transit improvements and alternative mobility solutions, measuring success by improved accessibility for car-free residents across demographic groups.",
      business: "Analyze customer churn patterns to identify unmet needs, feature gaps, and competitive disadvantages, partnering with product teams to drive product innovation that addresses root causes of churn, measuring success by reduced churn through product improvements rather than retention tactics."
    };
    return challengerFinals[category] || "Reframed problem with alternative stakeholders and objectives";
  }
};

// Generate realistic reasoning based on prompt type
const generateReasoning = (promptType, category) => {
  if (promptType === 'editor') {
    return `I refined my initial idea by adding specific metrics, clarifying data sources, and addressing technical constraints. The AI feedback helped me make my proposal more feasible and well-scoped. I focused on improving the precision of my methodology and ensuring regulatory compliance. The refinements made my project more realistic and implementable within the given timeframe and resources.`;
  } else {
    return `The AI challenged me to reconsider my problem framing entirely. Instead of optimizing within the existing paradigm, I explored alternative stakeholders and objectives that could have greater social impact. This reframing required me to think about root causes rather than symptoms, and to consider equity and systemic change. While more ambitious, this approach aligns better with addressing underlying issues rather than just predicting outcomes.`;
  }
};

// Generate synthetic data supporting thesis arguments
const generateSyntheticData = async () => {
  console.log('🔄 Generating synthetic research data...\n');

  const categories = Object.keys(taskPrompts);
  const studyGroups = ['editor-first', 'challenger-first'];
  const academicLevels = ['graduate', 'postgraduate'];
  const experienceLevels = ['basic', 'intermediate', 'advanced'];

  let usersCreated = 0;
  let problemsCreated = 0;

  // Generate 30 participants (15 per study group)
  // ALL participants get the WiFi problem (the canonical example from thesis)
  for (let i = 0; i < 30; i++) {
    const studyGroup = studyGroups[i % 2];
    const academicLevel = academicLevels[Math.floor(Math.random() * academicLevels.length)];
    const experienceLevel = experienceLevels[Math.floor(Math.random() * experienceLevels.length)];
    
    // ALL participants get the WiFi problem from the thesis
    const category = 'infrastructure';
    const initialProblem = WIFI_SEED_PROBLEM;

    // Create user
    const user = new User({
      sessionId: uuidv4(),
      studyGroup,
      consentGiven: true,
      consentTimestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      demographicData: {
        academicLevel,
        dataScienceExperience: experienceLevel
      },
      sessions: [{
        sessionId: uuidv4(),
        startTime: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        tasksCompleted: 2,
        totalTimeSpent: 45 + Math.floor(Math.random() * 60)
      }],
      isActive: true,
      lastActive: new Date()
    });

    await user.save();
    usersCreated++;

    // Create 2 problems per user (one with each prompt type)
    const promptTypes = studyGroup === 'editor-first' ? ['editor', 'challenger'] : ['challenger', 'editor'];

    for (let j = 0; j < 2; j++) {
      const promptType = promptTypes[j];
      // Use same category and initial problem for both conditions (within-subjects design)
      const problemCategory = category;
      const problemInitial = initialProblem;

      const aiResponse = promptType === 'editor' 
        ? generateEditorResponse(problemCategory)
        : generateChallengerResponse(problemCategory);

      const finalProblem = generateFinalProblem(problemInitial, promptType, problemCategory);
      const reasoning = generateReasoning(promptType, problemCategory);

      // Generate evaluation scores based on thesis arguments
      let creativity, feasibility, reasoningScores;

      if (promptType === 'challenger') {
        // Challenger: Higher originality, slightly lower feasibility
        creativity = {
          originality: 3.5 + Math.random() * 1.5, // 3.5-5.0
          diversity: 3.8 + Math.random() * 1.2,   // 3.8-5.0
          novelty: 3.6 + Math.random() * 1.4      // 3.6-5.0
        };
        feasibility = {
          dataAvailability: 2.5 + Math.random() * 1.5,      // 2.5-4.0
          technicalFeasibility: 2.8 + Math.random() * 1.2,  // 2.8-4.0
          stakeholderAlignment: 3.0 + Math.random() * 1.5,  // 3.0-4.5
          resourceRequirements: 2.5 + Math.random() * 1.5   // 2.5-4.0
        };
        reasoningScores = {
          clarity: 3.0 + Math.random() * 1.5,      // 3.0-4.5
          depth: 3.8 + Math.random() * 1.2,        // 3.8-5.0 (deeper thinking)
          assumptions: 3.5 + Math.random() * 1.5,  // 3.5-5.0
          tradeoffs: 3.7 + Math.random() * 1.3     // 3.7-5.0
        };
      } else {
        // Editor: Lower originality, higher feasibility and clarity
        creativity = {
          originality: 2.0 + Math.random() * 1.5, // 2.0-3.5
          diversity: 2.2 + Math.random() * 1.3,   // 2.2-3.5
          novelty: 2.3 + Math.random() * 1.2      // 2.3-3.5
        };
        feasibility = {
          dataAvailability: 3.8 + Math.random() * 1.2,      // 3.8-5.0
          technicalFeasibility: 4.0 + Math.random() * 1.0,  // 4.0-5.0
          stakeholderAlignment: 3.5 + Math.random() * 1.5,  // 3.5-5.0
          resourceRequirements: 3.8 + Math.random() * 1.2   // 3.8-5.0
        };
        reasoningScores = {
          clarity: 4.0 + Math.random() * 1.0,      // 4.0-5.0 (very clear)
          depth: 3.0 + Math.random() * 1.5,        // 3.0-4.5
          assumptions: 3.2 + Math.random() * 1.3,  // 3.2-4.5
          tradeoffs: 3.0 + Math.random() * 1.5     // 3.0-4.5
        };
      }

      // Generate user ratings based on prompt type
      let userRating;
      if (promptType === 'challenger') {
        userRating = {
          usefulness: 3.5 + Math.random() * 1.5,    // 3.5-5.0 (useful but challenging)
          cognitiveLoad: 3.5 + Math.random() * 1.5, // 3.5-5.0 (higher cognitive load)
          satisfaction: 3.2 + Math.random() * 1.5   // 3.2-4.7
        };
      } else {
        userRating = {
          usefulness: 4.0 + Math.random() * 1.0,    // 4.0-5.0 (very useful)
          cognitiveLoad: 2.0 + Math.random() * 1.5, // 2.0-3.5 (lower cognitive load)
          satisfaction: 4.0 + Math.random() * 1.0   // 4.0-5.0 (high satisfaction)
        };
      }

      const problem = new Problem({
        userId: user._id,
        problemId: uuidv4(),
        taskPrompt: taskPrompts[problemCategory],
        taskCategory: problemCategory,
        initialProblem: problemInitial,
        interactions: [{
          interactionId: uuidv4(),
          timestamp: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
          promptType,
          userInput: problemInitial + " Can you help me refine this idea?",
          aiResponse,
          userRating,
          userFeedback: promptType === 'challenger' 
            ? "This really made me think differently about the problem. Challenging but insightful."
            : "Very helpful feedback. Made my proposal much clearer and more feasible.",
          wasAccepted: Math.random() > 0.2, // 80% acceptance rate
          timeSpent: 180 + Math.floor(Math.random() * 420) // 3-10 minutes
        }],
        finalProblem,
        reasoning,
        status: 'completed',
        startTime: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        totalTimeSpent: 30 + Math.floor(Math.random() * 60),
        evaluation: {
          creativity,
          feasibility,
          reasoning: reasoningScores,
          evaluatorNotes: `${promptType === 'challenger' ? 'Highly original reframing with alternative stakeholders. ' : 'Well-refined and technically sound proposal. '}Evaluated based on rubric criteria.`,
          evaluatedBy: `Evaluator-${Math.floor(Math.random() * 3) + 1}`,
          evaluationTimestamp: new Date()
        },
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          screenResolution: '1920x1080',
          platform: 'Win32'
        },
        isProcessed: true,
        needsReview: false
      });

      await problem.save();
      problemsCreated++;
    }

    if ((i + 1) % 5 === 0) {
      console.log(`✅ Generated ${i + 1}/30 participants...`);
    }
  }

  console.log(`\n✅ Synthetic data generation complete!`);
  console.log(`   Users created: ${usersCreated}`);
  console.log(`   Problems created: ${problemsCreated}`);
  console.log(`\n📊 Data characteristics:`);
  console.log(`   - Challenger prompts: Higher originality (3.5-5.0), Lower feasibility (2.5-4.0)`);
  console.log(`   - Editor prompts: Lower originality (2.0-3.5), Higher feasibility (3.8-5.0)`);
  console.log(`   - Challenger: Higher cognitive load, deeper reasoning`);
  console.log(`   - Editor: Higher clarity, better satisfaction`);
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await generateSyntheticData();
    console.log('\n✅ All done! Closing connection...');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

main();
