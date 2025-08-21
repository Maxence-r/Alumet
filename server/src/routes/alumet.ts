import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Alumet } from '../models/Alumet.js';
import { User } from '../models/User.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Get alumets (with pagination and filtering)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('subject').optional().isString().withMessage('Subject must be a string'),
  query('type').optional().isIn(['alumet', 'flashcard', 'mindmap']).withMessage('Invalid type'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const { search, subject, type } = req.query;

  // Build query
  const query: any = {
    'participants.userId': req.user._id,
    'participants.status': { $ne: 3 } // Not banned
  };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (subject) {
    query.subject = subject;
  }

  if (type) {
    query.type = type;
  }

  const [alumets, total] = await Promise.all([
    Alumet.find(query)
      .populate('owner', 'name lastname username icon')
      .sort({ lastUsage: -1 })
      .skip(skip)
      .limit(limit),
    Alumet.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      data: alumets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    }
  });
}));

// Get single alumet
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  
  const alumet = await Alumet.findById(id)
    .populate('owner', 'name lastname username icon')
    .populate('participants.userId', 'name lastname username icon');

  if (!alumet) {
    return res.status(404).json({
      success: false,
      error: 'Workspace not found'
    });
  }

  // Check if user has access
  const userParticipant = alumet.getUserParticipant(req.userId!);
  if (!userParticipant && alumet.security === 'closed') {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: alumet
  });
}));

// Create new alumet
router.post('/', [
  body('title').trim().isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
  body('subject').isIn(['mathematics', 'french', 'history', 'geography', 'physics', 'biology', 'philosophy', 'english', 'technology', 'snt', 'nsi', 'language', 'other']).withMessage('Invalid subject'),
  body('security').isIn(['open', 'onpassword', 'closed']).withMessage('Invalid security setting'),
  body('password').optional().isLength({ max: 50 }).withMessage('Password must be less than 50 characters'),
  body('type').isIn(['alumet', 'flashcard', 'mindmap']).withMessage('Invalid type'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { title, description, subject, security, password, private: isPrivate, swiftchat, discovery, type } = req.body;

  // Validate password for password-protected alumets
  if (security === 'onpassword' && !password) {
    return res.status(400).json({
      success: false,
      error: 'Password is required for password-protected workspaces'
    });
  }

  // Hash password if provided
  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const alumet = new Alumet({
    title,
    description,
    owner: req.user._id,
    subject,
    security,
    password: hashedPassword,
    private: isPrivate || false,
    swiftchat: swiftchat !== false, // Default to true
    discovery: discovery || false,
    type: type || 'alumet',
  });

  await alumet.save();

  // Populate owner info
  await alumet.populate('owner', 'name lastname username icon');

  res.status(201).json({
    success: true,
    data: alumet,
    message: 'Workspace created successfully'
  });
}));

// Update alumet
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
  body('subject').optional().isIn(['mathematics', 'french', 'history', 'geography', 'physics', 'biology', 'philosophy', 'english', 'technology', 'snt', 'nsi', 'language', 'other']).withMessage('Invalid subject'),
  body('security').optional().isIn(['open', 'onpassword', 'closed']).withMessage('Invalid security setting'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { id } = req.params;
  const alumet = await Alumet.findById(id);

  if (!alumet) {
    return res.status(404).json({
      success: false,
      error: 'Workspace not found'
    });
  }

  // Check if user is owner or admin
  const userParticipant = alumet.getUserParticipant(req.userId!);
  if (!userParticipant || (userParticipant.status !== 0 && userParticipant.status !== 1)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  const allowedUpdates = ['title', 'description', 'subject', 'security', 'password', 'private', 'swiftchat', 'discovery'];
  const updates = Object.keys(req.body)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj: any, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  // Hash password if updated
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }

  Object.assign(alumet, updates);
  await alumet.save();

  res.json({
    success: true,
    data: alumet,
    message: 'Workspace updated successfully'
  });
}));

// Delete alumet
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const alumet = await Alumet.findById(id);

  if (!alumet) {
    return res.status(404).json({
      success: false,
      error: 'Workspace not found'
    });
  }

  // Check if user is owner
  if (alumet.owner.toString() !== req.userId) {
    return res.status(403).json({
      success: false,
      error: 'Only the owner can delete this workspace'
    });
  }

  await Alumet.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Workspace deleted successfully'
  });
}));

// Join alumet
router.post('/:id/join', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { password } = req.body;

  const alumet = await Alumet.findById(id);

  if (!alumet) {
    return res.status(404).json({
      success: false,
      error: 'Workspace not found'
    });
  }

  // Check if already a participant
  if (alumet.isUserParticipant(req.userId!)) {
    return res.status(400).json({
      success: false,
      error: 'Already a participant'
    });
  }

  // Check access permissions
  if (alumet.security === 'closed') {
    return res.status(403).json({
      success: false,
      error: 'This workspace is invite-only'
    });
  }

  if (alumet.security === 'onpassword') {
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password required'
      });
    }

    const isValidPassword = await bcrypt.compare(password, alumet.password!);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }
  }

  // Add user as participant
  alumet.addParticipant(req.userId!, 2); // Status 2 = regular user
  await alumet.save();

  res.json({
    success: true,
    data: alumet,
    message: 'Joined workspace successfully'
  });
}));

// Leave alumet
router.post('/:id/leave', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const alumet = await Alumet.findById(id);

  if (!alumet) {
    return res.status(404).json({
      success: false,
      error: 'Workspace not found'
    });
  }

  // Check if user is a participant
  if (!alumet.isUserParticipant(req.userId!)) {
    return res.status(400).json({
      success: false,
      error: 'Not a participant'
    });
  }

  // Owners cannot leave their own workspace
  if (alumet.owner.toString() === req.userId) {
    return res.status(400).json({
      success: false,
      error: 'Owners cannot leave their own workspace'
    });
  }

  // Remove user from participants
  alumet.removeParticipant(req.userId!);
  await alumet.save();

  res.json({
    success: true,
    message: 'Left workspace successfully'
  });
}));

// Get participants
router.get('/:id/participants', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const alumet = await Alumet.findById(id).populate('participants.userId', 'name lastname username icon accountType');

  if (!alumet) {
    return res.status(404).json({
      success: false,
      error: 'Workspace not found'
    });
  }

  // Check if user has access
  if (!alumet.isUserParticipant(req.userId!) && alumet.security === 'closed') {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: alumet.participants
  });
}));

// Update participant status
router.put('/:id/participants/:userId', [
  body('status').isInt({ min: 0, max: 4 }).withMessage('Invalid status')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { id, userId } = req.params;
  const { status } = req.body;

  const alumet = await Alumet.findById(id);

  if (!alumet) {
    return res.status(404).json({
      success: false,
      error: 'Workspace not found'
    });
  }

  // Check if current user has admin permissions
  const currentUserParticipant = alumet.getUserParticipant(req.userId!);
  if (!currentUserParticipant || (currentUserParticipant.status !== 0 && currentUserParticipant.status !== 1)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  // Cannot change owner status
  if (alumet.owner.toString() === userId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot change owner status'
    });
  }

  // Update participant status
  alumet.updateParticipantStatus(userId, status);
  await alumet.save();

  res.json({
    success: true,
    message: 'Participant status updated successfully'
  });
}));

export default router;