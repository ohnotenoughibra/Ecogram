import { create } from 'zustand';
import { Session, SessionGame } from '@/types';

const STORAGE_KEY = 'cla-sessions';

function loadSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveSessions(sessions: Session[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

interface SessionStore {
  sessions: Session[];
  activeSession: Session | null;
  createSession: (name: string) => Session;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (session: Session | null) => void;
  addGameToSession: (sessionId: string, gameId: string) => void;
  removeGameFromSession: (sessionId: string, gameId: string) => void;
  reorderGames: (sessionId: string, games: SessionGame[]) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: loadSessions(),
  activeSession: null,

  createSession: (name) => {
    const session: Session = {
      id: crypto.randomUUID(),
      name,
      games: [],
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const sessions = [...state.sessions, session];
      saveSessions(sessions);
      return { sessions, activeSession: session };
    });
    return session;
  },

  updateSession: (id, updates) =>
    set((state) => {
      const sessions = state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      saveSessions(sessions);
      const activeSession =
        state.activeSession?.id === id
          ? { ...state.activeSession, ...updates }
          : state.activeSession;
      return { sessions, activeSession };
    }),

  deleteSession: (id) =>
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id);
      saveSessions(sessions);
      return {
        sessions,
        activeSession: state.activeSession?.id === id ? null : state.activeSession,
      };
    }),

  setActiveSession: (session) => set({ activeSession: session }),

  addGameToSession: (sessionId, gameId) =>
    set((state) => {
      const sessions = state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        if (s.games.some((g) => g.gameId === gameId)) return s;
        return {
          ...s,
          games: [
            ...s.games,
            { gameId, order: s.games.length, roundMinutes: 3 },
          ],
        };
      });
      saveSessions(sessions);
      const activeSession = sessions.find((s) => s.id === sessionId) || state.activeSession;
      return { sessions, activeSession };
    }),

  removeGameFromSession: (sessionId, gameId) =>
    set((state) => {
      const sessions = state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          games: s.games
            .filter((g) => g.gameId !== gameId)
            .map((g, i) => ({ ...g, order: i })),
        };
      });
      saveSessions(sessions);
      const activeSession = sessions.find((s) => s.id === sessionId) || state.activeSession;
      return { sessions, activeSession };
    }),

  reorderGames: (sessionId, games) =>
    set((state) => {
      const sessions = state.sessions.map((s) =>
        s.id === sessionId ? { ...s, games } : s
      );
      saveSessions(sessions);
      const activeSession = sessions.find((s) => s.id === sessionId) || state.activeSession;
      return { sessions, activeSession };
    }),
}));
