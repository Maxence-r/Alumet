const http = require('http');
const app = require('./app');
const server = http.createServer(app);
const io = require('socket.io')(server);

chatSocket = require('./socket/chatSocket')(io);
dashboardSocket = require('./socket/dashboardSocket.js')(io);
alumetSocket = require('./socket/alumetSocket.js')(io);

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
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
        default:
            throw error;
    }
};

server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
    console.log('Serveur prêt sur le port: ' + bind);
});

server.listen(port);

module.exports = io;
module.exports = server;
