const Account = require('../models/account');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

module.exports = function (server) {
    const io = require('socket.io')(server);

    io.on('connection', socket => {
        socket.on('joinChatRoom', async (conversationId, userId) => {
            try {
                const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
                if (!conversation) {
                    console.log(`User ${socket.id} attempted to join unauthorized room ${conversationId}`);
                    return;
                }
                socket.join(conversationId);
                console.log(`User ${socket.id} joined room ${conversationId}`);
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('leaveChatRoom', conversationId => {
            socket.leave(conversationId);
        });

        socket.on('joinDashboard', async userId => {
            try {
                const user = await Account.findOne({ _id: userId });
                if (!user) {
                    console.log(`User ${socket.id} attempted to join unauthorized room ${userId}`);
                    return;
                }
                socket.join(userId);
            } catch (error) {
                console.error(error);
            }
        });
        socket.on('message', async (conversationId, messageId, userId) => {
            try {
                const conversation = await Conversation.findOne({ _id: conversationId });
                if (!conversation) {
                    console.log(`User ${socket.id} attempted to send message to unauthorized room ${conversationId}`);
                    return;
                }
                const user = await Account.findOne({ _id: userId }, { name: 1, lastname: 1, icon: 1, isCertified: 1, accountType: 1, badges: 1, username: 1 });
                const message = await Message.findOne({ _id: messageId });
                const messageObject = { message, user };
                io.to(conversationId).emit('message', messageObject);
            } catch (error) {
                console.error(error);
            }
        });
    });

    return io;
};
