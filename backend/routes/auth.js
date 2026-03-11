import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
  console.log(`Auth route accessed: ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '24h' // Shorter session for anonymous study
  });
};

// Test route to verify auth routes are mounted
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

// Anonymous participant registration - no email or participant ID needed
router.post('/register', [
  body('demographicData.academicLevel')
    .isIn(['undergraduate', 'graduate', 'postgraduate', 'other'])
    .withMessage('Valid academic level required'),
  body('demographicData.dataScienceExperience')
    .isIn(['none', 'basic', 'intermediate', 'advanced'])
    .withMessage('Valid data science experience level required'),
  body('studyGroup')
    .isIn(['editor-first', 'challenger-first'])
    .withMessage('Valid study group required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { demographicData, studyGroup } = req.body;

    // Generate anonymous session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create anonymous user session
    const user = new User({
      sessionId,
      studyGroup,
      demographicData: {
        academicLevel: demographicData.academicLevel,
        dataScienceExperience: demographicData.dataScienceExperience
      },
      consentGiven: true, // Immediate consent for anonymous study
      consentTimestamp: new Date()
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        sessionId: user.sessionId,
        studyGroup: user.studyGroup,
        token,
        message: 'Anonymous session started!'
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start new session
router.post('/session/start', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
    }

    const user = await User.findOne({ sessionId, isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Start new task session
    const taskSessionId = user.startNewSession();
    await user.save();

    res.json({
      success: true,
      data: {
        taskSessionId,
        sessionId: user.sessionId
      }
    });

  } catch (error) {
    console.error('Start Session Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }
});

// End current session
router.post('/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
    }

    const user = await User.findOne({ sessionId, isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // End current session
    user.endCurrentSession();
    await user.save();

    res.json({
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('End Session Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// Get session info
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const user = await User.findOne({ sessionId }).select(
      'sessionId studyGroup consentGiven isActive lastActive'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get Session Info Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session info'
    });
  }
});

export default router;
