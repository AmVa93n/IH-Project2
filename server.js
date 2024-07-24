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

  socket.on('join', async (userId) => {
    const userfromDB = await User.findById(userId)
    socket.userId = userId;
    socket.join(userId);
    console.log(`${userfromDB.username} joined their room`);

    try {
      const Chats = await Chat.find({ participants: { $in: [userId] } })
      .populate({
        path: 'messages',
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
    const chat = await Chat.findById(msg.chatId)
    const newMessage = new Message({
      sender: socket.userId, // Use the username stored in the socket
      recipient: msg.recipient,
      message: msg.message,
    });

    try {
      await newMessage.save();
      chat.messages.push(newMessage._id);
      chat.lastMessageTimestamp = newMessage.timestamp;
      await chat.save();
      //await newMessage.populate('sender recipient','username')
      io.to(msg.recipient).emit('private message', newMessage); // Emit to recipient's room
      io.to(socket.userId).emit('private message', newMessage); // Emit to sender's room
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
