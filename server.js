const app = require("./app");

// messaging
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message.model');
const Chat = require('./models/Chat.model');
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
      const Chats = await Chat.find({ participants: { $in: [userfromDB._id] } })
      .populate({
        path: 'messages',
        populate: [
          { path: 'sender', select: 'username profilePic' },
          { path: 'recipient', select: 'username profilePic' }
        ],
        options: { sort: { timestamp: 1 } }
      })
      .populate({
        path: 'participants',
        select: 'username profilePic professional'
      })
      .sort({ lastMessageTimestamp: -1 })
      .lean()
      .exec();
      socket.emit('init', Chats);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('private message', async (msg) => {
    const senderfromDB = await User.findOne({ username: socket.username })
    const recipientFromDB = await User.findOne({ username: msg.recipient })
    const chat = await Chat.findById(msg.chatId)
    const newMessage = new Message({
      sender: senderfromDB._id, // Use the username stored in the socket
      recipient: recipientFromDB._id,
      message: msg.message,
    });

    try {
      await newMessage.save();
      chat.messages.push(newMessage._id);
      chat.lastMessageTimestamp = newMessage.timestamp;
      await chat.save();
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
