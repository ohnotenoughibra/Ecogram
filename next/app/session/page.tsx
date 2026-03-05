'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import GameDetail from '@/components/GameDetail';
import { useSessionStore, useGameStore } from '@/store';
import {
  Plus,
  Trash2,
  Clock,
  GripVertical,
  ChevronRight,
  X,
  ListChecks,
} from 'lucide-react';

export default function SessionPage() {
  const {
    sessions,
    activeSession,
    createSession,
    deleteSession,
    setActiveSession,
    removeGameFromSession,
    updateSession,
  } = useSessionStore();
  const getGameById = useGameStore((s) => s.getGameById);
  const selectGame = useGameStore((s) => s.selectGame);
  const [newSessionName, setNewSessionName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    createSession(newSessionName.trim());
    setNewSessionName('');
    setShowNewForm(false);
  };

  const totalDuration = (session: typeof activeSession) => {
    if (!session) return 0;
    return session.games.reduce((sum, sg) => {
      const game = getGameById(sg.gameId);
      return sum + (sg.roundMinutes || game?.duration || 3);
    }, 0);
  };

  return (
    <>
      <Navigation />
      <main className="pt-4 sm:pt-6 pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Sessions</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Build class plans from CLA games
              </p>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>

          {/* New session form */}
          {showNewForm && (
            <form
              onSubmit={handleCreate}
              className="mb-6 bg-card/50 border border-border/30 rounded-xl p-4 flex items-center gap-3 animate-in"
            >
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Session name (e.g., Tuesday Guard Class)"
                className="flex-1 px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session List */}
            <div className="lg:col-span-1 space-y-2">
              {sessions.length === 0 && !showNewForm && (
                <div className="text-center py-12 bg-card/30 border border-border/20 rounded-xl">
                  <ListChecks className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No sessions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a session and add games from the library
                  </p>
                </div>
              )}
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activeSession?.id === session.id
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-card/50 border-border/30 hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{session.name}</h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{session.games.length} games</span>
                    {session.games.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{totalDuration(session)}min
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Active Session Detail */}
            <div className="lg:col-span-2">
              {activeSession ? (
                <div className="bg-card/50 border border-border/30 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold">{activeSession.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {activeSession.games.length} games &middot; ~
                        {totalDuration(activeSession)}min total
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        deleteSession(activeSession.id);
                      }}
                      className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <textarea
                      value={activeSession.notes || ''}
                      onChange={(e) =>
                        updateSession(activeSession.id, {
                          notes: e.target.value,
                        })
                      }
                      placeholder="Session notes..."
                      className="w-full px-3 py-2 bg-secondary/30 border border-border/30 rounded-lg text-xs resize-none h-16 focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                  </div>

                  {/* Games List */}
                  {activeSession.games.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border/50 rounded-xl">
                      <p className="text-sm text-muted-foreground">
                        No games added yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Go to the Library and click + on any game card to add it
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeSession.games.map((sg, index) => {
                        const game = getGameById(sg.gameId);
                        if (!game) return null;
                        return (
                          <div
                            key={sg.gameId}
                            className="flex items-center gap-3 p-3 bg-secondary/20 border border-border/20 rounded-lg group"
                          >
                            <span className="text-xs text-muted-foreground w-5 text-center font-mono">
                              {index + 1}
                            </span>
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                            <button
                              onClick={() => selectGame(game)}
                              className="flex-1 text-left"
                            >
                              <p className="text-sm font-medium hover:text-primary transition-colors">
                                {game.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground capitalize">
                                {game.category}
                                {game.subcategory
                                  ? ` / ${game.subcategory}`
                                  : ''}
                              </p>
                            </button>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {sg.roundMinutes || game.duration || 3}m
                            </span>
                            <button
                              onClick={() =>
                                removeGameFromSession(
                                  activeSession.id,
                                  sg.gameId
                                )
                              }
                              className="p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-card/30 border border-border/20 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    Select a session to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <GameDetail />
    </>
  );
}
