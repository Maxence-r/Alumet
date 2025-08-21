import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get notifications
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  });
}));

export default router;