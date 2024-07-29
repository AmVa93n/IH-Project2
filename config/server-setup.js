const http = require('http');
const socketIo = require('socket.io');
const app = require('../app');

const server = http.createServer(app);
const io = socketIo(server);

// Initialize socket events
require('./live-events')(io);

module.exports = { server, io };