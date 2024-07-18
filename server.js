const app = require("./app");

// messaging
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message.model');
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', async (username) => {
    socket.username = username;
    socket.join(username);
    console.log(`${username} joined their room`);

    try {
      const messages = await Message.find({ $or: [{ sender: username }, { recipient: username }] })
        .sort({ timestamp: -1 })
        .exec();
      const conversations = messages.reduce((acc, message) => {
        const otherUser = message.sender === username ? message.recipient : message.sender;
        if (!acc[otherUser]) acc[otherUser] = [];
        acc[otherUser].push(message);
        return acc;
      }, {});
      socket.emit('init', conversations);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('private message', async (msg) => {
    const newMessage = new Message({
      sender: socket.username, // Use the username stored in the socket
      recipient: msg.recipient,
      message: msg.message,
    });

    try {
      await newMessage.save();
      io.to(msg.recipient).emit('private message', newMessage); // Emit to recipient's room
      io.to(socket.username).emit('private message', newMessage); // Emit to sender's room
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// ℹ️ Sets the PORT for our app to have access to it. If no env has been set, we hard code it to 3000
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
