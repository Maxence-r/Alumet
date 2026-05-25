const Conversation = require('../models/conversation');
const logger = require('../utils/logger');

module.exports = function (io) {
    io.on('connection', socket => {
        socket.on('chat:room:join', async (conversationId, userId) => {
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    $or: [{ participants: userId }, { administrators: userId }, { owner: userId }],
                });
                if (!conversation) {
                    logger.warn(`User ${socket.id} attempted to join unauthorized room ${conversationId}`);
                    return;
                }
                socket.join(conversationId);
            } catch (error) {
                logger.error('Socket chat:room:join failed', error);
            }
        });

        socket.on('chat:room:leave', conversationId => {
            socket.leave(conversationId);
        });
    });
};
