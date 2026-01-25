require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const sessionsRoutes = require('./routes/sessions');
const shareRoutes = require('./routes/share');
const aiRoutes = require('./routes/ai');
const topicsRoutes = require('./routes/topics');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: true, // Allow all origins for now (debugging)
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/topics', topicsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Socket.io connection handling
const activeTimers = new Map(); // sessionId -> timer state
const sessionRooms = new Map(); // sessionId -> Set of socket ids

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a session room for real-time sync
  socket.on('join-session', ({ sessionId, userId }) => {
    socket.join(`session:${sessionId}`);

    if (!sessionRooms.has(sessionId)) {
      sessionRooms.set(sessionId, new Set());
    }
    sessionRooms.get(sessionId).add(socket.id);

    // Send current timer state if exists
    if (activeTimers.has(sessionId)) {
      socket.emit('timer-state', activeTimers.get(sessionId));
    }

    // Notify others in the room
    socket.to(`session:${sessionId}`).emit('user-joined', {
      socketId: socket.id,
      userId,
      participants: sessionRooms.get(sessionId).size
    });

    console.log(`User ${socket.id} joined session ${sessionId}`);
  });

  // Leave session room
  socket.on('leave-session', ({ sessionId }) => {
    socket.leave(`session:${sessionId}`);

    if (sessionRooms.has(sessionId)) {
      sessionRooms.get(sessionId).delete(socket.id);
      if (sessionRooms.get(sessionId).size === 0) {
        sessionRooms.delete(sessionId);
      }
    }

    socket.to(`session:${sessionId}`).emit('user-left', {
      socketId: socket.id,
      participants: sessionRooms.get(sessionId)?.size || 0
    });
  });

  // Timer controls
  socket.on('timer-start', ({ sessionId, duration, gameIndex }) => {
    const timerState = {
      isRunning: true,
      startTime: Date.now(),
      duration: duration, // in seconds
      currentGameIndex: gameIndex || 0,
      pausedAt: null
    };

    activeTimers.set(sessionId, timerState);
    io.to(`session:${sessionId}`).emit('timer-state', timerState);

    console.log(`Timer started for session ${sessionId}: ${duration}s`);
  });

  socket.on('timer-pause', ({ sessionId }) => {
    const timer = activeTimers.get(sessionId);
    if (timer && timer.isRunning) {
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      timer.isRunning = false;
      timer.pausedAt = timer.duration - elapsed;

      activeTimers.set(sessionId, timer);
      io.to(`session:${sessionId}`).emit('timer-state', timer);

      console.log(`Timer paused for session ${sessionId}`);
    }
  });

  socket.on('timer-resume', ({ sessionId }) => {
    const timer = activeTimers.get(sessionId);
    if (timer && !timer.isRunning && timer.pausedAt) {
      timer.isRunning = true;
      timer.startTime = Date.now();
      timer.duration = timer.pausedAt;
      timer.pausedAt = null;

      activeTimers.set(sessionId, timer);
      io.to(`session:${sessionId}`).emit('timer-state', timer);

      console.log(`Timer resumed for session ${sessionId}`);
    }
  });

  socket.on('timer-stop', ({ sessionId }) => {
    activeTimers.delete(sessionId);
    io.to(`session:${sessionId}`).emit('timer-stopped');

    console.log(`Timer stopped for session ${sessionId}`);
  });

  socket.on('timer-set-game', ({ sessionId, gameIndex }) => {
    const timer = activeTimers.get(sessionId);
    if (timer) {
      timer.currentGameIndex = gameIndex;
      activeTimers.set(sessionId, timer);
      io.to(`session:${sessionId}`).emit('timer-state', timer);
    }
  });

  // Game completion sync
  socket.on('game-completed', ({ sessionId, gameId, completed }) => {
    socket.to(`session:${sessionId}`).emit('game-completion-update', {
      gameId,
      completed
    });
  });

  // Chat/notes sync (for collaborative sessions)
  socket.on('session-note', ({ sessionId, gameId, note }) => {
    socket.to(`session:${sessionId}`).emit('note-update', {
      gameId,
      note
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove from all session rooms
    for (const [sessionId, sockets] of sessionRooms.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          sessionRooms.delete(sessionId);
        } else {
          io.to(`session:${sessionId}`).emit('user-left', {
            socketId: socket.id,
            participants: sockets.size
          });
        }
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io listening for connections`);
});

module.exports = { app, server, io };
