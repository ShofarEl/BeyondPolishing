import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const problemSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Problem identification
  problemId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Task information
  taskPrompt: {
    type: String,
    required: true
  },
  taskCategory: {
    type: String,
    enum: ['healthcare', 'finance', 'education', 'environment', 'social', 'business', 'other'],
    required: true
  },
  
  // User's initial problem statement
  initialProblem: {
    type: String,
    required: true
  },
  
  // AI interaction history
  interactions: [{
    interactionId: String,
    timestamp: Date,
    promptType: {
      type: String,
      enum: ['editor', 'challenger']
    },
    userInput: String,
    aiResponse: String,
    userRating: {
      usefulness: Number, // 1-5 scale
      cognitiveLoad: Number, // 1-5 scale (1=low, 5=high)
      satisfaction: Number // 1-5 scale
    },
    userFeedback: String,
    wasAccepted: Boolean, // Did user incorporate the suggestion?
    timeSpent: Number // seconds spent on this interaction
  }],
  
  // Final problem statement
  finalProblem: {
    type: String,
    required: true
  },
  
  // User's reasoning/rationale (optional until completion)
  reasoning: {
    type: String,
    required: false,
    default: ''
  },
  
  // Completion status
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  
  // Timing data
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  totalTimeSpent: Number, // in minutes
  
  // Research metrics (to be filled by evaluators)
  evaluation: {
    creativity: {
      originality: Number, // 1-5 scale
      diversity: Number, // 1-5 scale
      novelty: Number // 1-5 scale
    },
    feasibility: {
      dataAvailability: Number, // 1-5 scale
      technicalFeasibility: Number, // 1-5 scale
      stakeholderAlignment: Number, // 1-5 scale
      resourceRequirements: Number // 1-5 scale
    },
    reasoning: {
      clarity: Number, // 1-5 scale
      depth: Number, // 1-5 scale
      assumptions: Number, // 1-5 scale
      tradeoffs: Number // 1-5 scale
    },
    evaluatorNotes: String,
    evaluatedBy: String,
    evaluationTimestamp: Date
  },
  
  // Metadata
  deviceInfo: {
    userAgent: String,
    screenResolution: String,
    platform: String
  },
  
  // Flags for data processing
  isProcessed: {
    type: Boolean,
    default: false
  },
  needsReview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
problemSchema.index({ userId: 1, status: 1 });
problemSchema.index({ problemId: 1 });
problemSchema.index({ 'interactions.promptType': 1 });
problemSchema.index({ taskCategory: 1 });
problemSchema.index({ createdAt: -1 });

// Virtual for interaction count
problemSchema.virtual('interactionCount').get(function() {
  return this.interactions.length;
});

// Virtual for primary prompt type used
problemSchema.virtual('primaryPromptType').get(function() {
  const promptCounts = this.interactions.reduce((acc, interaction) => {
    acc[interaction.promptType] = (acc[interaction.promptType] || 0) + 1;
    return acc;
  }, {});
  
  return Object.keys(promptCounts).reduce((a, b) => 
    promptCounts[a] > promptCounts[b] ? a : b, 'editor'
  );
});

// Methods
problemSchema.methods.addInteraction = function(interactionData) {
  this.interactions.push({
    interactionId: uuidv4(),
    timestamp: new Date(),
    ...interactionData
  });
};

problemSchema.methods.completeProblem = function(finalData) {
  this.status = 'completed';
  this.endTime = new Date();
  this.totalTimeSpent = Math.round(
    (this.endTime - this.startTime) / (1000 * 60)
  );
  this.finalProblem = finalData.finalProblem;
  this.reasoning = finalData.reasoning;
};

problemSchema.methods.abandonProblem = function() {
  this.status = 'abandoned';
  this.endTime = new Date();
  this.totalTimeSpent = Math.round(
    (this.endTime - this.startTime) / (1000 * 60)
  );
};

export default mongoose.model('Problem', problemSchema);
