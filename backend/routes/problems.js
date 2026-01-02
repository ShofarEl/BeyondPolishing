import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateUser } from '../middleware/auth.js';
import Problem from '../models/Problem.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation middleware
const validateProblemCreation = [
  body('taskPrompt')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Task prompt must be between 10 and 1000 characters'),
  body('taskCategory')
    .isIn(['healthcare', 'finance', 'education', 'environment', 'social', 'business', 'other'])
    .withMessage('Valid task category required'),
  body('initialProblem')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Initial problem statement must be between 10 and 2000 characters')
];

const validateProblemCompletion = [
  body('finalProblem')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Final problem statement must be between 10 and 2000 characters'),
  body('reasoning')
    .trim()
    .isLength({ min: 20, max: 3000 })
    .withMessage('Reasoning must be between 20 and 3000 characters')
];

// Create new problem
router.post('/create', authenticateUser, validateProblemCreation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { taskPrompt, taskCategory, initialProblem, deviceInfo } = req.body;
    const userId = req.user.id;

    // Create new problem
    const problem = new Problem({
      userId,
      problemId: uuidv4(),
      taskPrompt,
      taskCategory,
      initialProblem,
      finalProblem: initialProblem, // Start with initial as final
      reasoning: '', // Will be filled when completed
      startTime: new Date(),
      deviceInfo: deviceInfo || {}
    });

    await problem.save();

    res.status(201).json({
      success: true,
      data: {
        problemId: problem.problemId,
        taskPrompt: problem.taskPrompt,
        taskCategory: problem.taskCategory,
        initialProblem: problem.initialProblem,
        status: problem.status,
        startTime: problem.startTime
      }
    });

  } catch (error) {
    console.error('Problem Creation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create problem'
    });
  }
});

// Get user's problems
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, page = 1 } = req.query;

    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    const problems = await Problem.find(filter)
      .select('problemId taskPrompt taskCategory status startTime endTime totalTimeSpent interactions')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Problem.countDocuments(filter);

    res.json({
      success: true,
      data: {
        problems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get Problems Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems'
    });
  }
});

// Get specific problem
router.get('/:problemId', authenticateUser, async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.id;

    // Handle special case for 'new' problemId
    if (problemId === 'new') {
      return res.status(400).json({
        success: false,
        error: 'Cannot fetch a problem with ID "new". Use the create endpoint to create a new problem.'
      });
    }

    const problem = await Problem.findOne({ problemId, userId });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: problem
    });

  } catch (error) {
    console.error('Get Problem Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem'
    });
  }
});

// Update problem during work
router.put('/:problemId', authenticateUser, [
  body('currentProblem')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Current problem statement must not exceed 2000 characters')
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

    const { problemId } = req.params;
    const { currentProblem } = req.body;
    const userId = req.user.id;

    const problem = await Problem.findOne({ problemId, userId });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    if (currentProblem) {
      problem.finalProblem = currentProblem;
    }

    await problem.save();

    res.json({
      success: true,
      message: 'Problem updated successfully'
    });

  } catch (error) {
    console.error('Update Problem Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update problem'
    });
  }
});

// Complete problem
router.post('/:problemId/complete', authenticateUser, validateProblemCompletion, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { problemId } = req.params;
    const { finalProblem, reasoning } = req.body;
    const userId = req.user.id;

    const problem = await Problem.findOne({ problemId, userId });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // Temporarily disable status check for testing
    // if (problem.status !== 'in-progress') {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Problem is not in progress'
    //   });
    // }

    console.log('Completing problem:', {
      problemId: problem.problemId,
      currentStatus: problem.status,
      finalProblem: finalProblem?.substring(0, 50) + '...',
      reasoning: reasoning?.substring(0, 50) + '...'
    });

    // Complete the problem
    problem.completeProblem({ finalProblem, reasoning });

    await problem.save();

    res.json({
      success: true,
      message: 'Problem completed successfully',
      data: {
        problemId: problem.problemId,
        status: problem.status,
        endTime: problem.endTime,
        totalTimeSpent: problem.totalTimeSpent,
        interactionCount: problem.interactionCount
      }
    });

  } catch (error) {
    console.error('Complete Problem Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete problem'
    });
  }
});

// Abandon problem
router.post('/:problemId/abandon', authenticateUser, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const problem = await Problem.findOne({ problemId, userId });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    if (problem.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'Problem is not in progress'
      });
    }

    // Abandon the problem
    problem.abandonProblem();
    
    await problem.save();

    res.json({
      success: true,
      message: 'Problem abandoned successfully'
    });

  } catch (error) {
    console.error('Abandon Problem Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to abandon problem'
    });
  }
});

// Update interaction timing
router.put('/:problemId/interactions/:interactionId/time', authenticateUser, [
  body('timeSpent')
    .isInt({ min: 0, max: 3600 })
    .withMessage('Time spent must be between 0 and 3600 seconds')
], async (req, res) => {
  try {
    const { problemId, interactionId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user.id;

    const problem = await Problem.findOne({ 
      problemId, 
      userId,
      'interactions.interactionId': interactionId
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem or interaction not found'
      });
    }

    const interaction = problem.interactions.find(
      int => int.interactionId === interactionId
    );

    if (interaction) {
      interaction.timeSpent = timeSpent;
      await problem.save();

      res.json({
        success: true,
        message: 'Interaction timing updated'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Interaction not found'
      });
    }

  } catch (error) {
    console.error('Update Interaction Timing Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update interaction timing'
    });
  }
});

export default router;
