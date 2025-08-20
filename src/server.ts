import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
});

(app as any).set('socketio', io);
(global as any).io = io;

require('../socket/chatSocket')(io);
require('../socket/alumetSocket.js')(io);

const normalizePort = (val: string) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false as unknown as number;
};

const port = normalizePort(process.env.PORT || '3000') as number;
app.set('port', port);

const errorHandler = (error: any) => {
  if (error.syscall !== 'listen') throw error;
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

export default server;

