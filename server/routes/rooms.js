const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// Generate a random room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new room
router.post('/create', async (req, res) => {
  try {
    const { roomName, creator, maxParticipants = 10 } = req.body;

    if (!creator) {
      return res.status(400).json({ error: 'Creator name is required' });
    }

    // Generate unique room code
    let roomCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      roomCode = generateRoomCode();
      const existingRoom = await Room.findOne({ roomCode });
      if (!existingRoom) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique room code' });
    }

    // Create new room
    const room = new Room({
      roomCode,
      roomName: roomName || 'Untitled Room',
      creator,
      maxParticipants,
      participants: [{
        userId: creator,
        username: creator,
        joinedAt: new Date()
      }]
    });

    await room.save();

    res.status(201).json({
      success: true,
      room: {
        roomCode: room.roomCode,
        roomName: room.roomName,
        creator: room.creator,
        participants: room.participants,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join a room
router.post('/join', async (req, res) => {
  try {
    const { roomCode, userId, username } = req.body;

    if (!roomCode || !userId || !username) {
      return res.status(400).json({ error: 'Room code, user ID, and username are required' });
    }

    // Find room by code
    const room = await Room.findOne({ 
      roomCode: roomCode.toUpperCase(),
      isActive: true 
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    // Check if user is already in the room
    const existingParticipant = room.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      return res.status(200).json({
        success: true,
        message: 'Already in room',
        room: {
          roomCode: room.roomCode,
          roomName: room.roomName,
          creator: room.creator,
          participants: room.participants,
          maxParticipants: room.maxParticipants
        }
      });
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if user is the creator (host)
    if (room.creator === userId) {
      // If user is the creator, add them directly to participants
      room.participants.push({
        userId,
        username,
        joinedAt: new Date()
      });
      room.lastActivity = new Date();
      await room.save();

      return res.status(200).json({
        success: true,
        message: 'Successfully joined room as host',
        room: {
          roomCode: room.roomCode,
          roomName: room.roomName,
          creator: room.creator,
          participants: room.participants,
          maxParticipants: room.maxParticipants
        }
      });
    }

    // For non-creators, just return success - the actual joining will happen via socket.io approval
    res.status(200).json({
      success: true,
      message: 'Join request sent to host',
      room: {
        roomCode: room.roomCode,
        roomName: room.roomName,
        creator: room.creator,
        participants: room.participants,
        maxParticipants: room.maxParticipants
      }
    });

  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get room information
router.get('/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ 
      roomCode: roomCode.toUpperCase(),
      isActive: true 
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.status(200).json({
      success: true,
      room: {
        roomCode: room.roomCode,
        roomName: room.roomName,
        creator: room.creator,
        participants: room.participants,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }
    });

  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ error: 'Failed to get room information' });
  }
});

// Leave room
router.post('/leave', async (req, res) => {
  try {
    const { roomCode, userId } = req.body;

    if (!roomCode || !userId) {
      return res.status(400).json({ error: 'Room code and user ID are required' });
    }

    // Instead of modifying the room here, emit a socket event to handle leave logic in real time
    // (Assumes the client will emit 'leave-room' via socket.io as well)

    res.status(200).json({
      success: true,
      message: 'Leave event triggered, handled in real time via socket.io'
    });

  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// Get all active rooms (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .select('roomCode roomName creator participants maxParticipants createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      rooms
    });

  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

module.exports = router; 