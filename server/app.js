const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();
const axios = require('axios'); // Add at the top
const { Buffer } = require('buffer'); // Add at the top if not present

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST","UPDATE","DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/bitcollab";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Import and use room routes
const roomRoutes = require('./routes/rooms');
app.use('/api/rooms', roomRoutes);

// Import and use auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Socket.io logic for real-time room management
const Room = require('./models/Room');
const userSocketMap = {};

// Utility function for normalization
function normalizeId(id) {
  return typeof id === 'string' ? id.trim().toLowerCase() : id;
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Track userId <-> socket.id
  socket.on('register-user', ({ userId }) => {
    const normUserId = normalizeId(userId);
    userSocketMap[normUserId] = socket.id;
  });

  // Request to join room (pending approval)
  socket.on('request-join-room', async ({ roomCode, userId, username }) => {
    try {
      const normUserId = normalizeId(userId);
      const normUsername = typeof username === 'string' ? username.trim() : username;
      console.log('Request to join room:', { roomCode, userId: normUserId, username: normUsername });
      
      const room = await Room.findOne({ roomCode: roomCode.toUpperCase(), isActive: true });
      if (!room) {
        socket.emit('join-denied', { reason: 'Room not found or inactive' });
        return;
      }
      // Add to pendingRequests if not already present
      if (!room.pendingRequests.some(r => normalizeId(r.userId) === normUserId)) {
        room.pendingRequests.push({ userId: normUserId, username: normUsername });
        await room.save();
      }
      // Notify host
      const hostSocketId = userSocketMap[normalizeId(room.creator)];
      if (hostSocketId) {
        io.to(hostSocketId).emit('join-request', {
          roomCode: room.roomCode,
          userId: normUserId,
          username: normUsername
        });
      }
    } catch (err) {
      socket.emit('join-denied', { reason: 'Server error' });
    }
  });

  // Host approves join
  socket.on('approve-join', async ({ roomCode, userId }) => {
    try {
      const normUserId = normalizeId(userId);
      const room = await Room.findOne({ roomCode: roomCode.toUpperCase(), isActive: true });
      if (!room) return;
      // Find the pending request to get the username
      const pendingRequest = room.pendingRequests.find(r => normalizeId(r.userId) === normUserId);
      if (!pendingRequest) return;
      const username = pendingRequest.username;
      // Remove from pendingRequests
      room.pendingRequests = room.pendingRequests.filter(r => normalizeId(r.userId) !== normUserId);
      // Add to participants if not already present
      if (!room.participants.some(p => normalizeId(p.userId) === normUserId)) {
        room.participants.push({ 
          userId: normUserId, 
          username,
          joinedAt: new Date()
        });
      }
      await room.save();
      // Notify user
      const userSocketId = userSocketMap[normUserId];
      if (userSocketId) {
        io.to(userSocketId).emit('join-approved', { roomCode });
      }
      // Notify all in room about the new participant
      io.to(roomCode).emit('room-updated');
      io.to(roomCode).emit('participant-joined', { userId: normUserId, username });
    } catch (err) {}
  });

  // Host denies join
  socket.on('deny-join', async ({ roomCode, userId }) => {
    try {
      const normUserId = normalizeId(userId);
      const room = await Room.findOne({ roomCode: roomCode.toUpperCase(), isActive: true });
      if (!room) return;
      // Remove from pendingRequests
      room.pendingRequests = room.pendingRequests.filter(r => normalizeId(r.userId) !== normUserId);
      await room.save();
      // Notify user
      const userSocketId = userSocketMap[normUserId];
      if (userSocketId) {
        io.to(userSocketId).emit('join-denied', { reason: 'Host denied your request' });
      }
    } catch (err) {}
  });

  // Host removes participant
  socket.on('remove-participant', async ({ roomCode, userId }) => {
    try {
      const normUserId = normalizeId(userId);
      const room = await Room.findOne({ roomCode: roomCode.toUpperCase(), isActive: true });
      if (!room) return;
      room.participants = room.participants.filter(p => normalizeId(p.userId) !== normUserId);
      await room.save();
      // Notify user
      const userSocketId = userSocketMap[normUserId];
      if (userSocketId) {
        io.to(userSocketId).emit('removed-from-room', { roomCode });
      }
      // Notify all in room
      io.to(roomCode).emit('room-updated');
    } catch (err) {}
  });

  // Join/leave room for real-time updates
  socket.on('join-room', (roomCode) => {
    socket.join(roomCode);
  });
  socket.on('leave-room', async (roomCode) => {
    socket.leave(roomCode);
    // Get the user ID for this socket
    let userId = null;
    for (const [uid, sockId] of Object.entries(userSocketMap)) {
      if (sockId === socket.id) {
        userId = uid;
        break;
      }
    }
    if (userId) {
      const normUserId = normalizeId(userId);
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase(), isActive: true });
        if (room) {
          // Remove user from participants (including host)
          room.participants = room.participants.filter(p => normalizeId(p.userId) !== normUserId);
          room.lastActivity = new Date();
          // If no participants left, deactivate room
          if (room.participants.length === 0) {
            room.isActive = false;
          }
          await room.save();
          // Notify others in the room
          io.to(roomCode).emit('room-updated');
          io.to(roomCode).emit('participant-left', { userId: normUserId, username: normUserId });
        }
      } catch (err) {}
    }
  });

  // Real-time collaborative file editing events (no userId normalization needed)
  socket.on('file-changed', ({ roomCode, fileName, content }) => {
    socket.to(roomCode).emit('file-changed', { fileName, content });
  });
  socket.on('file-created', ({ roomCode, fileName, file }) => {
    socket.to(roomCode).emit('file-created', { fileName, file });
  });
  socket.on('file-deleted', ({ roomCode, fileName }) => {
    socket.to(roomCode).emit('file-deleted', { fileName });
  });

  socket.on("disconnect", () => {
    for (const [userId, sockId] of Object.entries(userSocketMap)) {
      if (sockId === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// Basic route
defaultPort = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Login route
app.get("/login", (req, res) => {
  res.send("Login page backend response");
});

// Signup route
app.get("/signup", (req, res) => {
  res.send("Signup page backend response");
});

// Replace the /api/execute endpoint with Piston API usage
app.post('/api/execute', async (req, res) => {
  const { language, code, input } = req.body;
  const languageMap = {
    python: 71,
    cpp: 54,
    c: 50,
    java: 62,
    javascript: 63,
  };
  const language_id = languageMap[language];
  if (!language_id) {
    return res.status(400).json({ error: 'Unsupported language' });
  }
  try {
    const encodedCode = Buffer.from(code).toString('base64');
    const encodedInput = Buffer.from(input || '').toString('base64');

    // Step 1: Create submission
    const submissionRes = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false&fields=*',
      {
        source_code: encodedCode,
        language_id,
        stdin: encodedInput
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      }
    );
    const token = submissionRes.data.token;

    // Step 2: Poll for result
    let result = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const resultRes = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`,
        {
          headers: {
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        }
      );
      if (resultRes.data.status && resultRes.data.status.id >= 3) {
        result = resultRes.data;
        break;
      }
    }
    if (!result) {
      return res.status(500).json({ error: 'Timed out waiting for code execution result.' });
    }
    const decode = (val) => val ? Buffer.from(val, 'base64').toString('utf-8') : '';
    res.json({
      output: decode(result.stdout),
      stderr: decode(result.stderr) || decode(result.compile_output) || decode(result.message) || ''
    });
  } catch (err) {
    console.error('Judge0 API error:', err);
    res.status(500).json({
      error: 'Code execution failed',
      details: err && (err.response?.data || err.message || err.toString())
    });
  }
});

server.listen(defaultPort, () => {
  console.log(`Server listening on port ${defaultPort}`);
});
