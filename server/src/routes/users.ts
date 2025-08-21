import express from 'express';
import { User } from '../models/User.js';
import { Alumet } from '../models/Alumet.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: req.user
  });
}));

// Get user profile by ID
router.get('/profile/:userId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId).select('-mail');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const allowedUpdates = ['name', 'lastname', 'subjects', 'notifications'];
  const updates = Object.keys(req.body)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj: any, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  const user = await User.findByIdAndUpdate(
    req.userId,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: user,
    message: 'Profile updated successfully'
  });
}));

// Search users
router.get('/search', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
      { lastname: { $regex: q, $options: 'i' } }
    ]
  })
  .select('name lastname username icon accountType')
  .limit(parseInt(limit as string))
  .sort({ username: 1 });

  res.json({
    success: true,
    data: users
  });
}));

// Get dashboard statistics
router.get('/dashboard-stats', asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Get user's alumets count
  const alumetsStats = await Alumet.aggregate([
    {
      $match: {
        'participants.userId': req.user._id
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        owned: {
          $sum: {
            $cond: [{ $eq: ['$owner', req.user._id] }, 1, 0]
          }
        }
      }
    }
  ]);

  const stats = {
    alumets: {
      total: alumetsStats[0]?.total || 0,
      owned: alumetsStats[0]?.owned || 0,
      participated: (alumetsStats[0]?.total || 0) - (alumetsStats[0]?.owned || 0),
      active: alumetsStats[0]?.total || 0, // Simplified for now
    },
    flashcards: {
      totalSets: 0, // TODO: Implement when flashcard model is ready
      totalCards: 0,
      dueForReview: 0,
      masteredCards: 0,
    },
    messages: {
      totalConversations: 0, // TODO: Implement when message model is ready
      unreadMessages: 0,
      totalMessages: 0,
    },
    homework: {
      assigned: 0, // TODO: Implement when homework model is ready
      completed: 0,
      overdue: 0,
      pending: 0,
    },
    files: {
      totalFiles: 0, // TODO: Implement when file model is ready
      totalSize: 0,
      recentUploads: 0,
    },
  };

  res.json({
    success: true,
    data: stats
  });
}));

export default router;