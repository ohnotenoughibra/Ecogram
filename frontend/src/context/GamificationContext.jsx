import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const GamificationContext = createContext(null);

// XP rewards for different actions
const XP_REWARDS = {
  CREATE_GAME: 50,
  GENERATE_AI_GAME: 30,
  RUN_SESSION: 100,
  COMPLETE_SESSION: 150,
  ADD_GAME_TO_SESSION: 10,
  RATE_GAME: 15,
  FIRST_GAME_TODAY: 25,
  STREAK_BONUS: 50, // Per day in streak
  COMPLETE_LESSON: 75,
  PASS_QUIZ: 100,
  FILL_POSITION_GAP: 200,
  WEEKLY_GOAL_MET: 300
};

// Level thresholds
const LEVELS = [
  { level: 1, name: 'White Belt Coach', xpRequired: 0, icon: '🥋' },
  { level: 2, name: 'Blue Belt Coach', xpRequired: 500, icon: '🔵' },
  { level: 3, name: 'Purple Belt Coach', xpRequired: 1500, icon: '🟣' },
  { level: 4, name: 'Brown Belt Coach', xpRequired: 3500, icon: '🟤' },
  { level: 5, name: 'Black Belt Coach', xpRequired: 7000, icon: '⬛' },
  { level: 6, name: 'Coral Belt Coach', xpRequired: 12000, icon: '🔴' },
  { level: 7, name: 'Red Belt Master', xpRequired: 20000, icon: '❤️' }
];

