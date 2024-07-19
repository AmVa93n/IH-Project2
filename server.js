const app = require("./app");

// messaging
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message.model');
const User = require('./models/User.model');
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', async (username) => {
    const userfromDB = await User.findOne({ username: username })
    socket.username = username;
    socket.join(username);
    console.log(`${username} joined their room`);

    try {
      const messages = await Message.find({ $or: [{ sender: userfromDB._id }, { recipient: userfromDB._id }] })
        .sort({ timestamp: 1 })
        .populate('sender recipient')
        .exec();

      const conversations = await messages.reduce(async (accPromise, message) => {
        const acc = await accPromise;
        const otherUserId = message.sender.username === username ? message.recipient._id : message.sender._id;
        const otherUser = message.sender.username === username ? message.recipient : message.sender;
        if (!acc[otherUserId]) {
          const userInfo = await User.findById(otherUser._id).lean().exec(); // Fetch additional user data
          acc[otherUserId] = { user: userInfo, messages: [] };
        }
        acc[otherUserId].messages.push(message);
        return acc;
      }, Promise.resolve({}));

      socket.emit('init', conversations);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('private message', async (msg) => {
    const senderfromDB = await User.findOne({ username: socket.username })
    const recipientFromDB = await User.findOne({ username: msg.recipient })
    const newMessage = new Message({
      sender: senderfromDB._id, // Use the username stored in the socket
      recipient: recipientFromDB._id,
      message: msg.message,
    });

    try {
      await newMessage.save();
      await newMessage.populate('sender recipient','username')
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
