'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store';
import { CLAGame, CATEGORIES, GameCategory } from '@/types';
import { Plus, X, Save } from 'lucide-react';

export default function GameForm() {
  const router = useRouter();
  const addGame = useGameStore((s) => s.addGame);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<GameCategory>('guard');
  const [subcategory, setSubcategory] = useState('');
  const [startingPosition, setStartingPosition] = useState('');
  const [playerALabel, setPlayerALabel] = useState('Player A');
  const [playerAObjective, setPlayerAObjective] = useState('');
  const [playerAConstraints, setPlayerAConstraints] = useState<string[]>(['']);
  const [playerBLabel, setPlayerBLabel] = useState('Player B');
  const [playerBObjective, setPlayerBObjective] = useState('');
  const [playerBConstraints, setPlayerBConstraints] = useState<string[]>(['']);
  const [winConditionsA, setWinConditionsA] = useState<string[]>(['']);
  const [winConditionsB, setWinConditionsB] = useState<string[]>(['']);
  const [coachingNotes, setCoachingNotes] = useState('');
  const [duration, setDuration] = useState(3);
  const [tags, setTags] = useState('');
  const [scalingBeginner, setScalingBeginner] = useState('');
  const [scalingIntermediate, setScalingIntermediate] = useState('');
  const [scalingAdvanced, setScalingAdvanced] = useState('');

  const addConstraintA = () => setPlayerAConstraints([...playerAConstraints, '']);
  const addConstraintB = () => setPlayerBConstraints([...playerBConstraints, '']);
  const addWinA = () => setWinConditionsA([...winConditionsA, '']);
  const addWinB = () => setWinConditionsB([...winConditionsB, '']);

  const updateList = (
    list: string[],
    setter: (v: string[]) => void,
    index: number,
    value: string
  ) => {
    const updated = [...list];
    updated[index] = value;
    setter(updated);
  };

  const removeFromList = (
    list: string[],
    setter: (v: string[]) => void,
    index: number
  ) => {
    if (list.length <= 1) return;
    setter(list.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startingPosition || !playerAObjective || !playerBObjective) return;

    const game: CLAGame = {
      id: crypto.randomUUID(),
      name,
      category,
      subcategory: subcategory || undefined,
      startingPosition,
      playerA: {
        label: playerALabel,
        objective: playerAObjective,
        constraints: playerAConstraints.filter(Boolean),
      },
      playerB: {
        label: playerBLabel,
        objective: playerBObjective,
        constraints: playerBConstraints.filter(Boolean),
      },
      winConditions: {
        playerA: winConditionsA.filter(Boolean),
        playerB: winConditionsB.filter(Boolean),
      },
      scalingFocuses:
        scalingBeginner || scalingIntermediate || scalingAdvanced
          ? {
              beginner: scalingBeginner || undefined,
              intermediate: scalingIntermediate || undefined,
              advanced: scalingAdvanced || undefined,
            }
          : undefined,
      coachingNotes: coachingNotes || undefined,
      duration,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      source: 'Custom',
      createdBy: 'user',
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    addGame(game);
    router.push('/');
  };

  const inputClass =
    'w-full px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Game Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Underhook Battle"
            className={`${inputClass} mt-1`}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GameCategory)}
              className={`${inputClass} mt-1`}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Subcategory</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g., half, seated, chokes"
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Starting Position *</label>
          <textarea
            value={startingPosition}
            onChange={(e) => setStartingPosition(e.target.value)}
            placeholder="Describe the exact starting position for both players..."
            className={`${inputClass} mt-1 h-20 resize-none`}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Round Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              max={15}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className={labelClass}>Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="guard, sweeps, fundamentals"
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>
      </div>

      {/* Player A */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-blue-400 uppercase tracking-wide">
            Player A Role Label
          </label>
          <input
            type="text"
            value={playerALabel}
            onChange={(e) => setPlayerALabel(e.target.value)}
            placeholder="e.g., Guard Player, Passer, Attacker"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-blue-400 uppercase tracking-wide">
            Objective *
          </label>
          <textarea
            value={playerAObjective}
            onChange={(e) => setPlayerAObjective(e.target.value)}
            placeholder="What is Player A trying to achieve?"
            className={`${inputClass} mt-1 h-16 resize-none`}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-blue-400 uppercase tracking-wide">
            Constraints
          </label>
          {playerAConstraints.map((c, i) => (
            <div key={i} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={c}
                onChange={(e) =>
                  updateList(playerAConstraints, setPlayerAConstraints, i, e.target.value)
                }
                placeholder="e.g., Must stay standing"
                className={inputClass}
              />
              {playerAConstraints.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeFromList(playerAConstraints, setPlayerAConstraints, i)
                  }
                  className="p-1 text-muted-foreground hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addConstraintA}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add constraint
          </button>
        </div>
        <div>
          <label className="text-xs font-medium text-blue-400 uppercase tracking-wide">
            Win Conditions
          </label>
          {winConditionsA.map((w, i) => (
            <div key={i} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={w}
                onChange={(e) =>
                  updateList(winConditionsA, setWinConditionsA, i, e.target.value)
                }
                placeholder="e.g., Achieve underhook for 3 seconds"
                className={inputClass}
              />
              {winConditionsA.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFromList(winConditionsA, setWinConditionsA, i)}
                  className="p-1 text-muted-foreground hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addWinA}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add win condition
          </button>
        </div>
      </div>

      {/* Player B */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-orange-400 uppercase tracking-wide">
            Player B Role Label
          </label>
          <input
            type="text"
            value={playerBLabel}
            onChange={(e) => setPlayerBLabel(e.target.value)}
            placeholder="e.g., Guard Player, Passer, Defender"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-orange-400 uppercase tracking-wide">
            Objective *
          </label>
          <textarea
            value={playerBObjective}
            onChange={(e) => setPlayerBObjective(e.target.value)}
            placeholder="What is Player B trying to achieve?"
            className={`${inputClass} mt-1 h-16 resize-none`}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-orange-400 uppercase tracking-wide">
            Constraints
          </label>
          {playerBConstraints.map((c, i) => (
            <div key={i} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={c}
                onChange={(e) =>
                  updateList(playerBConstraints, setPlayerBConstraints, i, e.target.value)
                }
                placeholder="e.g., Knees cannot touch the mat"
                className={inputClass}
              />
              {playerBConstraints.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeFromList(playerBConstraints, setPlayerBConstraints, i)
                  }
                  className="p-1 text-muted-foreground hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addConstraintB}
            className="mt-2 text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add constraint
          </button>
        </div>
        <div>
          <label className="text-xs font-medium text-orange-400 uppercase tracking-wide">
            Win Conditions
          </label>
          {winConditionsB.map((w, i) => (
            <div key={i} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={w}
                onChange={(e) =>
                  updateList(winConditionsB, setWinConditionsB, i, e.target.value)
                }
                placeholder="e.g., Keep both legs free for the round"
                className={inputClass}
              />
              {winConditionsB.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFromList(winConditionsB, setWinConditionsB, i)}
                  className="p-1 text-muted-foreground hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addWinB}
            className="mt-2 text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add win condition
          </button>
        </div>
      </div>

      {/* Scaling Focuses */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Scaling Focuses (optional)</h3>
        <div>
          <label className={labelClass}>Beginner</label>
          <input
            type="text"
            value={scalingBeginner}
            onChange={(e) => setScalingBeginner(e.target.value)}
            placeholder="What should beginners focus on?"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className={labelClass}>Intermediate</label>
          <input
            type="text"
            value={scalingIntermediate}
            onChange={(e) => setScalingIntermediate(e.target.value)}
            placeholder="How does this get harder?"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className={labelClass}>Advanced</label>
          <input
            type="text"
            value={scalingAdvanced}
            onChange={(e) => setScalingAdvanced(e.target.value)}
            placeholder="Expert-level challenge?"
            className={`${inputClass} mt-1`}
          />
        </div>
      </div>

      {/* Coaching Notes */}
      <div>
        <label className={labelClass}>Coaching Notes (optional)</label>
        <textarea
          value={coachingNotes}
          onChange={(e) => setCoachingNotes(e.target.value)}
          placeholder="What should the coach watch for? What emerges from this game?"
          className={`${inputClass} mt-1 h-24 resize-none`}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        Create Game
      </button>
    </form>
  );
}
