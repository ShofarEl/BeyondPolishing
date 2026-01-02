import express from 'express';
import { body } from 'express-validator';
import { authenticateUser } from '../middleware/auth.js';
import User from '../models/User.js';
import Problem from '../models/Problem.js';

const router = express.Router();

// Admin authentication middleware (basic check for now)
const requireAdmin = (req, res, next) => {
  // In a real application, you'd have proper admin authentication
  // For now, we'll use a simple header check
  const adminKey = req.header('X-Admin-Key');
  
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
};

// Get study statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalParticipants,
      activeParticipants,
      withdrawnParticipants,
      totalProblems,
      completedProblems,
      abandonedProblems,
      totalInteractions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ withdrewFromStudy: true }),
      Problem.countDocuments(),
      Problem.countDocuments({ status: 'completed' }),
      Problem.countDocuments({ status: 'abandoned' }),
      Problem.aggregate([
        { $unwind: '$interactions' },
        { $count: 'total' }
      ])
    ]);

    // Get prompt type distribution
    const promptDistribution = await Problem.aggregate([
      { $unwind: '$interactions' },
      { $group: { _id: '$interactions.promptType', count: { $sum: 1 } } }
    ]);

    // Get task category distribution
    const categoryDistribution = await Problem.aggregate([
      { $group: { _id: '$taskCategory', count: { $sum: 1 } } }
    ]);

    // Get study group distribution
    const studyGroupDistribution = await User.aggregate([
      { $group: { _id: '$studyGroup', count: { $sum: 1 } } }
    ]);

    // Get average ratings
    const averageRatings = await Problem.aggregate([
      { $unwind: '$interactions' },
      { $match: { 'interactions.userRating': { $exists: true } } },
      { $group: {
        _id: '$interactions.promptType',
        avgUsefulness: { $avg: '$interactions.userRating.usefulness' },
        avgCognitiveLoad: { $avg: '$interactions.userRating.cognitiveLoad' },
        avgSatisfaction: { $avg: '$interactions.userRating.satisfaction' },
        count: { $sum: 1 }
      }}
    ]);

    res.json({
      success: true,
      data: {
        participants: {
          total: totalParticipants,
          active: activeParticipants,
          withdrawn: withdrawnParticipants,
          studyGroupDistribution
        },
        problems: {
          total: totalProblems,
          completed: completedProblems,
          abandoned: abandonedProblems,
          categoryDistribution
        },
        interactions: {
          total: totalInteractions[0]?.total || 0,
          promptDistribution,
          averageRatings
        }
      }
    });

  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Export all data for research analysis
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    // Get all users (anonymized)
    const users = await User.find({}, {
      participantId: 1,
      studyGroup: 1,
      consentGiven: 1,
      consentTimestamp: 1,
      demographicData: 1,
      recruitmentSource: 1,
      sessions: 1,
      isActive: 1,
      withdrewFromStudy: 1,
      withdrawalReason: 1,
      createdAt: 1,
      updatedAt: 1
    });

    // Get all problems with interactions
    const problems = await Problem.find({}, {
      problemId: 1,
      userId: 1,
      taskPrompt: 1,
      taskCategory: 1,
      initialProblem: 1,
      finalProblem: 1,
      reasoning: 1,
      status: 1,
      startTime: 1,
      endTime: 1,
      totalTimeSpent: 1,
      interactions: 1,
      evaluation: 1,
      deviceInfo: 1,
      createdAt: 1,
      updatedAt: 1
    });

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      users,
      problems,
      metadata: {
        totalUsers: users.length,
        totalProblems: problems.length,
        totalInteractions: problems.reduce((sum, p) => sum + p.interactions.length, 0)
      }
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="research_data.csv"');
      
      // Basic CSV export for problems
      const csvHeader = 'problemId,userId,taskCategory,status,totalTimeSpent,interactionCount\n';
      const csvData = problems.map(p => 
        `${p.problemId},${p.userId},${p.taskCategory},${p.status},${p.totalTimeSpent},${p.interactions.length}`
      ).join('\n');
      
      res.send(csvHeader + csvData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }

  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

// Get individual problem details for evaluation
router.get('/problems/:problemId', requireAdmin, async (req, res) => {
  try {
    const { problemId } = req.params;

    const problem = await Problem.findOne({ problemId })
      .populate('userId', 'participantId studyGroup demographicData');

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
    console.error('Get Problem Details Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem details'
    });
  }
});

// Update problem evaluation
router.put('/problems/:problemId/evaluate', requireAdmin, [
  body('evaluation')
    .isObject()
    .withMessage('Evaluation object required'),
  body('evaluatedBy')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Evaluator name required')
], async (req, res) => {
  try {
    const { problemId } = req.params;
    const { evaluation, evaluatedBy, notes } = req.body;

    const problem = await Problem.findOne({ problemId });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // Update evaluation
    problem.evaluation = {
      ...evaluation,
      evaluatedBy,
      evaluationTimestamp: new Date(),
      evaluatorNotes: notes || ''
    };

    await problem.save();

    res.json({
      success: true,
      message: 'Evaluation saved successfully'
    });

  } catch (error) {
    console.error('Update Evaluation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update evaluation'
    });
  }
});

// Get participants list
router.get('/participants', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;

    const filter = {};
    if (status === 'active') filter.isActive = true;
    if (status === 'withdrawn') filter.withdrewFromStudy = true;

    const participants = await User.find(filter)
      .select('participantId studyGroup consentGiven demographicData recruitmentSource isActive withdrewFromStudy createdAt lastActive')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        participants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get Participants Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch participants'
    });
  }
});

export default router;