// Achievement definitions
const ACHIEVEMENTS = {
  // Getting started
  first_game: { id: 'first_game', name: 'First Step', description: 'Create your first game', icon: '🎯', xp: 100 },
  first_session: { id: 'first_session', name: 'Class is in Session', description: 'Run your first session', icon: '📚', xp: 100 },
  first_ai_game: { id: 'first_ai_game', name: 'AI Apprentice', description: 'Generate a game with AI', icon: '🤖', xp: 50 },

  // Library building
  games_10: { id: 'games_10', name: 'Building Blocks', description: 'Create 10 games', icon: '🧱', xp: 200 },
  games_25: { id: 'games_25', name: 'Growing Library', description: 'Create 25 games', icon: '📖', xp: 300 },
  games_50: { id: 'games_50', name: 'Game Architect', description: 'Create 50 games', icon: '🏛️', xp: 500 },
  games_100: { id: 'games_100', name: 'Master Librarian', description: 'Create 100 games', icon: '📚', xp: 1000 },

  // Position coverage
  all_positions: { id: 'all_positions', name: 'Well Rounded', description: 'Have games for all position categories', icon: '⭕', xp: 300 },
  leg_lock_specialist: { id: 'leg_lock_specialist', name: 'Leg Lock Specialist', description: '10+ leg lock games', icon: '🦵', xp: 200 },
  guard_master: { id: 'guard_master', name: 'Guard Master', description: '15+ guard games', icon: '🛡️', xp: 200 },
  wrestling_coach: { id: 'wrestling_coach', name: 'Wrestling Coach', description: '10+ standing/wrestling games', icon: '🤼', xp: 200 },

  // Topic balance
  balanced_library: { id: 'balanced_library', name: 'Balanced Curriculum', description: '5+ games in each topic', icon: '⚖️', xp: 400 },
  offensive_minded: { id: 'offensive_minded', name: 'Offensive Minded', description: '20+ offensive games', icon: '⚔️', xp: 200 },
  defensive_guru: { id: 'defensive_guru', name: 'Defensive Guru', description: '20+ defensive games', icon: '🛡️', xp: 200 },

  // Streaks
  streak_7: { id: 'streak_7', name: 'Week Warrior', description: '7 day streak', icon: '🔥', xp: 350 },
  streak_30: { id: 'streak_30', name: 'Monthly Master', description: '30 day streak', icon: '💪', xp: 1000 },
  streak_100: { id: 'streak_100', name: 'Centurion', description: '100 day streak', icon: '🏆', xp: 3000 },

  // Sessions
  sessions_10: { id: 'sessions_10', name: 'Regular Coach', description: 'Run 10 sessions', icon: '📅', xp: 300 },
  sessions_50: { id: 'sessions_50', name: 'Dedicated Instructor', description: 'Run 50 sessions', icon: '🎓', xp: 800 },
  sessions_100: { id: 'sessions_100', name: 'Master Instructor', description: 'Run 100 sessions', icon: '👨‍🏫', xp: 1500 },

  // Learning
  cla_basics: { id: 'cla_basics', name: 'CLA Fundamentals', description: 'Complete CLA basics course', icon: '📖', xp: 200 },
  pedagogy_pro: { id: 'pedagogy_pro', name: 'Pedagogy Pro', description: 'Complete all learning modules', icon: '🎯', xp: 500 },
  quiz_master: { id: 'quiz_master', name: 'Quiz Master', description: 'Score 100% on any quiz', icon: '💯', xp: 150 },

  // Special
  night_owl: { id: 'night_owl', name: 'Night Owl', description: 'Create a game after midnight', icon: '🦉', xp: 50 },
  early_bird: { id: 'early_bird', name: 'Early Bird', description: 'Create a game before 6am', icon: '🐦', xp: 50 },
  weekend_warrior: { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Run a session on Saturday or Sunday', icon: '📆', xp: 75 }
};

// Weekly challenges
const WEEKLY_CHALLENGES = [
  { id: 'create_5_games', name: 'Library Builder', description: 'Create 5 new games this week', target: 5, xp: 250, type: 'games_created' },
  { id: 'run_3_sessions', name: 'Active Coach', description: 'Run 3 sessions this week', target: 3, xp: 300, type: 'sessions_run' },
  { id: 'try_all_topics', name: 'Topic Explorer', description: 'Create a game in each topic', target: 4, xp: 200, type: 'topics_covered' },
  { id: 'ai_explorer', name: 'AI Explorer', description: 'Generate 3 AI games', target: 3, xp: 150, type: 'ai_games' },
  { id: 'complete_lesson', name: 'Student Coach', description: 'Complete 2 learning modules', target: 2, xp: 200, type: 'lessons_completed' },
  { id: 'balance_check', name: 'Balance Check', description: 'Improve your library balance score', target: 1, xp: 175, type: 'balance_improved' }
];

export function GamificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  // Core gamification state
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [weeklyChallenge, setWeeklyChallenge] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState({});
  const [completedLessons, setCompletedLessons] = useState([]);
  const [quizScores, setQuizScores] = useState({});

  // UI state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [showAchievement, setShowAchievement] = useState(null);
  const [xpAnimation, setXpAnimation] = useState(null);

  // Load gamification data from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      const saved = localStorage.getItem(`gamification_${user._id}`);
      if (saved) {
        const data = JSON.parse(saved);
        setXp(data.xp || 0);
        setStreak(data.streak || 0);
        setLastActiveDate(data.lastActiveDate);
        setAchievements(data.achievements || []);
        setWeeklyChallenge(data.weeklyChallenge);
        setWeeklyProgress(data.weeklyProgress || {});
        setCompletedLessons(data.completedLessons || []);
        setQuizScores(data.quizScores || {});

        // Calculate level from XP
        const currentLevel = LEVELS.reduce((acc, l) =>
          data.xp >= l.xpRequired ? l.level : acc, 1);
        setLevel(currentLevel);

        // Check streak
        checkStreak(data.lastActiveDate, data.streak);

        // Check weekly challenge
        checkWeeklyChallenge(data.weeklyChallenge);
      } else {
        // Initialize new user with a random weekly challenge
        selectNewWeeklyChallenge();
      }
    }
  }, [isAuthenticated, user]);

  // Save gamification data
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem(`gamification_${user._id}`, JSON.stringify({
        xp,
        streak,
        lastActiveDate,
        achievements,
        weeklyChallenge,
        weeklyProgress,
        completedLessons,
        quizScores
      }));
    }
  }, [xp, streak, lastActiveDate, achievements, weeklyChallenge, weeklyProgress, completedLessons, quizScores, user, isAuthenticated]);

  // Check and update streak
  const checkStreak = useCallback((lastDate, currentStreak) => {
    if (!lastDate) {
      setStreak(0);
      return;
    }

    const last = new Date(lastDate);
    const today = new Date();
    const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, keep streak
      setStreak(currentStreak);
    } else if (diffDays === 1) {
      // Consecutive day, streak continues
      setStreak(currentStreak);
    } else {
      // Streak broken
      setStreak(0);
    }
  }, []);

  // Check if weekly challenge needs reset
  const checkWeeklyChallenge = useCallback((challenge) => {
    if (!challenge) {
      selectNewWeeklyChallenge();
      return;
    }

    const startDate = new Date(challenge.startDate);
    const now = new Date();
    const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) {
      selectNewWeeklyChallenge();
    }
  }, []);

  // Select a new weekly challenge
  const selectNewWeeklyChallenge = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * WEEKLY_CHALLENGES.length);
    const challenge = {
      ...WEEKLY_CHALLENGES[randomIndex],
      startDate: new Date().toISOString(),
      progress: 0
    };
    setWeeklyChallenge(challenge);
    setWeeklyProgress({});
  }, []);

  // Award XP with animation
  const awardXp = useCallback((amount, reason) => {
    setXp(prev => {
      const newXp = prev + amount;

      // Check for level up
      const currentLevel = LEVELS.reduce((acc, l) => prev >= l.xpRequired ? l.level : acc, 1);
      const newLevelNum = LEVELS.reduce((acc, l) => newXp >= l.xpRequired ? l.level : acc, 1);

      if (newLevelNum > currentLevel) {
        setNewLevel(LEVELS.find(l => l.level === newLevelNum));
        setShowLevelUp(true);
        setLevel(newLevelNum);
      }

      return newXp;
    });

    // Show XP animation
    setXpAnimation({ amount, reason });
    setTimeout(() => setXpAnimation(null), 2000);

    // Update last active date and streak
    const today = new Date().toISOString().split('T')[0];
    if (lastActiveDate !== today) {
      if (lastActiveDate) {
        const last = new Date(lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - last) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          setStreak(prev => prev + 1);
        } else if (diffDays > 1) {
          setStreak(1);
        }
      } else {
        setStreak(1);
      }
      setLastActiveDate(today);
    }
  }, [lastActiveDate]);

  // Unlock achievement
  const unlockAchievement = useCallback((achievementId) => {
    if (achievements.includes(achievementId)) return;

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    setAchievements(prev => [...prev, achievementId]);
    setShowAchievement(achievement);
    awardXp(achievement.xp, `Achievement: ${achievement.name}`);

    setTimeout(() => setShowAchievement(null), 4000);
  }, [achievements, awardXp]);

  // Check achievements based on stats
  const checkAchievements = useCallback((stats) => {
    const { gamesCount, sessionsCount, topicCounts, positionCounts } = stats;

    // Games milestones
    if (gamesCount >= 1 && !achievements.includes('first_game')) unlockAchievement('first_game');
    if (gamesCount >= 10 && !achievements.includes('games_10')) unlockAchievement('games_10');
    if (gamesCount >= 25 && !achievements.includes('games_25')) unlockAchievement('games_25');
    if (gamesCount >= 50 && !achievements.includes('games_50')) unlockAchievement('games_50');
    if (gamesCount >= 100 && !achievements.includes('games_100')) unlockAchievement('games_100');

    // Sessions milestones
    if (sessionsCount >= 1 && !achievements.includes('first_session')) unlockAchievement('first_session');
    if (sessionsCount >= 10 && !achievements.includes('sessions_10')) unlockAchievement('sessions_10');
    if (sessionsCount >= 50 && !achievements.includes('sessions_50')) unlockAchievement('sessions_50');
    if (sessionsCount >= 100 && !achievements.includes('sessions_100')) unlockAchievement('sessions_100');

    // Topic balance
    if (topicCounts) {
      const allTopicsHave5 = Object.values(topicCounts).every(c => c >= 5);
      if (allTopicsHave5 && !achievements.includes('balanced_library')) unlockAchievement('balanced_library');

      if (topicCounts.offensive >= 20 && !achievements.includes('offensive_minded')) unlockAchievement('offensive_minded');
      if (topicCounts.defensive >= 20 && !achievements.includes('defensive_guru')) unlockAchievement('defensive_guru');
    }

    // Position coverage
    if (positionCounts) {
      const hasAllPositions = positionCounts.guard > 0 && positionCounts.top > 0 &&
                             positionCounts.standing > 0 && positionCounts.legLocks > 0;
      if (hasAllPositions && !achievements.includes('all_positions')) unlockAchievement('all_positions');

      if (positionCounts.legLocks >= 10 && !achievements.includes('leg_lock_specialist')) unlockAchievement('leg_lock_specialist');
      if (positionCounts.guard >= 15 && !achievements.includes('guard_master')) unlockAchievement('guard_master');
      if (positionCounts.standing >= 10 && !achievements.includes('wrestling_coach')) unlockAchievement('wrestling_coach');
    }

    // Streaks
    if (streak >= 7 && !achievements.includes('streak_7')) unlockAchievement('streak_7');
    if (streak >= 30 && !achievements.includes('streak_30')) unlockAchievement('streak_30');
    if (streak >= 100 && !achievements.includes('streak_100')) unlockAchievement('streak_100');
  }, [achievements, streak, unlockAchievement]);

  // Update weekly challenge progress
  const updateWeeklyProgress = useCallback((type, amount = 1) => {
    if (!weeklyChallenge || weeklyChallenge.type !== type) return;

    setWeeklyChallenge(prev => {
      if (!prev) return prev;
      const newProgress = Math.min(prev.progress + amount, prev.target);

      // Check if completed
      if (newProgress >= prev.target && prev.progress < prev.target) {
        awardXp(prev.xp, `Weekly Challenge: ${prev.name}`);
      }

      return { ...prev, progress: newProgress };
    });
  }, [weeklyChallenge, awardXp]);

  // Complete a lesson
  const completeLesson = useCallback((lessonId) => {
    if (completedLessons.includes(lessonId)) return;

    setCompletedLessons(prev => [...prev, lessonId]);
    awardXp(XP_REWARDS.COMPLETE_LESSON, 'Completed lesson');
    updateWeeklyProgress('lessons_completed');

    // Check for learning achievements
    if (lessonId.startsWith('cla_') && !achievements.includes('cla_basics')) {
      const claLessons = ['cla_intro', 'cla_constraints', 'cla_rep_design', 'cla_variability'];
      const completedCla = claLessons.filter(l => completedLessons.includes(l) || l === lessonId);
      if (completedCla.length >= claLessons.length) {
        unlockAchievement('cla_basics');
      }
    }
  }, [completedLessons, awardXp, updateWeeklyProgress, achievements, unlockAchievement]);

  // Record quiz score
  const recordQuizScore = useCallback((quizId, score, total) => {
    const percentage = Math.round((score / total) * 100);
    setQuizScores(prev => ({ ...prev, [quizId]: percentage }));

    if (percentage === 100 && !achievements.includes('quiz_master')) {
      unlockAchievement('quiz_master');
    }

    awardXp(Math.round(XP_REWARDS.PASS_QUIZ * (percentage / 100)), `Quiz: ${percentage}%`);
  }, [achievements, unlockAchievement, awardXp]);

  // Get current level info
  const getCurrentLevel = useCallback(() => {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  }, [level]);

  // Get next level info
  const getNextLevel = useCallback(() => {
    return LEVELS.find(l => l.level === level + 1);
  }, [level]);

  // Get XP progress to next level
  const getXpProgress = useCallback(() => {
    const current = getCurrentLevel();
    const next = getNextLevel();

    if (!next) return { current: xp, required: xp, percentage: 100 };

    const xpInLevel = xp - current.xpRequired;
    const xpNeeded = next.xpRequired - current.xpRequired;

    return {
      current: xpInLevel,
      required: xpNeeded,
      percentage: Math.round((xpInLevel / xpNeeded) * 100)
    };
  }, [xp, getCurrentLevel, getNextLevel]);

  const value = {
    // State
    xp,
    level,
    streak,
    achievements,
    weeklyChallenge,
    completedLessons,
    quizScores,

    // UI state
    showLevelUp,
    setShowLevelUp,
    newLevel,
    showAchievement,
    setShowAchievement,
    xpAnimation,

    // Constants
    ACHIEVEMENTS,
    LEVELS,
    XP_REWARDS,

    // Actions
    awardXp,
    unlockAchievement,
    checkAchievements,
    updateWeeklyProgress,
    completeLesson,
    recordQuizScore,
    selectNewWeeklyChallenge,

    // Helpers
    getCurrentLevel,
    getNextLevel,
    getXpProgress
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
