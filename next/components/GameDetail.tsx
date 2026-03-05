'use client';

import { useGameStore, useSessionStore } from '@/store';
import { CATEGORY_COLORS } from '@/types';
import {
  X,
  Clock,
  Target,
  Shield,
  Trophy,
  Lightbulb,
  ArrowRight,
  Plus,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { useEffect } from 'react';

export default function GameDetail() {
  const { selectedGame, selectGame, getGameById, deleteGame } = useGameStore();
  const { activeSession, addGameToSession } = useSessionStore();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectGame(null);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selectGame]);

  if (!selectedGame) return null;

  const game = selectedGame;
  const categoryClass = CATEGORY_COLORS[game.category] || '';
  const progressions = (game.progressionIds || [])
    .map((id) => getGameById(id))
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={() => selectGame(null)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-2xl max-h-[90vh] bg-background border border-border/50 rounded-t-2xl sm:rounded-2xl overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border/30 px-6 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{game.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${categoryClass}`}
              >
                {game.category}
              </span>
              {game.subcategory && (
                <span className="text-xs text-muted-foreground capitalize">
                  {game.subcategory}
                </span>
              )}
              {game.duration && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {game.duration} min rounds
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeSession && (
              <button
                onClick={() => addGameToSession(activeSession.id, game.id)}
                className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-medium rounded-lg hover:bg-primary/30 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Session
              </button>
            )}
            <button
              onClick={() => selectGame(null)}
              className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Starting Position */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Starting Position
            </p>
            <p className="text-sm">{game.startingPosition}</p>
          </div>

          {/* Players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player A */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-400">
                  {game.playerA.label}
                </h4>
              </div>
              <p className="text-sm mb-3">{game.playerA.objective}</p>
              {game.playerA.constraints.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Constraints
                  </p>
                  <ul className="space-y-1">
                    {game.playerA.constraints.map((c, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <Shield className="w-3 h-3 shrink-0 mt-0.5 text-blue-400/60" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Player B */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-semibold text-orange-400">
                  {game.playerB.label}
                </h4>
              </div>
              <p className="text-sm mb-3">{game.playerB.objective}</p>
              {game.playerB.constraints.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Constraints
                  </p>
                  <ul className="space-y-1">
                    {game.playerB.constraints.map((c, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <Shield className="w-3 h-3 shrink-0 mt-0.5 text-orange-400/60" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Win Conditions */}
          <div className="bg-card/50 border border-border/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h4 className="text-sm font-semibold">Win Conditions</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-medium text-blue-400 uppercase tracking-wide mb-1">
                  {game.playerA.label} wins when:
                </p>
                <ul className="space-y-1">
                  {game.winConditions.playerA.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">&#8226;</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-medium text-orange-400 uppercase tracking-wide mb-1">
                  {game.playerB.label} wins when:
                </p>
                <ul className="space-y-1">
                  {game.winConditions.playerB.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-orange-400 mt-0.5">&#8226;</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Scaling Focuses */}
          {game.scalingFocuses && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold">Scaling Focuses</h4>
              </div>
              <div className="space-y-2">
                {game.scalingFocuses.beginner && (
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px] font-medium shrink-0">
                      Beginner
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {game.scalingFocuses.beginner}
                    </p>
                  </div>
                )}
                {game.scalingFocuses.intermediate && (
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[10px] font-medium shrink-0">
                      Intermediate
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {game.scalingFocuses.intermediate}
                    </p>
                  </div>
                )}
                {game.scalingFocuses.advanced && (
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-medium shrink-0">
                      Advanced
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {game.scalingFocuses.advanced}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coaching Notes */}
          {game.coachingNotes && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Coaching Notes</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {game.coachingNotes}
              </p>
            </div>
          )}

          {/* Progressions */}
          {progressions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Progressions</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {progressions.map((pg) =>
                  pg ? (
                    <button
                      key={pg.id}
                      onClick={() => selectGame(pg)}
                      className="shrink-0 px-3 py-2 bg-secondary/50 border border-border/30 rounded-lg text-xs hover:border-primary/30 transition-colors flex items-center gap-1.5"
                    >
                      {pg.name}
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    </button>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-secondary/50 border border-border/30 rounded-full text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Source & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="text-[10px] text-muted-foreground">
              {game.source && <span>Source: {game.source}</span>}
            </div>
            {game.isCustom && (
              <button
                onClick={() => {
                  deleteGame(game.id);
                  selectGame(null);
                }}
                className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
