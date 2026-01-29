import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

// ============================================================================
// ICONS
// ============================================================================
const Icons = {
  fire: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938zM14 12a4 4 0 01-8 0 4 4 0 018 0zm-4-2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 10z" clipRule="evenodd" />
    </svg>
  ),
  target: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a6.5 6.5 0 016 6h1.5a.75.75 0 010 1.5h-1.5a6.5 6.5 0 01-6 6v1.5a.75.75 0 01-1.5 0v-1.5a6.5 6.5 0 01-6-6H1.75a.75.75 0 010-1.5h1.5a6.5 6.5 0 016-6v-1.5A.75.75 0 0110 1zm-4 9a4 4 0 118 0 4 4 0 01-8 0zm4-2a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
    </svg>
  ),
  sparkles: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 1a.75.75 0 01.65.38l1.95 3.4 3.75.9a.75.75 0 01.4 1.23l-2.6 2.87.45 3.85a.75.75 0 01-1.07.8L10 12.62l-3.53 1.81a.75.75 0 01-1.07-.8l.45-3.85-2.6-2.87a.75.75 0 01.4-1.23l3.75-.9 1.95-3.4A.75.75 0 0110 1z" />
    </svg>
  ),
  trophy: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 00-.629.74v.387c-.827.157-1.642.345-2.445.564a.75.75 0 00-.552.698 5 5 0 004.503 5.152 6 6 0 002.946 1.822A6.451 6.451 0 017.768 13H7.5A1.5 1.5 0 006 14.5V17h-.75C4.56 17 4 17.56 4 18.25c0 .414.336.75.75.75h10.5a.75.75 0 00.75-.75c0-.69-.56-1.25-1.25-1.25H14v-2.5a1.5 1.5 0 00-1.5-1.5h-.268a6.453 6.453 0 01-.684-2.202 6 6 0 002.946-1.822 5 5 0 004.503-5.152.75.75 0 00-.552-.698A31.804 31.804 0 0016 2.562v-.387a.75.75 0 00-.629-.74A33.227 33.227 0 0010 1zM2.525 4.422C3.012 4.3 3.504 4.19 4 4.09V5c0 .74.134 1.448.38 2.103a3.503 3.503 0 01-1.855-2.68zm14.95 0a3.503 3.503 0 01-1.854 2.68C15.866 6.449 16 5.74 16 5v-.91c.496.099.988.21 1.475.332z" clipRule="evenodd" />
    </svg>
  ),
  lightbulb: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
    </svg>
  ),
  rocket: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4.606 12.97a.75.75 0 01-.134 1.051 2.494 2.494 0 00-.93 2.437 2.494 2.494 0 002.437-.93.75.75 0 111.186.918 3.995 3.995 0 01-4.482 1.332.75.75 0 01-.461-.461 3.994 3.994 0 011.332-4.482.75.75 0 011.052.134z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M15.232 1.768a3.75 3.75 0 00-5.304 0l-5.08 5.08a6.623 6.623 0 00-1.912 5.58l.03.173a.75.75 0 00.902.68l.174-.029a6.623 6.623 0 005.58-1.912l5.08-5.08a3.75 3.75 0 000-5.304zM12.404 4.11a2.25 2.25 0 113.182 3.182l-.707.707-3.182-3.182.707-.707z" clipRule="evenodd" />
    </svg>
  ),
  clock: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  ),
  chart: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  ),
  play: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  ),
  chevronRight: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  ),
  x: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
    </svg>
  ),
  plus: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
    </svg>
  ),
  refresh: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
    </svg>
  ),
  zap: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
    </svg>
  ),
  heart: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
    </svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
    </svg>
  ),
};

