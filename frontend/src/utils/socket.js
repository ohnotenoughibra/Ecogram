import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io('/', {
    transports: ['websocket', 'polling'],
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Session room management
export const joinSession = (sessionId, userId) => {
  if (socket) {
    socket.emit('join-session', { sessionId, userId });
  }
};

export const leaveSession = (sessionId) => {
  if (socket) {
    socket.emit('leave-session', { sessionId });
  }
};

// Timer controls
export const startTimer = (sessionId, duration, gameIndex = 0) => {
  if (socket) {
    socket.emit('timer-start', { sessionId, duration, gameIndex });
  }
};

export const pauseTimer = (sessionId) => {
  if (socket) {
    socket.emit('timer-pause', { sessionId });
  }
};

export const resumeTimer = (sessionId) => {
  if (socket) {
    socket.emit('timer-resume', { sessionId });
  }
};

export const stopTimer = (sessionId) => {
  if (socket) {
    socket.emit('timer-stop', { sessionId });
  }
};

export const setTimerGame = (sessionId, gameIndex) => {
  if (socket) {
    socket.emit('timer-set-game', { sessionId, gameIndex });
  }
};

// Game completion sync
export const emitGameCompleted = (sessionId, gameId, completed) => {
  if (socket) {
    socket.emit('game-completed', { sessionId, gameId, completed });
  }
};

// Notes sync
export const emitSessionNote = (sessionId, gameId, note) => {
  if (socket) {
    socket.emit('session-note', { sessionId, gameId, note });
  }
};

// Event listeners helper
export const onTimerState = (callback) => {
  if (socket) {
    socket.on('timer-state', callback);
    return () => socket.off('timer-state', callback);
  }
  return () => {};
};

export const onTimerStopped = (callback) => {
  if (socket) {
    socket.on('timer-stopped', callback);
    return () => socket.off('timer-stopped', callback);
  }
  return () => {};
};

export const onUserJoined = (callback) => {
  if (socket) {
    socket.on('user-joined', callback);
    return () => socket.off('user-joined', callback);
  }
  return () => {};
};

export const onUserLeft = (callback) => {
  if (socket) {
    socket.on('user-left', callback);
    return () => socket.off('user-left', callback);
  }
  return () => {};
};

export const onGameCompletionUpdate = (callback) => {
  if (socket) {
    socket.on('game-completion-update', callback);
    return () => socket.off('game-completion-update', callback);
  }
  return () => {};
};

export const onNoteUpdate = (callback) => {
  if (socket) {
    socket.on('note-update', callback);
    return () => socket.off('note-update', callback);
  }
  return () => {};
};
