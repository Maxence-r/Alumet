const Conversation = require('../models/conversation');
const logger = require('../utils/logger');

module.exports = function (io) {
    io.on('connection', socket => {
        socket.on('joinChatRoom', async (conversationId, userId) => {
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
                logger.error('Socket joinChatRoom failed', error);
            }
        });

        socket.on('leaveChatRoom', conversationId => {
            socket.leave(conversationId);
        });
    });
};
