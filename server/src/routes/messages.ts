import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get conversations
router.get('/conversations', asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: []
  });
}));

// Get single conversation
router.get('/conversations/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.status(404).json({
    success: false,
    error: 'Conversation not found'
  });
}));

// Get messages for conversation
router.get('/conversations/:id/messages', asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  });
}));

export default router;