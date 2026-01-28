import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

const topicColors = {
  offensive: 'from-red-500 to-orange-500',
  defensive: 'from-blue-500 to-cyan-500',
  control: 'from-purple-500 to-pink-500',
  transition: 'from-green-500 to-emerald-500'
};

const topicLabels = {
  offensive: 'Offensive',
  defensive: 'Defensive',
  control: 'Control',
  transition: 'Transition'
};

export default function GameOfTheDay({ onUseGame }) {
  const navigate = useNavigate();
  const { markGameUsed, showToast } = useApp();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [used, setUsed] = useState(false);

  const fetchGameOfTheDay = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/games/game-of-the-day');
      setGameData(response.data);

      // Check if already used today
      const lastUsed = localStorage.getItem('gotd_last_used');
      const today = new Date().toISOString().split('T')[0];
      if (lastUsed === today) {
        setUsed(true);
      }

      // Check if dismissed today
      const dismissedDate = localStorage.getItem('gotd_dismissed');
      if (dismissedDate === today) {
        setDismissed(true);
      }
    } catch (err) {
      console.error('Failed to fetch game of the day:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGameOfTheDay();
  }, [fetchGameOfTheDay]);

  const handleUse = async () => {
    if (gameData?.game?._id) {
      await markGameUsed(gameData.game._id);
      setUsed(true);
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('gotd_last_used', today);
      showToast('Game marked as used!', 'success');
      if (onUseGame) onUseGame(gameData.game);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('gotd_dismissed', today);
  };

  const handleViewGame = () => {
    if (gameData?.game?._id) {
      navigate(`/?edit=${gameData.game._id}`);
    }
  };

  if (loading) {
    return (
      <div className="card p-4 mb-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!gameData?.game || dismissed) {
    return null;
  }

  const game = gameData.game;
  const gradientClass = topicColors[game.topic] || topicColors.transition;

  return (
    <div className={`relative overflow-hidden rounded-xl mb-4 bg-gradient-to-r ${gradientClass} p-[2px]`}>
      <div className="bg-white dark:bg-gray-900 rounded-[10px] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-sm`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Game of the Day
              </span>
              <span className="text-xs text-gray-400 ml-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Dismiss for today"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
            </svg>
          </button>
        </div>

        {/* Game Info */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
              {game.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${gradientClass} text-white`}>
                {topicLabels[game.topic]}
              </span>
              {game.favorite && (
                <span className="text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8 1.75a.75.75 0 01.692.462l1.41 3.393 3.664.293a.75.75 0 01.428 1.317l-2.791 2.39.853 3.575a.75.75 0 01-1.12.814L8 12.093l-3.136 1.9a.75.75 0 01-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 01.427-1.318l3.663-.293 1.41-3.393A.75.75 0 018 1.75z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {game.averageEffectiveness > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                  </svg>
                  {game.averageEffectiveness.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {gameData.reason}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {used ? (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
              </svg>
              Used Today
            </div>
          ) : (
            <button
              onClick={handleUse}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${gradientClass} text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
              </svg>
              Use This Game
            </button>
          )}
          <button
            onClick={handleViewGame}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
