const Account = require('../models/account');

module.exports = function (io) {
    io.on('connection', socket => {
        socket.on('joinDashboard', async userId => {
            console.log(`User ${socket.id} joined room dashboard-${userId}`);
            try {
                const user = await Account.findOne({ _id: userId });
                if (!user) {
                    console.log(`User ${socket.id} attempted to join unauthorized room ${userId}`);
                    return;
                }
                socket.join(`dashboard-${userId}`);
            } catch (error) {
                console.error(error);
            }
        });
    });
};
