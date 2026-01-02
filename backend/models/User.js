import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  // Research participant ID (anonymized)
  participantId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User contact info
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  
  // Basic info (for research tracking only)
  studyGroup: {
    type: String,
    enum: ['editor-first', 'challenger-first'],
    required: true
  },
  
  // Consent and participation
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
  
  // Session tracking
  sessions: [{
    sessionId: String,
    startTime: Date,
    endTime: Date,
    tasksCompleted: Number,
    totalTimeSpent: Number // in minutes
  }],
  
  // Research metadata
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
  
  // Account management
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: Date,
  
  // Withdrawal tracking
  withdrewFromStudy: {
    type: Boolean,
    default: false
  },
  withdrawalReason: String,
  withdrawalTimestamp: Date
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ participantId: 1, isActive: 1 });

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

userSchema.methods.withdrawFromStudy = function(reason = '') {
  this.withdrewFromStudy = true;
  this.withdrawalReason = reason;
  this.withdrawalTimestamp = new Date();
  this.isActive = false;
};

export default mongoose.model('User', userSchema);
