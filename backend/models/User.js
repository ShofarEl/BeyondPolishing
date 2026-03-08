import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  // Anonymous session ID (no personal identifiers)
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Study group assignment
  studyGroup: {
    type: String,
    enum: ['editor-first', 'challenger-first'],
    required: true
  },
  
  // Consent (given immediately for anonymous study)
  consentGiven: {
    type: Boolean,
    default: true,
    required: true
  },
  consentTimestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Task session tracking
  sessions: [{
    sessionId: String,
    startTime: Date,
    endTime: Date,
    tasksCompleted: Number,
    totalTimeSpent: Number // in minutes
  }],
  
  // Research metadata (anonymous demographics)
  demographicData: {
    academicLevel: {
      type: String,
      enum: ['undergraduate', 'graduate', 'postgraduate', 'other'],
      required: true
    },
    dataScienceExperience: {
      type: String,
      enum: ['none', 'basic', 'intermediate', 'advanced'],
      required: true
    }
  },
  
  // Session management
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ sessionId: 1, isActive: 1 });

// Virtual for current session
userSchema.virtual('currentSession').get(function() {
  return this.sessions.find(session => !session.endTime);
});

// Methods
userSchema.methods.startNewSession = function() {
  const sessionId = uuidv4();
  this.sessions.push({
    sessionId,
    startTime: new Date(),
    tasksCompleted: 0
  });
  return sessionId;
};

userSchema.methods.endCurrentSession = function() {
  const currentSession = this.currentSession;
  if (currentSession) {
    currentSession.endTime = new Date();
    currentSession.totalTimeSpent = Math.round(
      (currentSession.endTime - currentSession.startTime) / (1000 * 60)
    );
  }
};

userSchema.methods.incrementTasksCompleted = function() {
  const currentSession = this.currentSession;
  if (currentSession) {
    currentSession.tasksCompleted += 1;
  }
};

export default mongoose.model('User', userSchema);
