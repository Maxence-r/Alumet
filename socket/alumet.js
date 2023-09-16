module.exports = function (server) {
    const io = require('socket.io')(server);

    io.on('connection', socket => {
        socket.on('joinAlumet', async (alumetId, userId) => {
            try {
                const alumet = await Alumet.findOne({ _id: alumetId, collaborators: userId });
                if (!alumet) {
                    console.log(`User ${socket.id} attempted to join unauthorized room ${alumetId}`);
                    return;
                }
                socket.join(alumetId);
                console.log(`User ${socket.id} joined room ${alumetId}`);
            } catch (error) {
                console.error(error);
            }
        });
    });

    return io;
};
