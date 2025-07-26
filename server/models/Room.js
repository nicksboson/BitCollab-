const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  roomName: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Room'
  },
  creator: {
    type: String,
    required: true,
    trim: true
  },
  participants: [{
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pendingRequests: [{
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxParticipants: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
roomSchema.index({ roomCode: 1 });
roomSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Room', roomSchema); 