const Alumet = require('../models/alumet');
const Post = require('../models/post');
module.exports = function (io) {
    io.on('connection', socket => {
        socket.on('joinAlumet', async (alumetId, userId) => {
            try {
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
        socket.on('leaveAlumet', alumetId => {
            socket.leave(alumetId);
        });
        socket.on('movePost', async (alumetId, wallId, blockId, position) => {
            try {
                let post = await Post.findOne({ _id: blockId });
                const postDate = new Date(post.postDate);
                const currentDate = new Date();
                if (post.adminsOnly || postDate > currentDate) {
                    io.to(`admin-${alumetId}`).emit('movePost', wallId, blockId, position);
                } else {
                    io.to(alumetId).emit('movePost', wallId, blockId, position);
                }
            } catch (error) {
                console.error(error);
            }
        });
        socket.on('deletePost', async (alumetId, data) => {
            try {
                const postDate = new Date(data.postDate);
                const currentDate = new Date();
                const room = data.adminsOnly || postDate > currentDate ? `admin-${alumetId}` : alumetId;
                io.to(room).emit('deletePost', data);
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('addPost', async (alumetId, data) => {
            try {
                const postDate = new Date(data.postDate);
                const currentDate = new Date();
                const room = data.adminsOnly || postDate > currentDate ? `admin-${alumetId}` : alumetId;
                io.to(room).emit('addPost', data);
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('editPost', async (alumetId, data) => {
            try {
                const postDate = new Date(data.postDate);
                const currentDate = new Date();
                const room = data.adminsOnly || postDate > currentDate ? `admin-${alumetId}` : alumetId;
                io.to(room).emit('editPost', data);
            } catch (error) {
                console.error(error);
            }
        });
    });
};
