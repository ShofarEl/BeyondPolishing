import express from 'express';
import { body, validationResult } from 'express-validator';
import aiService from '../services/aiService.js';
import { authenticateUser } from '../middleware/auth.js';
import Problem from '../models/Problem.js';

const router = express.Router();

// Validation middleware
const validateProblemInput = [
  body('problemStatement')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Problem statement must be between 10 and 2000 characters'),
  body('userInput')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('User input must not exceed 1000 characters'),
  body('promptType')
    .isIn(['editor', 'challenger'])
    .withMessage('Prompt type must be either "editor" or "challenger"')
];

// Generate AI response
router.post('/generate', authenticateUser, validateProblemInput, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { problemStatement, userInput, promptType, problemId } = req.body;
    const userId = req.user.id;

    console.log('AI Generate Request:', {
      problemStatement: problemStatement?.substring(0, 50) + '...',
      promptType,
      problemId,
      userId: userId.toString()
    });

    // Find the problem document
    let problem;
    if (problemId) {
      problem = await Problem.findOne({ 
        problemId, 
        userId, 
        status: { $in: ['in-progress', 'completed'] }
      });
      
      console.log('Problem found:', problem ? 'YES' : 'NO');
      if (problem) {
        console.log('Problem details:', {
          problemId: problem.problemId,
          status: problem.status,
          currentInteractions: problem.interactions.length
        });
      }
      
      if (!problem) {
        console.log('Problem not found with criteria:', { problemId, userId, status: 'in-progress or completed' });
        return res.status(404).json({
          success: false,
          error: 'Problem not found or access denied'
        });
      }
    } else {
      console.log('No problemId provided in request');
    }

    // Generate AI response
    console.log('Generating AI response with service...');
    let aiResponse;
    if (promptType === 'editor') {
      console.log('Using editor mode');
      aiResponse = await aiService.generateEditorResponse(problemStatement, userInput);
    } else if (promptType === 'challenger') {
      console.log('Using challenger mode');
      aiResponse = await aiService.generateChallengerResponse(problemStatement, userInput);
    } else {
      console.log('Invalid prompt type:', promptType);
      return res.status(400).json({
        success: false,
        error: 'Invalid prompt type'
      });
    }

    console.log('AI service response:', {
      success: aiResponse.success,
      hasResponse: !!aiResponse.response,
      responseLength: aiResponse.response?.length,
      error: aiResponse.error
    });

    if (!aiResponse.success) {
      console.log('AI service failed:', aiResponse.error);
      return res.status(500).json({
        success: false,
        error: 'AI service error',
        details: aiResponse.error
      });
    }

    // Log the interaction if problem exists
    if (problem) {
      console.log('Adding interaction to problem...');
      console.log('AI Response data:', {
        success: aiResponse.success,
        response: aiResponse.response?.substring(0, 100) + '...',
        promptType: aiResponse.promptType,
        responseLength: aiResponse.response?.length,
        fullResponse: aiResponse.response // Add full response for debugging
      });
      
      const interactionData = {
        promptType,
        userInput: userInput || problemStatement,
        aiResponse: aiResponse.response,
        timeSpent: 0 // Will be updated by frontend
      };
      
      console.log('Interaction data to save:', {
        promptType: interactionData.promptType,
        userInput: interactionData.userInput?.substring(0, 50) + '...',
        aiResponse: interactionData.aiResponse?.substring(0, 100) + '...',
        aiResponseLength: interactionData.aiResponse?.length
      });
      
      problem.addInteraction(interactionData);
      
      console.log('Saving problem with new interaction...');
      await problem.save();
      console.log('Problem saved successfully. New interaction count:', problem.interactions.length);
      const lastInteraction = problem.interactions[problem.interactions.length - 1];
      console.log('Last interaction saved:', {
        interactionId: lastInteraction.interactionId,
        promptType: lastInteraction.promptType,
        aiResponseLength: lastInteraction.aiResponse?.length,
        aiResponsePreview: lastInteraction.aiResponse?.substring(0, 100) + '...',
        timestamp: lastInteraction.timestamp
      });
    } else {
      console.log('No problem found - interaction will not be saved');
    }

    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        promptType,
        timestamp: aiResponse.timestamp,
        model: aiResponse.model,
        interactionId: problem ? problem.interactions[problem.interactions.length - 1].interactionId : null
      }
    });

  } catch (error) {
    console.error('AI Route Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rate AI response
router.post('/rate', authenticateUser, [
  body('interactionId')
    .isMongoId()
    .withMessage('Valid interaction ID required'),
  body('ratings')
    .isObject()
    .withMessage('Ratings object required'),
  body('ratings.usefulness')
    .isInt({ min: 1, max: 5 })
    .withMessage('Usefulness rating must be between 1 and 5'),
  body('ratings.cognitiveLoad')
    .isInt({ min: 1, max: 5 })
    .withMessage('Cognitive load rating must be between 1 and 5'),
  body('ratings.satisfaction')
    .isInt({ min: 1, max: 5 })
    .withMessage('Satisfaction rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback must not exceed 500 characters')
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

    const { interactionId, ratings, feedback, wasAccepted } = req.body;
    const userId = req.user.id;

    // Find the problem with this interaction
    const problem = await Problem.findOne({
      userId,
      'interactions.interactionId': interactionId
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found'
      });
    }

    // Update the interaction with ratings
    const interaction = problem.interactions.find(
      int => int.interactionId === interactionId
    );

    if (interaction) {
      interaction.userRating = ratings;
      interaction.userFeedback = feedback || '';
      interaction.wasAccepted = wasAccepted || false;
      
      await problem.save();

      res.json({
        success: true,
        message: 'Rating saved successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Interaction not found in problem'
      });
    }

  } catch (error) {
    console.error('Rating Route Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get AI service statistics (for research)
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const stats = aiService.getPromptStatistics();
    
    // Add usage statistics from database
    const totalInteractions = await Problem.aggregate([
      { $unwind: '$interactions' },
      { $group: { _id: '$interactions.promptType', count: { $sum: 1 } } }
    ]);

    stats.usageStats = totalInteractions.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats Route Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
