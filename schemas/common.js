const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');
const role = z.enum(['admin', 'member', 'banned', 'requesting']);
const appType = z.enum(['alumet', 'flashcard', 'mindmap']);
const reviewMode = z.enum(['sandbox', 'smart']);

const emptyBody = z.object({}).passthrough();
const objectIdParam = z.object({ id: objectId });

module.exports = { z, objectId, role, appType, reviewMode, emptyBody, objectIdParam };
