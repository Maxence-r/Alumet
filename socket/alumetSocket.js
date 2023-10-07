const Alumet = require('../models/alumet');
const Post = require('../models/post');
module.exports = function (io) {
    io.on('connection', socket => {
        socket.on('joinAlumet', async (alumetId, userId) => {
            try {
                console.log('joinAlumet', alumetId, userId);
                const alumet = await Alumet.findOne({ _id: alumetId });
                if (!alumet) {
                    return;
                }
                if (alumet.isPrivate && (!req.connected || (!alumet.participants.includes(req.user.id) && !alumet.collaborators.includes(req.user.id) && alumet.owner != req.user.id))) {
                    return;
                }

                socket.join(alumetId);
                if (alumet.collaborators.includes(userId) || alumet.owner == userId) {
                    socket.join(`admin-${alumetId}`);
                }
            } catch (error) {
                console.error(error);
            }
        });
    });
};