// ============================================================================
// CONSTANTS
// ============================================================================
const TOPIC_COLORS = {
  offensive: { gradient: 'from-red-500 to-orange-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  defensive: { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  control: { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  transition: { gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
};

const STORAGE_KEY = 'smartTrainingHub';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getStorageData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setStorageData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Streak Badge Component
function StreakBadge({ streak }) {
  if (streak < 1) return null;

  const flames = Math.min(streak, 5);
  const isHot = streak >= 3;
  const isOnFire = streak >= 7;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${
      isOnFire
        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
        : isHot
          ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }`}>
      <span className={isOnFire ? 'animate-pulse' : ''}>{Icons.fire}</span>
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
    </div>
  );
}

// Progress Ring Component
function ProgressRing({ progress, size = 48, strokeWidth = 4, color = 'primary' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    primary: 'text-primary-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
    blue: 'text-blue-500',
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClasses[color]} transition-all duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Daily Challenge Card
function DailyChallengeCard({ challenge, onComplete, onDismiss }) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(challenge);
    setCompleting(false);
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-500/10 via-purple-500/10 to-pink-500/10 dark:from-primary-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-primary-200/50 dark:border-primary-800/50">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
              {Icons.target}
            </div>
            <div>
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                Daily Challenge
              </p>
              <h3 className="font-semibold text-gray-900 dark:text-white">{challenge.title}</h3>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{challenge.description}</p>

        {/* Progress indicator */}
        {challenge.progress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{challenge.progress}/{challenge.target}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-primary-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
          >
            {completing ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {challenge.actionIcon || Icons.check}
                <span>{challenge.actionLabel || 'Complete'}</span>
              </>
            )}
          </button>
          <button
            onClick={() => onDismiss(challenge)}
            className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Skip for today"
          >
            {Icons.x}
          </button>
        </div>

        {challenge.reward && (
          <p className="mt-3 text-xs text-center text-gray-500">
            Reward: <span className="font-medium text-primary-600 dark:text-primary-400">{challenge.reward}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// Quick Win Card
function QuickWinCard({ win, onAction, onDismiss }) {
  const [acting, setActing] = useState(false);

  const handleAction = async () => {
    setActing(true);
    await onAction(win);
    setActing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${win.iconBg || 'bg-green-100 dark:bg-green-900/30'}`}>
        <span className={win.iconColor || 'text-green-600 dark:text-green-400'}>{win.icon || Icons.zap}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{win.title}</p>
        <p className="text-xs text-gray-500 truncate">{win.description}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleAction}
          disabled={acting}
          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          {acting ? '...' : win.actionLabel || 'Do it'}
        </button>
        <button
          onClick={() => onDismiss(win)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
        >
          {Icons.x}
        </button>
      </div>
    </div>
  );
}

// Training Insight Card
function InsightCard({ insight, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all text-center group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${insight.bgColor} group-hover:scale-110 transition-transform`}>
        <span className={insight.iconColor}>{insight.icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{insight.value}</p>
      <p className="text-xs text-gray-500">{insight.label}</p>
      {insight.change && (
        <p className={`text-xs mt-1 ${insight.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {insight.change > 0 ? '+' : ''}{insight.change}%
        </p>
      )}
    </button>
  );
}

