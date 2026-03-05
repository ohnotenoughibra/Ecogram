'use client';

import { CLAGame, CATEGORY_COLORS } from '@/types';
import { Clock, Users, ChevronRight, Plus } from 'lucide-react';
import { useGameStore } from '@/store';
import { useSessionStore } from '@/store';

interface GameCardProps {
  game: CLAGame;
  onAddToSession?: () => void;
}

export default function GameCard({ game, onAddToSession }: GameCardProps) {
  const selectGame = useGameStore((s) => s.selectGame);
  const activeSession = useSessionStore((s) => s.activeSession);
  const addGameToSession = useSessionStore((s) => s.addGameToSession);

  const categoryClass = CATEGORY_COLORS[game.category] || '';

  const handleAddToSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSession) {
      addGameToSession(activeSession.id, game.id);
      onAddToSession?.();
    }
  };

  return (
    <button
      onClick={() => selectGame(game)}
      className="w-full text-left bg-card/50 border border-border/30 rounded-xl p-4 hover:border-primary/30 hover:bg-card/80 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
          {game.name}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {activeSession && (
            <span
              onClick={handleAddToSession}
              className="p-1 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
              role="button"
              tabIndex={0}
            >
              <Plus className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${categoryClass}`}
        >
          {game.category}
        </span>
        {game.subcategory && (
          <span className="text-[10px] text-muted-foreground capitalize">
            {game.subcategory}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {game.startingPosition}
      </p>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {game.playerA.label} vs {game.playerB.label}
        </span>
        {game.duration && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {game.duration}min
          </span>
        )}
      </div>

      {game.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {game.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-secondary/50 rounded text-[9px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {game.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-[9px] text-muted-foreground">
              +{game.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
