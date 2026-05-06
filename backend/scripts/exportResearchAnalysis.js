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

const exportResearchData = async () => {
  console.log('📊 Exporting research data for analysis...\n');

  const problems = await Problem.find({ status: 'completed' }).populate('userId');
  
  // Helper function to escape CSV fields
  const escapeCsv = (text) => {
    if (!text) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
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
    'problemId',
    'taskCategory',
    'promptType',
    'seedProblem',
    'aiResponse',
    'finalProblem',
    'reasoning',
    'originality',
    'diversity',
    'novelty',
    'dataAvailability',
    'technicalFeasibility',
    'stakeholderAlignment',
    'resourceRequirements',
    'clarity',
    'depth',
    'assumptions',
    'tradeoffs',
    'usefulness',
    'cognitiveLoad',
    'satisfaction',
    'timeSpent',
    'wasAccepted'
  ].join(',');

  const csvRows = [csvHeader];

  problems.forEach((problem, index) => {
    const user = problem.userId;
    const interaction = problem.interactions[0];
    
    const row = [
      `P${String(index + 1).padStart(3, '0')}`, // Anonymous participant ID
      user.studyGroup,
      user.demographicData.academicLevel,
      user.demographicData.dataScienceExperience,
      problem.problemId,
      problem.taskCategory,
      interaction?.promptType || 'unknown',
      escapeCsv(problem.initialProblem), // SEED PROBLEM
      escapeCsv(interaction?.aiResponse || ''), // AI RESPONSE (editor or challenger)
      escapeCsv(problem.finalProblem), // FINAL PROBLEM
      escapeCsv(problem.reasoning), // REASONING
      problem.evaluation.creativity.originality.toFixed(2),
      problem.evaluation.creativity.diversity.toFixed(2),
      problem.evaluation.creativity.novelty.toFixed(2),
      problem.evaluation.feasibility.dataAvailability.toFixed(2),
      problem.evaluation.feasibility.technicalFeasibility.toFixed(2),
      problem.evaluation.feasibility.stakeholderAlignment.toFixed(2),
      problem.evaluation.feasibility.resourceRequirements.toFixed(2),
      problem.evaluation.reasoning.clarity.toFixed(2),
      problem.evaluation.reasoning.depth.toFixed(2),
      problem.evaluation.reasoning.assumptions.toFixed(2),
      problem.evaluation.reasoning.tradeoffs.toFixed(2),
      interaction?.userRating?.usefulness?.toFixed(2) || '0',
      interaction?.userRating?.cognitiveLoad?.toFixed(2) || '0',
      interaction?.userRating?.satisfaction?.toFixed(2) || '0',
      problem.totalTimeSpent || 0,
      interaction?.wasAccepted ? 'TRUE' : 'FALSE'
    ].join(',');

    csvRows.push(row);
  });

  const csvContent = csvRows.join('\n');
  const exportPath = join(__dirname, '..', 'exports', 'research_analysis_data.csv');
  
  // Ensure exports directory exists
  const exportsDir = join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  fs.writeFileSync(exportPath, csvContent);
  console.log(`✅ Research data exported to: ${exportPath}`);
  console.log(`   Total records: ${problems.length}\n`);

  // Export summary statistics
  const editorProblems = problems.filter(p => p.interactions[0]?.promptType === 'editor');
  const challengerProblems = problems.filter(p => p.interactions[0]?.promptType === 'challenger');

  const calculateStats = (arr, field) => {
    const values = arr.map(field);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = values.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, median, min, max, stdDev };
  };

  const summaryStats = {
    editor: {
      originality: calculateStats(editorProblems, p => p.evaluation.creativity.originality),
      feasibility: calculateStats(editorProblems, p => p.evaluation.feasibility.technicalFeasibility),
      clarity: calculateStats(editorProblems, p => p.evaluation.reasoning.clarity),
      cognitiveLoad: calculateStats(editorProblems, p => p.interactions[0]?.userRating?.cognitiveLoad || 0)
    },
    challenger: {
      originality: calculateStats(challengerProblems, p => p.evaluation.creativity.originality),
      feasibility: calculateStats(challengerProblems, p => p.evaluation.feasibility.technicalFeasibility),
      clarity: calculateStats(challengerProblems, p => p.evaluation.reasoning.clarity),
      cognitiveLoad: calculateStats(challengerProblems, p => p.interactions[0]?.userRating?.cognitiveLoad || 0)
    }
  };

  const summaryPath = join(__dirname, '..', 'exports', 'summary_statistics.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaryStats, null, 2));
  console.log(`✅ Summary statistics exported to: ${summaryPath}\n`);

  // Create R script for statistical analysis
  const rScript = `# Statistical Analysis Script for Thesis Data
# Generated: ${new Date().toISOString()}

# Load required libraries
library(tidyverse)
library(effsize)
library(ggplot2)

# Load data
data <- read.csv("research_analysis_data.csv")

# Separate by prompt type
editor_data <- data %>% filter(promptType == "editor")
challenger_data <- data %>% filter(promptType == "challenger")

# ============================================================
# RQ1: Originality & Creativity
# ============================================================

# Paired t-test for originality
t_test_originality <- t.test(
  challenger_data$originality,
  editor_data$originality,
  paired = TRUE
)
print("Originality t-test:")
print(t_test_originality)

# Effect size (Cohen's d)
d_originality <- cohen.d(
  challenger_data$originality,
  editor_data$originality
)
print("Originality effect size:")
print(d_originality)

# ============================================================
# RQ2: Feasibility & Clarity
# ============================================================

# Paired t-test for technical feasibility
t_test_feasibility <- t.test(
  editor_data$technicalFeasibility,
  challenger_data$technicalFeasibility,
  paired = TRUE
)
print("Technical Feasibility t-test:")
print(t_test_feasibility)

# Paired t-test for clarity
t_test_clarity <- t.test(
  editor_data$clarity,
  challenger_data$clarity,
  paired = TRUE
)
print("Clarity t-test:")
print(t_test_clarity)

# ============================================================
# RQ3: Reasoning Quality
# ============================================================

# Paired t-test for depth of reasoning
t_test_depth <- t.test(
  challenger_data$depth,
  editor_data$depth,
  paired = TRUE
)
print("Reasoning Depth t-test:")
print(t_test_depth)

# ============================================================
# RQ4: Student Perceptions
# ============================================================

# Paired t-test for cognitive load
t_test_cogload <- t.test(
  challenger_data$cognitiveLoad,
  editor_data$cognitiveLoad,
  paired = TRUE
)
print("Cognitive Load t-test:")
print(t_test_cogload)

# Paired t-test for satisfaction
t_test_satisfaction <- t.test(
  editor_data$satisfaction,
  challenger_data$satisfaction,
  paired = TRUE
)
print("Satisfaction t-test:")
print(t_test_satisfaction)

# ============================================================
# Visualizations
# ============================================================

# Box plot for originality
ggplot(data, aes(x = promptType, y = originality, fill = promptType)) +
  geom_boxplot() +
  labs(title = "Originality by Prompt Type",
       x = "Prompt Type",
       y = "Originality Score (1-5)") +
  theme_minimal()
ggsave("originality_boxplot.png", width = 8, height = 6)

# Box plot for feasibility
ggplot(data, aes(x = promptType, y = technicalFeasibility, fill = promptType)) +
  geom_boxplot() +
  labs(title = "Technical Feasibility by Prompt Type",
       x = "Prompt Type",
       y = "Feasibility Score (1-5)") +
  theme_minimal()
ggsave("feasibility_boxplot.png", width = 8, height = 6)

# Scatter plot: Originality vs Feasibility
ggplot(data, aes(x = originality, y = technicalFeasibility, color = promptType)) +
  geom_point(size = 3, alpha = 0.6) +
  geom_smooth(method = "lm", se = TRUE) +
  labs(title = "Trade-off: Originality vs Technical Feasibility",
       x = "Originality Score",
       y = "Technical Feasibility Score") +
  theme_minimal()
ggsave("originality_vs_feasibility.png", width = 10, height = 6)

print("Analysis complete! Check output files for results.")
`;

  const rScriptPath = join(__dirname, '..', 'exports', 'statistical_analysis.R');
  fs.writeFileSync(rScriptPath, rScript);
  console.log(`✅ R analysis script exported to: ${rScriptPath}\n`);

  console.log('📊 Export Summary:');
  console.log(`   - CSV data: ${problems.length} records`);
  console.log(`   - Editor prompts: ${editorProblems.length}`);
  console.log(`   - Challenger prompts: ${challengerProblems.length}`);
  console.log(`   - Ready for statistical analysis in R, SPSS, or Python\n`);
};

const main = async () => {
  try {
    await connectDB();
    await exportResearchData();
    console.log('✅ Export complete! Closing connection...\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

main();