// Topic Focus Card
function TopicFocusCard({ topic, onAction }) {
  const colors = TOPIC_COLORS[topic.name.toLowerCase()] || TOPIC_COLORS.transition;

  return (
    <div className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${colors.gradient} text-white`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide mb-1">Weekly Focus</p>
        <h3 className="text-lg font-bold mb-2">{topic.name}</h3>
        <p className="text-sm opacity-90 mb-3">{topic.reason}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">{topic.gamesCount} games available</span>
          </div>
          <button
            onClick={() => onAction(topic)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            <span>Train</span>
            {Icons.chevronRight}
          </button>
        </div>
      </div>
    </div>
  );
}

// Achievement Badge
function AchievementBadge({ achievement, onDismiss }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 p-1 animate-pulse-slow">
      <div className="bg-white dark:bg-gray-900 rounded-[10px] p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
            {Icons.trophy}
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Achievement Unlocked!</p>
            <h3 className="font-bold text-gray-900 dark:text-white">{achievement.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
          </div>
          <button
            onClick={() => onDismiss(achievement)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {Icons.x}
          </button>
        </div>
      </div>
    </div>
  );
}

// Suggestion Card
function SuggestionCard({ suggestion, onAction, onDismiss }) {
  const priorityStyles = {
    high: 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/10',
    medium: 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
    low: 'border-l-4 border-l-gray-300 dark:border-l-gray-600 bg-gray-50 dark:bg-gray-800/50',
  };

  return (
    <div className={`rounded-xl p-3 ${priorityStyles[suggestion.priority || 'low']}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          suggestion.iconBg || 'bg-white dark:bg-gray-800'
        }`}>
          <span className={suggestion.iconColor || 'text-gray-500'}>{suggestion.icon || Icons.lightbulb}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white">{suggestion.title}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{suggestion.message}</p>
          {suggestion.action && (
            <button
              onClick={() => onAction(suggestion)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              {suggestion.action.label}
              {Icons.chevronRight}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(suggestion)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
        >
          {Icons.x}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SmartTrainingHub({ onFilterChange, compact = false }) {
  const navigate = useNavigate();
  const { showToast, setFilters, markGameUsed, sessions, fetchSessions, createSession } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [dismissed, setDismissed] = useState(() => getStorageData().dismissed || {});
  const [completedToday, setCompletedToday] = useState(() => {
    const storage = getStorageData();
    const today = getTodayKey();
    return storage.completedToday?.[today] || [];
  });

  // Fetch training data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recsResponse, statsResponse] = await Promise.all([
        api.get('/games/recommendations'),
        api.get('/games/stats')
      ]);

      setData({
        recommendations: recsResponse.data.recommendations || [],
        insights: recsResponse.data.insights || {},
        stats: statsResponse.data || {},
      });
    } catch (err) {
      console.error('Failed to fetch training hub data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Clear old dismissed items daily
  useEffect(() => {
    const storage = getStorageData();
    const today = getTodayKey();
    if (storage.lastClearDate !== today) {
      setDismissed({});
      setCompletedToday([]);
      setStorageData({ ...storage, dismissed: {}, completedToday: {}, lastClearDate: today });
    }
  }, []);

  // Generate daily challenge based on user data
  const dailyChallenge = useMemo(() => {
    if (!data?.insights) return null;

    const { trainingStreak, neverUsedCount, totalGames, gamesUsedThisWeek } = data.insights;
    const today = getTodayKey();

    // Skip if already completed today
    if (completedToday.includes('daily_challenge')) return null;
    if (dismissed[`challenge_${today}`]) return null;

    // Generate challenge based on user state
    if (neverUsedCount > 5) {
      return {
        id: 'try_new',
        title: 'Explorer',
        description: `You have ${neverUsedCount} games you've never tried. Use one today!`,
        difficulty: 'easy',
        actionLabel: 'Find New Game',
        actionIcon: Icons.rocket,
        reward: 'Unlock a new training experience',
        type: 'try_new',
      };
    }

    if (trainingStreak === 0) {
      return {
        id: 'start_streak',
        title: 'Start Your Streak',
        description: 'Use any game today to start building your training streak!',
        difficulty: 'easy',
        actionLabel: 'Start Training',
        actionIcon: Icons.play,
        reward: 'Begin your streak',
        type: 'start_streak',
      };
    }

    if (trainingStreak >= 7 && trainingStreak < 14) {
      return {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: `Amazing ${trainingStreak}-day streak! Train today to keep it going.`,
        difficulty: 'medium',
        actionLabel: 'Keep Going',
        actionIcon: Icons.fire,
        reward: 'Maintain your momentum',
        type: 'maintain_streak',
      };
    }

    if (gamesUsedThisWeek < 3) {
      return {
        id: 'variety_week',
        title: 'Variety Training',
        description: `Use ${3 - gamesUsedThisWeek} more unique games this week for balanced training.`,
        difficulty: 'medium',
        progress: gamesUsedThisWeek,
        target: 3,
        actionLabel: 'Train Now',
        actionIcon: Icons.sparkles,
        type: 'variety',
      };
    }

    // Default challenge
    return {
      id: 'daily_training',
      title: 'Daily Drills',
      description: 'Complete your training session today. Consistency is key!',
      difficulty: 'easy',
      actionLabel: 'Train',
      actionIcon: Icons.play,
      type: 'daily',
    };
  }, [data, completedToday, dismissed]);

  // Generate quick wins
  const quickWins = useMemo(() => {
    if (!data?.insights || !data?.recommendations) return [];

    const wins = [];
    const { neverUsedCount, trainingStreak } = data.insights;

    // Filter out dismissed
    const isDismissed = (id) => dismissed[`win_${id}`];

    // Never used games quick win
    if (neverUsedCount > 0 && !isDismissed('try_unused')) {
      wins.push({
        id: 'try_unused',
        title: 'Try something new',
        description: `${neverUsedCount} games waiting to be explored`,
        icon: Icons.rocket,
        iconBg: 'bg-purple-100 dark:bg-purple-900/30',
        iconColor: 'text-purple-600 dark:text-purple-400',
        actionLabel: 'Explore',
        type: 'filter_unused',
      });
    }

    // Rate a game quick win
    if (!isDismissed('rate_game')) {
      const unratedRec = data.recommendations.find(r => r.type === 'revisit_effective' && r.game);
      if (unratedRec) {
        wins.push({
          id: 'rate_game',
          title: 'Rate your training',
          description: 'Help improve recommendations',
          icon: Icons.star,
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          actionLabel: 'Rate',
          type: 'rate',
          game: unratedRec.game,
        });
      }
    }

    // Create session quick win
    if (!isDismissed('create_session') && sessions?.length === 0) {
      wins.push({
        id: 'create_session',
        title: 'Create a session',
        description: 'Organize games for structured training',
        icon: Icons.plus,
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
        actionLabel: 'Create',
        type: 'create_session',
      });
    }

    return wins.slice(0, 3);
  }, [data, dismissed, sessions]);

  // Generate insights
  const insights = useMemo(() => {
    if (!data?.insights) return [];

    const { totalGames, gamesUsedThisWeek, trainingStreak, neverUsedCount } = data.insights;

    return [
      {
        id: 'total',
        value: totalGames,
        label: 'Total Games',
        icon: Icons.chart,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
      },
      {
        id: 'week',
        value: gamesUsedThisWeek,
        label: 'This Week',
        icon: Icons.clock,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
      },
      {
        id: 'streak',
        value: trainingStreak,
        label: 'Day Streak',
        icon: Icons.fire,
        bgColor: trainingStreak >= 3 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800',
        iconColor: trainingStreak >= 3 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500',
      },
      {
        id: 'unused',
        value: neverUsedCount,
        label: 'Unexplored',
        icon: Icons.sparkles,
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        iconColor: 'text-purple-600 dark:text-purple-400',
      },
    ];
  }, [data]);

  // Generate topic focus suggestion
  const topicFocus = useMemo(() => {
    if (!data?.insights?.topicBalance) return null;

    const balance = data.insights.topicBalance;
    const weakest = Object.entries(balance).sort((a, b) => a[1] - b[1])[0];

    if (weakest && weakest[1] < 20) {
      const topicName = weakest[0].charAt(0).toUpperCase() + weakest[0].slice(1);
      return {
        name: topicName,
        reason: `Only ${Math.round(weakest[1])}% of your training focuses on ${topicName.toLowerCase()} skills. Time to balance!`,
        gamesCount: data.stats?.topicDistribution?.[weakest[0]] || 0,
        topic: weakest[0],
      };
    }

    return null;
  }, [data]);

  // Generate suggestions from recommendations
  const suggestions = useMemo(() => {
    if (!data?.recommendations) return [];

    return data.recommendations
      .filter(rec => !dismissed[`suggestion_${rec.type}`])
      .slice(0, 3)
      .map(rec => ({
        id: rec.type,
        title: rec.title,
        message: rec.message,
        priority: rec.priority,
        icon: rec.icon === 'fire' ? Icons.fire :
              rec.icon === 'target' ? Icons.target :
              rec.icon === 'sparkles' ? Icons.sparkles :
              rec.icon === 'heart' ? Icons.heart :
              rec.icon === 'trophy' ? Icons.trophy :
              rec.icon === 'rocket' ? Icons.rocket :
              Icons.lightbulb,
        iconBg: rec.topic ? TOPIC_COLORS[rec.topic]?.bg : 'bg-gray-100 dark:bg-gray-800',
        iconColor: rec.topic ? TOPIC_COLORS[rec.topic]?.text : 'text-gray-500',
        action: rec.action,
        game: rec.game,
        topic: rec.topic,
      }));
  }, [data, dismissed]);

  // Generate achievements
  const achievements = useMemo(() => {
    if (!data?.insights) return [];

    const achivs = [];
    const { trainingStreak, totalGames, gamesUsedThisWeek } = data.insights;
    const storage = getStorageData();
    const seenAchievements = storage.seenAchievements || [];

    // Streak achievements
    if (trainingStreak === 7 && !seenAchievements.includes('streak_7')) {
      achivs.push({ id: 'streak_7', title: 'Week Warrior', description: '7-day training streak!' });
    }
    if (trainingStreak === 30 && !seenAchievements.includes('streak_30')) {
      achivs.push({ id: 'streak_30', title: 'Monthly Master', description: '30-day training streak!' });
    }

    // Library achievements
    if (totalGames === 10 && !seenAchievements.includes('games_10')) {
      achivs.push({ id: 'games_10', title: 'Game Collector', description: '10 games in your library!' });
    }
    if (totalGames === 50 && !seenAchievements.includes('games_50')) {
      achivs.push({ id: 'games_50', title: 'Library Builder', description: '50 games in your library!' });
    }

    return achivs;
  }, [data]);

  // Handlers
  const handleDismiss = (type, id) => {
    const key = `${type}_${id}`;
    const newDismissed = { ...dismissed, [key]: true };
    setDismissed(newDismissed);

    const storage = getStorageData();
    setStorageData({ ...storage, dismissed: newDismissed });
  };

  const handleChallengeComplete = async (challenge) => {
    switch (challenge.type) {
      case 'try_new':
        if (onFilterChange) {
          onFilterChange({ usageFilter: 'unused' });
        }
        break;
      case 'start_streak':
      case 'maintain_streak':
      case 'daily':
        navigate('/practice');
        break;
      case 'variety':
        navigate('/');
        break;
      default:
        break;
    }

    // Mark as completed
    const today = getTodayKey();
    const newCompleted = [...completedToday, 'daily_challenge'];
    setCompletedToday(newCompleted);

    const storage = getStorageData();
    setStorageData({
      ...storage,
      completedToday: { ...storage.completedToday, [today]: newCompleted },
    });

    showToast('Challenge started! Good luck!', 'success');
  };

  const handleQuickWinAction = async (win) => {
    switch (win.type) {
      case 'filter_unused':
        if (onFilterChange) {
          onFilterChange({ usageFilter: 'unused' });
        } else {
          setFilters(prev => ({ ...prev, usageFilter: 'unused' }));
        }
        showToast('Showing unexplored games', 'info');
        break;
      case 'rate':
        if (win.game?._id) {
          navigate(`/?edit=${win.game._id}`);
        }
        break;
      case 'create_session':
        navigate('/sessions');
        break;
      default:
        break;
    }
    handleDismiss('win', win.id);
  };

  const handleSuggestionAction = (suggestion) => {
    if (!suggestion.action) return;

    switch (suggestion.action.type) {
      case 'filter_topic':
        if (onFilterChange) {
          onFilterChange({ topic: suggestion.topic });
        } else {
          setFilters(prev => ({ ...prev, topic: suggestion.topic }));
        }
        showToast(`Filtering by ${suggestion.topic}`, 'info');
        break;
      case 'use_game':
        if (suggestion.game?._id) {
          markGameUsed(suggestion.game._id);
          showToast('Game marked as used!', 'success');
          fetchData();
        }
        break;
      case 'create_session':
      case 'quick_session':
        navigate('/sessions');
        break;
      case 'ai_generate':
        navigate(`/ai?topic=${suggestion.topic}`);
        break;
      default:
        break;
    }
  };

  const handleTopicAction = (topic) => {
    if (onFilterChange) {
      onFilterChange({ topic: topic.topic });
    } else {
      setFilters(prev => ({ ...prev, topic: topic.topic }));
    }
    showToast(`Focus on ${topic.name} training`, 'info');
  };

  const handleAchievementDismiss = (achievement) => {
    const storage = getStorageData();
    const seenAchievements = storage.seenAchievements || [];
    setStorageData({
      ...storage,
      seenAchievements: [...seenAchievements, achievement.id],
    });
  };

  const handleInsightClick = (insight) => {
    switch (insight.id) {
      case 'total':
        navigate('/stats');
        break;
      case 'week':
        navigate('/stats?tab=calendar');
        break;
      case 'streak':
        navigate('/goals');
        break;
      case 'unused':
        if (onFilterChange) {
          onFilterChange({ usageFilter: 'unused' });
        }
        break;
      default:
        break;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="mb-6 space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // No data state
  if (!data) return null;

  // Compact collapsed state
  if (compact && !expanded) {
    const totalItems = (dailyChallenge ? 1 : 0) + quickWins.length + suggestions.length;
    if (totalItems === 0) return null;

    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full mb-4 p-3 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white">
            {Icons.lightbulb}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white text-sm">Training Coach</p>
            <p className="text-xs text-gray-500">{totalItems} suggestions for you</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.insights?.trainingStreak > 0 && (
            <StreakBadge streak={data.insights.trainingStreak} />
          )}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
            {Icons.lightbulb}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Training Coach</h2>
            <p className="text-xs text-gray-500">Personalized guidance for your training</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.insights?.trainingStreak > 0 && (
            <StreakBadge streak={data.insights.trainingStreak} />
          )}
          {compact && (
            <button
              onClick={() => setExpanded(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh"
          >
            {Icons.refresh}
          </button>
        </div>
      </div>

      {/* Achievements */}
      {achievements.map(achievement => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          onDismiss={handleAchievementDismiss}
        />
      ))}

      {/* Daily Challenge */}
      {dailyChallenge && (
        <DailyChallengeCard
          challenge={dailyChallenge}
          onComplete={handleChallengeComplete}
          onDismiss={(c) => handleDismiss('challenge', getTodayKey())}
        />
      )}

      {/* Insights Grid */}
      {insights.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {insights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onClick={() => handleInsightClick(insight)}
            />
          ))}
        </div>
      )}

      {/* Topic Focus */}
      {topicFocus && !dismissed[`topic_${topicFocus.topic}`] && (
        <TopicFocusCard
          topic={topicFocus}
          onAction={handleTopicAction}
        />
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Wins</h3>
          {quickWins.map(win => (
            <QuickWinCard
              key={win.id}
              win={win}
              onAction={handleQuickWinAction}
              onDismiss={(w) => handleDismiss('win', w.id)}
            />
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggestions</h3>
          {suggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAction={handleSuggestionAction}
              onDismiss={(s) => handleDismiss('suggestion', s.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!dailyChallenge && quickWins.length === 0 && suggestions.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">You're all caught up! Keep training!</p>
        </div>
      )}
    </div>
  );
}
