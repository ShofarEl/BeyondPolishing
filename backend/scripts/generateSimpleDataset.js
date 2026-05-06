import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Editor response (refinement-focused)
const editorResponse = `**Refined Problem Statement for Router Infrastructure Optimization**

**1. Clarity and Specificity:**
Your prediction approach is solid. To strengthen it, specify the metrics for measuring router strain and prioritize upgrades based on quantifiable criteria like network congestion levels, packet loss rates, or throughput degradation thresholds.

**2. Metrics and Evaluation:**
Define specific success metrics such as reducing average latency by 15-20%, increasing network throughput to meet peak demand by 30%, or improving uptime to 99.9%. These measurable goals will help assess the impact of router upgrades on network performance.

**3. Data Requirements:**
Collect not only traffic logs but also router performance metrics (CPU utilization, memory usage, error rates), historical upgrade records, and user complaint data. This comprehensive dataset will enable more robust analysis to identify performance bottlenecks and predict capacity issues accurately.

**4. Scope and Constraints:**
Define the scope clearly: number of routers to monitor, prediction timeframe (3-6 months ahead), and budget constraints for upgrades. Consider the lead time for hardware procurement and installation scheduling to make predictions actionable.

**5. Stakeholder Alignment:**
Engage with IT administrators and procurement teams to understand their key performance indicators (KPIs) and budget cycles. Align project goals with departmental objectives and ensure the prediction timeline matches procurement lead times.

**6. Technical Feasibility:**
Ensure that the time-series forecasting model accounts for network dynamics such as seasonal usage patterns, special events, and growth trends. Validate the model's accuracy with historical data and consider setting confidence intervals for predictions. Plan for model retraining as new data becomes available.

By addressing these points, you can refine the problem statement to enhance the precision, measurability, and actionability of the proposed router infrastructure optimization project.`;

// Challenger response (reframing-focused)
const challengerResponse = `**Alternative Problem Framings**

**1. Equity-Focused Network Resource Allocation**

**Problem Framing:** Currently, your framing revolves around prediction to support infrastructure decisions. What if you considered this issue of resource allocation from the perspective of equity and fairness? Instead of just forecasting which routers will fail first, how could you ensure that areas with the weakest service get priority for upgrades, even if they're not yet at critical capacity? This reframing would mean using fairness metrics instead of pure prediction accuracy as your target. You'd need to investigate usage patterns across different building types, user populations, and service levels, then design allocation algorithms that prioritize underserved areas. This alternative framing would influence your data collection (adding demographic and location-based equity factors), your methodology (fairness-aware optimization), and your evaluation criteria (measuring reduction in service disparities, not just prediction accuracy).

**2. User Experience and Digital Equity**

**Problem Framing:** Rather than optimizing for infrastructure efficiency, what if you reframed this as a user experience problem? Which users are being disadvantaged by poor network performance, and how does this affect their productivity and satisfaction? You could shift from predicting router failures to identifying connectivity barriers that create inequities in service quality. Partner with user support teams and department heads to understand how network performance impacts different user groups. This would require analyzing the relationship between network quality, user demographics, work patterns, and productivity metrics. Success would be measured by reduced performance disparities and improved user satisfaction across all areas, not just preventing outages.

**3. Sustainable and Cost-Effective Network Design**

**Problem Framing:** Instead of focusing on hardware replacement schedules, what if you approached this as a sustainable network optimization challenge? How can the organization create an adaptive network that responds dynamically to usage patterns without constant hardware upgrades? You could analyze usage data to design intelligent load balancing, implement dynamic traffic shaping, or optimize network topology to extend hardware lifespan. Partner with sustainability teams and finance to minimize electronic waste and total cost of ownership. This requires analyzing network architecture, usage patterns, and alternative optimization strategies (software solutions, configuration changes, traffic management). Success would be measured by improved performance with reduced hardware replacement frequency and lower environmental impact.

By not negating your interest in router capacity planning, these alternative proposals introduce new stakeholder perspectives (equity among user populations, user experience, environmental sustainability), alternative objectives (fairness rather than prediction accuracy, user satisfaction rather than infrastructure efficiency, sustainability rather than reactive replacement), and different methodological requirements (fairness algorithms rather than forecasting models, experience analysis rather than capacity prediction, optimization strategies rather than replacement schedules), thus substantially changing the problem.`;

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

// Generate CSV
const generateCSV = () => {
  const header = 'timestamp,seedProblem,editorResponse,challengerResponse';
  const rows = [header];

  seedProblems.forEach((seed, index) => {
    const row = [
      generateTimestamp(index),
      escapeCsv(seed),
      escapeCsv(editorResponse),
      escapeCsv(challengerResponse)
    ].join(',');
    rows.push(row);
  });

  return rows.join('\n');
};

// Write to file
const exportPath = join(__dirname, '..', 'exports', 'research_data_simple.csv');
const csvContent = generateCSV();
fs.writeFileSync(exportPath, csvContent);

console.log('✅ Simple research data exported!');
console.log(`   File: ${exportPath}`);
console.log(`   Records: 30`);
console.log(`   Columns: timestamp, seedProblem, editorResponse, challengerResponse`);
console.log(`   Date range: April 10 - May 2, 2026\n`);
