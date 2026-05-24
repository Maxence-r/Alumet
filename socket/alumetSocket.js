const Alumet = require('../models/alumet');
const Account = require('../models/account');
const { verifyJwt } = require('../utils/auth');
const logger = require('../utils/logger');

// security authentification mecanism, to be changed

module.exports = function (io) {
    io.on('connection', socket => {
        const cookies = socket.handshake.headers.cookie?.split('; ');
        const token = cookies?.find(cookie => cookie.startsWith('token='))?.split('=')[1];
        socket.on('joinAlumet', async alumetId => {
            try {
                const alumet = await Alumet.findOne({ _id: alumetId });
                if (!alumet) {
                    return;
                }
                if (alumet.private && !token) {
                    return;
                } else if (!alumet.private && !token) {
                    socket.join(alumetId);
                    return;
                }
                if (token) {
                    try {
                        const decoded = verifyJwt(token);
                        const account = await Account.findOne({ _id: decoded.userId });
                        if (!account) {
                            return;
                        }
                        if (alumet.private && (!account || (!alumet.participants.some(p => p.userId === account.id) && alumet.owner != account.id))) {
                            return;
                        }
                        socket.join(alumetId);
                        if (alumet.participants.some(p => p.userId === account._id.toString() && p.status === 1) || alumet.owner == account._id.toString()) {
                            socket.join(`admin-${alumetId}`);
                        }
                    } catch (error) {
                        logger.warn('Socket Alumet authentication failed', error.message);
                    }
                }
            } catch (error) {
                logger.error('Socket joinAlumet failed', error);
            }
        });
    });
};
