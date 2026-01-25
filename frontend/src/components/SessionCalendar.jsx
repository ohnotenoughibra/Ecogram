import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const topicColors = {
  offensive: 'bg-red-500',
  defensive: 'bg-blue-500',
  control: 'bg-purple-500',
  transition: 'bg-green-500'
};

export default function SessionCalendar({
  sessions,
  onScheduleSession,
  onEditSession,
  onDeleteSession,
  onStartSession
}) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Build array of days including padding
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
      // Check scheduledDate
      if (session.scheduledDate) {
        const dateKey = new Date(session.scheduledDate).toDateString();
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push({ ...session, type: 'scheduled' });
      }
      // Check lastUsed (completed sessions)
      if (session.lastUsed) {
        const dateKey = new Date(session.lastUsed).toDateString();
        if (!map[dateKey]) map[dateKey] = [];
        // Avoid duplicates if scheduled and completed on same day
        if (!map[dateKey].find(s => s._id === session._id)) {
          map[dateKey].push({ ...session, type: 'completed' });
        }
      }
    });
    return map;
  }, [sessions]);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
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
          const hasScheduled = daySessions.some(s => s.type === 'scheduled');
          const hasCompleted = daySessions.some(s => s.type === 'completed');

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[60px] sm:min-h-[80px] p-1 border-b border-r border-gray-100 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left
                ${!day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-850' : ''}
                ${isToday(day.date) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
              `}
            >
              <div className="flex flex-col h-full">
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
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary-500" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDayModal && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          sessions={getSessionsForDate(selectedDate)}
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
        />
      )}
    </div>
  );
}

function DayDetailModal({ date, sessions, allSessions, onClose, onSchedule, onStart, onEdit }) {
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

  // Sessions not scheduled for this date (for scheduling picker)
  const unscheduledSessions = allSessions.filter(s =>
    !s.scheduledDate || new Date(s.scheduledDate).toDateString() !== date.toDateString()
  );

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

                      {/* Game preview */}
                      {session.games && session.games.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {session.games.slice(0, 5).map((g, idx) => (
                            <span
                              key={idx}
                              className={`w-2 h-2 rounded-full ${
                                g.game?.topic ? {
                                  offensive: 'bg-red-500',
                                  defensive: 'bg-blue-500',
                                  control: 'bg-purple-500',
                                  transition: 'bg-green-500'
                                }[g.game.topic] : 'bg-gray-400'
                              }`}
                              title={g.game?.name}
                            />
                          ))}
                          {session.games.length > 5 && (
                            <span className="text-xs text-gray-400">+{session.games.length - 5}</span>
                          )}
                        </div>
                      )}
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
