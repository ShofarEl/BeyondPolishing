import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Simplified registration for research participants
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required'),
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

    const { username, email, demographicData, studyGroup } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email address is already registered'
      });
    }

    // Use the study group selected by the user
    const assignedStudyGroup = studyGroup;

    // Generate unique participant ID
    const participantId = `P${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

    // Create new user with simplified data
    const user = new User({
      participantId,
      email,
      username,
      studyGroup: assignedStudyGroup,
      demographicData: {
        academicLevel: demographicData.academicLevel,
        dataScienceExperience: demographicData.dataScienceExperience
      },
      consentGiven: true, // Consent given during registration
      consentTimestamp: new Date()
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        participantId: user.participantId,
        username: user.username,
        studyGroup: user.studyGroup,
        token,
        message: 'Registration successful! Save your Participant ID for future logins.'
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Give consent
router.post('/consent', [
  body('participantId')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Valid participant ID required')
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

    const { participantId } = req.body;

    const user = await User.findOne({ participantId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    if (user.consentGiven) {
      return res.status(400).json({
        success: false,
        error: 'Consent already given'
      });
    }

    // Update consent
    user.consentGiven = true;
    user.consentTimestamp = new Date();
    user.lastActive = new Date();

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        participantId: user.participantId,
        email: user.email,
        username: user.username,
        studyGroup: user.studyGroup,
        token,
        consentGiven: true
      }
    });

  } catch (error) {
    console.error('Consent Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process consent'
    });
  }
});

// Simplified login for returning participants
router.post('/login', [
  body('participantId')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Valid participant ID required')
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

    const { participantId } = req.body;
    
    console.log('Login attempt for participantId:', participantId);

    // First, let's see if the user exists at all
    const userExists = await User.findOne({ participantId });
    console.log('User exists check:', userExists ? 'YES' : 'NO');
    if (userExists) {
      console.log('User details:', {
        participantId: userExists.participantId,
        isActive: userExists.isActive,
        consentGiven: userExists.consentGiven,
        email: userExists.email
      });
    }

    const user = await User.findOne({ 
      participantId, 
      isActive: true
    });

    if (!user) {
      console.log('User not found with login conditions');
      return res.status(404).json({
        success: false,
        error: 'Participant ID not found or account inactive'
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        participantId: user.participantId,
        username: user.username,
        studyGroup: user.studyGroup,
        consentGiven: user.consentGiven,
        token
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Start new session
router.post('/session/start', async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID required'
      });
    }

    const user = await User.findOne({ participantId, isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // Start new session
    const sessionId = user.startNewSession();
    await user.save();

    res.json({
      success: true,
      data: {
        sessionId,
        participantId: user.participantId
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
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID required'
      });
    }

    const user = await User.findOne({ participantId, isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
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

// Withdraw from study
router.post('/withdraw', [
  body('participantId')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Valid participant ID required'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
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

    const { participantId, reason } = req.body;

    const user = await User.findOne({ participantId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // Withdraw from study
    user.withdrawFromStudy(reason);
    await user.save();

    res.json({
      success: true,
      message: 'Successfully withdrew from study'
    });

  } catch (error) {
    console.error('Withdraw Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process withdrawal'
    });
  }
});

// Lookup participant by email
router.post('/lookup', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required')
], async (req, res) => {
  try {
    console.log('Lookup request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;
    console.log('Looking up email:', email);

    const user = await User.findOne({ email, isActive: true }).select(
      'participantId email username studyGroup consentGiven'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    res.json({
      success: true,
      data: {
        participantId: user.participantId,
        email: user.email,
        username: user.username,
        studyGroup: user.studyGroup,
        consentGiven: user.consentGiven,
        message: 'Account found! Use your Participant ID to log in.'
      }
    });

  } catch (error) {
    console.error('Lookup Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup account'
    });
  }
});

// Get participant info (for returning users)
router.get('/info', async (req, res) => {
  try {
    const { participantId } = req.query;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID required'
      });
    }

    const user = await User.findOne({ participantId }).select(
      'participantId studyGroup consentGiven isActive lastActive withdrewFromStudy'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get Info Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch participant info'
    });
  }
});

export default router;
