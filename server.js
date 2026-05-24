const http = require('http');
const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const server = http.createServer(app);
const io = require('socket.io')(server);
app.set('socketio', io);
global.io = io;
const chatSocket = require('./socket/chatSocket')(io);
const alumetSocket = require('./socket/alumetSocket.js')(io);

const normalizePort = val => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};
const port = normalizePort(config.server.port);
const host = config.server.host;
app.set('port', port);
app.set('host', host);

const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES':
            logger.error(bind + ' requires elevated privileges.');
            process.exit(1);
        case 'EADDRINUSE':
            logger.error(bind + ' is already in use.');
            process.exit(1);
        default:
            throw error;
    }
};

const shutdown = signal => {
    logger.info(`${signal} received. Closing HTTP server...`);
    server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
    });
};

server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : `${address.address}:${address.port}`;
    logger.info('Server ready on: ' + bind);
});

server.listen(port, host);

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
