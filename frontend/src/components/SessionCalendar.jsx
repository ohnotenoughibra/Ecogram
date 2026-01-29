import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const topicColors = {
  offensive: 'bg-red-500',
  defensive: 'bg-blue-500',
  control: 'bg-purple-500',
  transition: 'bg-green-500'
};

const categoryColors = {
  offensive: { bg: 'bg-red-100 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-400' },
  defensive: { bg: 'bg-blue-100 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-400' },
  control: { bg: 'bg-purple-100 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-400' },
  transition: { bg: 'bg-green-100 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-400' },
  competition: { bg: 'bg-orange-100 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-400' },
  fundamentals: { bg: 'bg-teal-100 dark:bg-teal-900/20', border: 'border-teal-300 dark:border-teal-700', text: 'text-teal-700 dark:text-teal-400' },
  custom: { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-400' }
};

// Custom color options for topics
const customColorOptions = [
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-500' },
  { name: 'Lime', value: '#84cc16', bg: 'bg-lime-500' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
  { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500' },
  { name: 'Sky', value: '#0ea5e9', bg: 'bg-sky-500' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Violet', value: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Fuchsia', value: '#d946ef', bg: 'bg-fuchsia-500' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Gray', value: '#6b7280', bg: 'bg-gray-500' }
];

export default function SessionCalendar({
  sessions,
  onScheduleSession,
  onEditSession,
  onDeleteSession,
  onStartSession,
  showToast
}) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [trainingTopics, setTrainingTopics] = useState([]);
  const [editingTopic, setEditingTopic] = useState(null);

  // Fetch training topics
  useEffect(() => {
    fetchTopics();
  }, [currentDate]);

  const fetchTopics = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month + 2, 0).toISOString();

      const response = await api.get('/topics', {
        params: { startDate, endDate, active: true }
      });
      setTrainingTopics(response.data);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    }
  };

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentDate]);

  // Map sessions to dates
  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach(session => {
      if (session.scheduledDate) {
        const dateKey = new Date(session.scheduledDate).toDateString();
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push({ ...session, type: 'scheduled' });
      }
      if (session.lastUsed) {
        const dateKey = new Date(session.lastUsed).toDateString();
        if (!map[dateKey]) map[dateKey] = [];
        if (!map[dateKey].find(s => s._id === session._id)) {
          map[dateKey].push({ ...session, type: 'completed' });
        }
      }
    });
    return map;
  }, [sessions]);

  // Get topic for a specific date
  const getTopicForDate = (date) => {
    return trainingTopics.find(topic => {
      const start = new Date(topic.startDate);
      const end = new Date(topic.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  // Get current topic
  const currentTopic = useMemo(() => {
    const today = new Date();
    return getTopicForDate(today);
  }, [trainingTopics]);

  // Calculate topic balance for diversification encouragement
  const topicBalance = useMemo(() => {
    const counts = { offensive: 0, defensive: 0, control: 0, transition: 0, competition: 0, fundamentals: 0 };
    trainingTopics.forEach(topic => {
      if (counts.hasOwnProperty(topic.category)) {
        counts[topic.category]++;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const mainCategories = ['offensive', 'defensive', 'control', 'transition'];
    const mainCounts = mainCategories.map(c => counts[c]);
    const average = total > 0 ? total / mainCategories.length : 0;
    const variance = mainCounts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / mainCategories.length;
    const balanceScore = total > 0 ? Math.max(0, 100 - Math.sqrt(variance) * 20) : 0;
    const weakestCategory = mainCategories.reduce((min, cat) => counts[cat] < counts[min] ? cat : min, mainCategories[0]);
    return { counts, total, balanceScore, weakestCategory };
  }, [trainingTopics]);

  const navigateMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day) => {
    setSelectedDate(day.date);
    setShowDayModal(true);
  };

  const getSessionsForDate = (date) => {
    return sessionsByDate[date.toDateString()] || [];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleCreateTopic = async (topicData) => {
    try {
      // Check if this is editing an existing topic (not a new one with _isNew flag)
      if (editingTopic && !editingTopic._isNew && editingTopic._id) {
        await api.put(`/topics/${editingTopic._id}`, topicData);
        showToast?.('Topic updated', 'success');
      } else {
        await api.post('/topics', topicData);
        showToast?.('Topic created', 'success');
      }
      fetchTopics();
      setShowTopicModal(false);
      setEditingTopic(null);
    } catch (err) {
      showToast?.('Failed to save topic', 'error');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await api.delete(`/topics/${topicId}`);
      showToast?.('Topic deleted', 'success');
      fetchTopics();
    } catch (err) {
      showToast?.('Failed to delete topic', 'error');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Current Topic Banner */}
      {currentTopic && (
        <div
          className={`p-4 rounded-xl border-2 ${categoryColors[currentTopic.category]?.bg || categoryColors.custom.bg} ${categoryColors[currentTopic.category]?.border || categoryColors.custom.border}`}
          style={currentTopic.color ? { borderLeftWidth: '6px', borderLeftColor: currentTopic.color } : {}}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {currentTopic.color && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: currentTopic.color }}
                  />
                )}
                <span className={`text-xs font-medium uppercase ${categoryColors[currentTopic.category]?.text || categoryColors.custom.text}`}>
                  Current Focus
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.ceil((new Date(currentTopic.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {currentTopic.name}
              </h3>
              {currentTopic.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {currentTopic.description}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setEditingTopic(currentTopic);
                setShowTopicModal(true);
              }}
              className="btn-secondary text-sm"
            >
              Edit
            </button>
          </div>
          {currentTopic.goals && currentTopic.goals.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {currentTopic.goals.map((goal, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full">
                  {goal}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Topic Balance Card - Encourage diversification */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
              <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505l6.418 1.069a.75.75 0 11-.246 1.48l-6.172-1.029a.75.75 0 01-.378-.146l-.016.006-.016-.006a.75.75 0 01-.378.146l-6.172 1.03a.75.75 0 01-.246-1.481L10 16.014V5.509a31.743 31.743 0 00-3.339.254l1.77 7.85a.75.75 0 01-.387.83A4.981 4.981 0 015 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.702-7.545a31.28 31.28 0 00-1.103.232.75.75 0 11-.336-1.462 33.186 33.186 0 016.668-.829V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
            </svg>
            Topic Balance
          </h3>
          {topicBalance.total > 0 && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              topicBalance.balanceScore >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
              topicBalance.balanceScore >= 40 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
              'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
            }`}>
              {Math.round(topicBalance.balanceScore)}% Balanced
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Diversify your training by scheduling topics across different categories
        </p>
        {topicBalance.total > 0 ? (
          <div className="space-y-2">
            {[
              { key: 'offensive', label: 'Offensive', color: 'bg-red-500', icon: '⚔️' },
              { key: 'defensive', label: 'Defensive', color: 'bg-blue-500', icon: '🛡️' },
              { key: 'control', label: 'Control', color: 'bg-purple-500', icon: '🎯' },
              { key: 'transition', label: 'Transition', color: 'bg-green-500', icon: '🔄' }
            ].map(t => {
              const count = topicBalance.counts[t.key] || 0;
              const maxCount = Math.max(...Object.values(topicBalance.counts).filter((_, i) => i < 4), 1);
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const isWeakest = t.key === topicBalance.weakestCategory && topicBalance.total > 2 && count < topicBalance.total / 4;
              return (
                <div key={t.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5">
                      <span>{t.icon}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t.label}</span>
                      {isWeakest && (
                        <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                          Needs focus
                        </span>
                      )}
                    </span>
                    <span className="text-gray-500">{count} topic{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${t.color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
            {/* Suggestion for weak areas */}
            {topicBalance.weakestCategory && topicBalance.counts[topicBalance.weakestCategory] === 0 && topicBalance.total > 1 && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                  </svg>
                  Consider adding a <strong className="capitalize">{topicBalance.weakestCategory}</strong> topic to balance your training
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            <p>No training topics scheduled yet</p>
            <p className="text-xs mt-1">Add topics to track your training focus over time</p>
          </div>
        )}
      </div>

      {/* Calendar Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingTopic(null);
                  setShowTopicModal(true);
                }}
                className="text-sm text-primary-500 hover:text-primary-600 px-2 py-1 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                </svg>
                Add Topic
              </button>
              <button
                onClick={goToToday}
                className="text-sm text-primary-500 hover:text-primary-600 px-2 py-1"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Topic Timeline */}
        {trainingTopics.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
            <div className="flex flex-wrap gap-2">
              {trainingTopics.map(topic => {
                const colors = categoryColors[topic.category] || categoryColors.custom;
                return (
                  <button
                    key={topic._id}
                    onClick={() => {
                      setEditingTopic(topic);
                      setShowTopicModal(true);
                    }}
                    className={`text-xs px-2 py-1 rounded-full border ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80 transition-opacity flex items-center gap-1.5`}
                    style={topic.color ? { borderColor: topic.color } : {}}
                  >
                    {topic.color && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: topic.color }}
                      />
                    )}
                    {topic.name}
                    <span className="opacity-60">
                      ({new Date(topic.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(topic.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {dayNames.map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarData.map((day, idx) => {
            const daySessions = getSessionsForDate(day.date);
            const dayTopic = getTopicForDate(day.date);
            const hasScheduled = daySessions.some(s => s.type === 'scheduled');
            const hasCompleted = daySessions.some(s => s.type === 'completed');
            const topicColors = dayTopic ? categoryColors[dayTopic.category] || categoryColors.custom : null;

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(day)}
                className={`
                  min-h-[60px] sm:min-h-[80px] p-1 border-b border-r border-gray-100 dark:border-gray-700
                  hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left relative
                  ${!day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-850' : ''}
                  ${isToday(day.date) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                  ${dayTopic && day.isCurrentMonth ? topicColors.bg : ''}
                `}
              >
                {/* Topic indicator bar */}
                {dayTopic && day.isCurrentMonth && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      dayTopic.category === 'offensive' ? 'bg-red-500' :
                      dayTopic.category === 'defensive' ? 'bg-blue-500' :
                      dayTopic.category === 'control' ? 'bg-purple-500' :
                      dayTopic.category === 'transition' ? 'bg-green-500' :
                      dayTopic.category === 'competition' ? 'bg-orange-500' :
                      dayTopic.category === 'fundamentals' ? 'bg-teal-500' :
                      'bg-gray-500'
                    }`}
                    style={{ backgroundColor: dayTopic.color }}
                  />
                )}

                <div className="flex flex-col h-full pt-1">
                  <span className={`
                    text-xs sm:text-sm font-medium mb-1
                    ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                    ${isToday(day.date) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}
                    ${isPast(day.date) && !isToday(day.date) ? 'text-gray-400 dark:text-gray-500' : ''}
                  `}>
                    {day.date.getDate()}
                  </span>

                  {/* Session indicators */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {daySessions.slice(0, 2).map((session, sidx) => (
                      <div
                        key={sidx}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate
                          ${session.type === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'}
                        `}
                      >
                        <span className="hidden sm:inline">{session.name}</span>
                        <span className="sm:hidden">
                          {session.type === 'completed' ? '✓' : '•'}
                        </span>
                      </div>
                    ))}
                    {daySessions.length > 2 && (
                      <div className="text-xs text-gray-400 px-1">
                        +{daySessions.length - 2}
                      </div>
                    )}
                  </div>

                  {/* Dot indicators for mobile */}
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 mt-auto sm:hidden">
                      {hasScheduled && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                      {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-1 rounded bg-purple-500" />
            <span>Topic Period</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDayModal && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          sessions={getSessionsForDate(selectedDate)}
          topic={getTopicForDate(selectedDate)}
          allSessions={sessions}
          onClose={() => {
            setShowDayModal(false);
            setSelectedDate(null);
          }}
          onSchedule={(session, date) => onScheduleSession(session, date)}
          onStart={(session) => {
            setShowDayModal(false);
            onStartSession(session);
          }}
          onEdit={onEditSession}
          onAddTopic={(date) => {
            setShowDayModal(false);
            setEditingTopic({
              _isNew: true,
              startDate: date.toISOString(),
              endDate: new Date(date.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString() // 3 weeks default
            });
            setShowTopicModal(true);
          }}
          onEditTopic={(topic) => {
            setShowDayModal(false);
            setEditingTopic(topic);
            setShowTopicModal(true);
          }}
        />
      )}

      {/* Topic Modal */}
      {showTopicModal && (
        <TopicModal
          topic={editingTopic}
          onClose={() => {
            setShowTopicModal(false);
            setEditingTopic(null);
          }}
          onSave={handleCreateTopic}
          onDelete={editingTopic ? () => handleDeleteTopic(editingTopic._id) : null}
          recentTopics={trainingTopics}
          recentGames={sessions.flatMap(s => s.games || [])}
        />
      )}
    </div>
  );
}

function DayDetailModal({ date, sessions, topic, allSessions, onClose, onSchedule, onStart, onEdit, onAddTopic, onEditTopic }) {
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
  const isToday = date.toDateString() === new Date().toDateString();

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const unscheduledSessions = allSessions.filter(s =>
    !s.scheduledDate || new Date(s.scheduledDate).toDateString() !== date.toDateString()
  );

  const topicColors = topic ? categoryColors[topic.category] || categoryColors.custom : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(date)}
              </h3>
              {isToday && (
                <span className="text-xs text-primary-500">Today</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Topic for this day */}
          {topic ? (
            <div
              className={`p-3 rounded-lg mb-4 border ${topicColors.bg} ${topicColors.border} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onEditTopic && onEditTopic(topic)}
              style={topic.color ? { borderLeftWidth: '4px', borderLeftColor: topic.color } : {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {topic.color && (
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: topic.color }}
                    />
                  )}
                  <span className={`text-xs font-medium uppercase ${topicColors.text}`}>
                    Training Focus
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTopic && onEditTopic(topic);
                  }}
                  className="text-xs text-gray-500 hover:text-primary-500 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path d="M13.488 2.513a1.75 1.75 0 00-2.475 0L6.75 6.774a2.75 2.75 0 00-.596.892l-.848 2.047a.75.75 0 00.98.98l2.047-.848a2.75 2.75 0 00.892-.596l4.261-4.262a1.75 1.75 0 000-2.474z" />
                    <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0114 9v2.25A2.75 2.75 0 0111.25 14h-6.5A2.75 2.75 0 012 11.25v-6.5A2.75 2.75 0 014.75 2H7a.75.75 0 010 1.5H4.75z" />
                  </svg>
                  Edit
                </button>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mt-1">
                {topic.name}
              </h4>
              {topic.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {topic.description}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => onAddTopic(date)}
              className="w-full p-3 mb-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
              </svg>
              Set training topic for this {isPast ? 'past ' : ''}date
            </button>
          )}

          {/* Sessions for this day */}
          {sessions.length > 0 ? (
            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isPast ? 'Sessions on this day' : 'Scheduled Sessions'}
              </h4>
              {sessions.map(session => (
                <div
                  key={session._id}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 dark:text-white truncate">
                        {session.name}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {session.games?.length || 0} games
                        </span>
                        {session.type === 'completed' && (
                          <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                            Completed
                          </span>
                        )}
                        {session.type === 'scheduled' && !isPast && (
                          <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {(!isPast || isToday) && (
                      <button
                        onClick={() => onStart(session)}
                        className="btn-primary text-xs flex-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 mr-1">
                          <path d="M5.25 2.5a.75.75 0 00-1.16.628v9.744a.75.75 0 001.16.628l7.498-4.872a.75.75 0 000-1.256L5.25 2.5z" />
                        </svg>
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(session)}
                      className="btn-secondary text-xs"
                    >
                      Edit
                    </button>
                    {session.type === 'scheduled' && (
                      <button
                        onClick={() => onSchedule(session, null)}
                        className="text-xs text-gray-500 hover:text-red-500 px-2"
                        title="Remove from calendar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm2.78-4.22a.75.75 0 01-1.06 0L8 9.06l-1.72 1.72a.75.75 0 11-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 011.06-1.06L8 6.94l1.72-1.72a.75.75 0 111.06 1.06L9.06 8l1.72 1.72a.75.75 0 010 1.06z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto mb-2 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-sm">No sessions on this day</p>
            </div>
          )}

          {/* Schedule a session button */}
          {!isPast && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              {!showSchedulePicker ? (
                <button
                  onClick={() => setShowSchedulePicker(true)}
                  className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                  </svg>
                  Schedule a session
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Choose a session to schedule
                    </h4>
                    <button
                      onClick={() => setShowSchedulePicker(false)}
                      className="text-xs text-gray-400 hover:text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {unscheduledSessions.length > 0 ? (
                      unscheduledSessions.map(session => (
                        <button
                          key={session._id}
                          onClick={() => {
                            onSchedule(session, date);
                            setShowSchedulePicker(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {session.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {session.games?.length || 0} games
                            </div>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-primary-500">
                            <path fillRule="evenodd" d="M8 14a.75.75 0 01-.75-.75V4.56L4.03 7.78a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06L8.75 4.56v8.69A.75.75 0 018 14z" clipRule="evenodd" />
                          </svg>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        All sessions are already scheduled
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopicModal({ topic, onClose, onSave, onDelete, recentTopics = [], recentGames = [] }) {
  // Check if this is a new topic with pre-filled dates (from clicking a date)
  const isNewWithDates = topic?._isNew;
  const isEditing = topic && !isNewWithDates;

  const [name, setName] = useState(isEditing ? topic.name : '');
  const [description, setDescription] = useState(isEditing ? topic.description || '' : '');
  const [category, setCategory] = useState(isEditing ? topic.category : 'custom');
  const [color, setColor] = useState(isEditing ? topic.color || '' : '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startDate, setStartDate] = useState(
    topic?.startDate
      ? new Date(topic.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    topic?.endDate
      ? new Date(topic.endDate).toISOString().split('T')[0]
      : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 weeks default
  );
  const [goals, setGoals] = useState(isEditing && topic.goals ? topic.goals.join(', ') : '');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const response = await api.post('/ai/suggest-topic', {
        recentTopics: recentTopics.map(t => ({
          name: t.name,
          category: t.category,
          startDate: t.startDate,
          endDate: t.endDate
        })),
        recentGames: recentGames.slice(0, 20).map(g => ({
          name: g.name,
          constraints: g.constraints
        })),
        preferences: {
          preferredDuration: '3 weeks',
          trainingStyle: 'constraint-led'
        }
      });
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion) => {
    setName(suggestion.name);
    setDescription(suggestion.description);
    setCategory(suggestion.category);
    if (suggestion.goals) {
      setGoals(suggestion.goals.join(', '));
    }
    setShowSuggestions(false);
  };

  const categories = [
    { value: 'offensive', label: 'Offensive / Submissions', color: 'bg-red-500' },
    { value: 'defensive', label: 'Defensive / Escapes', color: 'bg-blue-500' },
    { value: 'control', label: 'Control / Passing', color: 'bg-purple-500' },
    { value: 'transition', label: 'Transitions / Scrambles', color: 'bg-green-500' },
    { value: 'competition', label: 'Competition Prep', color: 'bg-orange-500' },
    { value: 'fundamentals', label: 'Fundamentals', color: 'bg-teal-500' },
    { value: 'custom', label: 'Custom', color: 'bg-gray-500' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      description,
      category,
      color: color || null,
      startDate,
      endDate,
      goals: goals.split(',').map(g => g.trim()).filter(Boolean)
    });
  };

  const setDuration = (weeks) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (weeks * 7) - 1);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Training Topic' : 'New Training Topic'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Topic Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Guard Retention Focus"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-sm text-left transition-colors ${
                      category === cat.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Custom Color (optional)</label>
                {color && (
                  <button
                    type="button"
                    onClick={() => setColor('')}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {color ? (
                    <>
                      <span
                        className="w-6 h-6 rounded-full flex-shrink-0 border-2 border-white shadow"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {customColorOptions.find(c => c.value === color)?.name || 'Custom color'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-6 h-6 rounded-full flex-shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-600" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Choose a custom color
                      </span>
                    </>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 ml-auto text-gray-400">
                    <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {showColorPicker && (
                  <div className="absolute z-10 mt-1 w-full p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-6 gap-2">
                      {customColorOptions.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          type="button"
                          onClick={() => {
                            setColor(colorOption.value);
                            setShowColorPicker(false);
                          }}
                          className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                            color === colorOption.value ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                          }`}
                          style={{ backgroundColor: colorOption.value }}
                          title={colorOption.name}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      This color will be shown on the calendar
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's the focus for this period?"
                rows={2}
                className="input resize-none"
              />
            </div>

            {/* AI Suggestions Section */}
            {!isEditing && (
              <div className="border border-primary-200 dark:border-primary-800 rounded-lg p-3 bg-primary-50/50 dark:bg-primary-900/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary-500">
                      <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
                    </svg>
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                      Need ideas?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchSuggestions}
                    disabled={loadingSuggestions}
                    className="text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {loadingSuggestions ? (
                      <>
                        <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Thinking...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M5 4a.75.75 0 01.738.616l.252 1.388A1.25 1.25 0 007.996 7.01l1.388.252a.75.75 0 010 1.476l-1.388.252A1.25 1.25 0 006.99 9.996l-.252 1.388a.75.75 0 01-1.476 0L5.01 9.996A1.25 1.25 0 004.004 8.99l-1.388-.252a.75.75 0 010-1.476l1.388-.252A1.25 1.25 0 005.01 6.004l.252-1.388A.75.75 0 015 4z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M12 2a.75.75 0 01.721.544l.184.736c.052.208.2.356.408.408l.736.184a.75.75 0 010 1.456l-.736.184a.75.75 0 00-.408.408l-.184.736a.75.75 0 01-1.456 0l-.184-.736a.75.75 0 00-.408-.408l-.736-.184a.75.75 0 010-1.456l.736-.184a.75.75 0 00.408-.408l.184-.736A.75.75 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        Get AI Suggestions
                      </>
                    )}
                  </button>
                </div>

                {showSuggestions && (
                  <div className="mt-3 space-y-2">
                    {loadingSuggestions ? (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Analyzing your training history...
                      </div>
                    ) : suggestions.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Based on your training history, here are some suggestions:
                        </p>
                        {suggestions.map((suggestion, idx) => {
                          const sugColors = categoryColors[suggestion.category] || categoryColors.custom;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => applySuggestion(suggestion)}
                              className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${sugColors.bg} ${sugColors.border}`}
                            >
                              <div className="flex items-start gap-2">
                                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  suggestion.category === 'offensive' ? 'bg-red-500' :
                                  suggestion.category === 'defensive' ? 'bg-blue-500' :
                                  suggestion.category === 'control' ? 'bg-purple-500' :
                                  suggestion.category === 'transition' ? 'bg-green-500' :
                                  suggestion.category === 'competition' ? 'bg-orange-500' :
                                  suggestion.category === 'fundamentals' ? 'bg-teal-500' :
                                  'bg-gray-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                                    {suggestion.name}
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {suggestion.description}
                                  </p>
                                  {suggestion.reasoning && (
                                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 italic">
                                      {suggestion.reasoning}
                                    </p>
                                  )}
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                                  <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-center py-3 text-sm text-gray-500">
                        No suggestions available. Try adding more training history.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                  min={startDate}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDuration(2)}
                className="chip text-xs"
              >
                2 weeks
              </button>
              <button
                type="button"
                onClick={() => setDuration(3)}
                className="chip text-xs"
              >
                3 weeks
              </button>
              <button
                type="button"
                onClick={() => setDuration(4)}
                className="chip text-xs"
              >
                4 weeks
              </button>
            </div>

            <div>
              <label className="label">Goals (comma-separated, optional)</label>
              <input
                type="text"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g., Improve hip escapes, Work on frames"
                className="input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger text-sm"
                  title="Delete topic"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {isEditing ? 'Save' : 'Create Topic'}
              </button>
            </div>
          </form>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
              <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                  Delete Topic
                </h3>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete "{name || topic?.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setIsDeleting(true);
                      await onDelete();
                      setIsDeleting(false);
                      onClose();
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting && (
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
