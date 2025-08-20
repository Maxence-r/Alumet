import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Generate flashcards with AI
router.post('/generate-flashcards', asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.status(501).json({
    success: false,
    error: 'AI flashcard generation not implemented yet'
  });
}));

// Summarize content
router.post('/summarize', asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.status(501).json({
    success: false,
    error: 'AI summarization not implemented yet'
  });
}));

export default router;