import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SessionItem from '../components/SessionItem';
import SessionCalendar from '../components/SessionCalendar';
import ConfirmModal from '../components/ConfirmModal';
import Loading from '../components/Loading';
import api from '../utils/api';

export default function Sessions() {
  const navigate = useNavigate();
  const {
    sessions,
    sessionsLoading,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    showToast
  } = useApp();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingSession, setSharingSession] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'upcoming' | 'recent' | 'favorites'

  useEffect(() => {
    fetchSessions();
  }, []);

  // Smart session categorization
  const categorizedSessions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const upcoming = sessions.filter(s => {
      if (!s.scheduledDate) return false;
      const scheduled = new Date(s.scheduledDate);
      return scheduled >= today && scheduled <= weekFromNow;
    }).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    const recent = sessions.filter(s => {
      if (!s.lastUsed) return false;
      const lastUsed = new Date(s.lastUsed);
      return lastUsed >= weekAgo;
    }).sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));

    const favorites = sessions.filter(s => s.favorite);

    const todaySessions = sessions.filter(s => {
      if (s.scheduledDate) {
        const scheduled = new Date(s.scheduledDate);
        return scheduled.toDateString() === today.toDateString();
      }
      return false;
    });

    return { upcoming, recent, favorites, todaySessions };
  }, [sessions]);

  // Filter sessions based on active tab
  const filteredSessions = useMemo(() => {
    switch (filterTab) {
      case 'upcoming':
        return categorizedSessions.upcoming;
      case 'recent':
        return categorizedSessions.recent;
      case 'favorites':
        return categorizedSessions.favorites;
      default:
        return sessions;
    }
  }, [sessions, filterTab, categorizedSessions]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim()) return;

    const sessionData = {
      name: sessionName,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null
    };

    if (editingSession) {
      await updateSession(editingSession._id, sessionData);
    } else {
      await createSession({ ...sessionData, gameIds: [] });
    }

    setShowCreateModal(false);
    setEditingSession(null);
    setSessionName('');
    setScheduledDate('');
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionName(session.name);
    setScheduledDate(session.scheduledDate
      ? new Date(session.scheduledDate).toISOString().split('T')[0]
      : '');
    setShowCreateModal(true);
  };

  const handleDeleteClick = (session) => {
    setSessionToDelete(session);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (sessionToDelete) {
      await deleteSession(sessionToDelete._id);
      setSessionToDelete(null);
    }
  };

  const handleShare = async (session) => {
    setSharingSession(session);
    setShowShareModal(true);

    try {
      const response = await api.post(`/share/session/${session._id}`);
      setShareUrl(response.data.shareUrl);
    } catch (error) {
      showToast('Failed to generate share link', 'error');
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard', 'success');
  };

  const handleSessionUpdate = (updatedSession) => {
    fetchSessions();
  };

  const handleScheduleSession = async (session, date) => {
    try {
      await updateSession(session._id, {
        scheduledDate: date ? date.toISOString() : null
      });
      showToast(date ? 'Session scheduled' : 'Session unscheduled', 'success');
    } catch (error) {
      showToast('Failed to update schedule', 'error');
    }
  };

  const handleStartSession = (session) => {
    navigate(`/session/${session._id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-primary-500">
              <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
            </svg>
            Sessions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Plan and track your training sessions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSession(null);
            setSessionName('');
            setScheduledDate('');
            setShowCreateModal(true);
          }}
          className="btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Session
        </button>
      </div>

      {/* Today's Quick Start */}
      {categorizedSessions.todaySessions.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Today's Training</h3>
              <p className="text-sm text-primary-100">
                {categorizedSessions.todaySessions[0].name}
                {categorizedSessions.todaySessions.length > 1 &&
                  ` +${categorizedSessions.todaySessions.length - 1} more`}
              </p>
            </div>
            <button
              onClick={() => handleStartSession(categorizedSessions.todaySessions[0])}
              className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              Start Now
            </button>
          </div>
        </div>
      )}

      {/* View Toggle & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All', count: sessions.length },
            { key: 'upcoming', label: 'Upcoming', count: categorizedSessions.upcoming.length },
            { key: 'recent', label: 'Recent', count: categorizedSessions.recent.length },
            { key: 'favorites', label: 'Favorites', count: categorizedSessions.favorites.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterTab === tab.key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                  filterTab === tab.key
                    ? 'bg-primary-200 dark:bg-primary-800'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline mr-1">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
            </svg>
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline mr-1">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
            </svg>
            Calendar
          </button>
        </div>
      </div>

      {/* Content */}
      {sessionsLoading && sessions.length === 0 ? (
        <Loading text="Loading sessions..." />
      ) : sessions.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No sessions yet</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Create a session to organize your training games.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary mt-4"
          >
            Create your first session
          </button>
        </div>
      ) : viewMode === 'calendar' ? (
        <SessionCalendar
          sessions={sessions}
          onScheduleSession={handleScheduleSession}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteClick}
          onStartSession={handleStartSession}
        />
      ) : (
        <>
          {/* Smart Insights */}
          {filterTab === 'all' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sessions.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-primary-500">
                  {categorizedSessions.upcoming.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Upcoming</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-green-500">
                  {categorizedSessions.recent.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">This Week</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-yellow-500">
                  {categorizedSessions.favorites.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
              </div>
            </div>
          )}

          {/* Sessions List */}
          {filteredSessions.length > 0 ? (
            <div className="space-y-4">
              {filteredSessions.map(session => (
                <SessionItem
                  key={session._id}
                  session={session}
                  onEdit={handleEditSession}
                  onDelete={handleDeleteClick}
                  onShare={handleShare}
                  onSessionUpdate={handleSessionUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No sessions in this category</p>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Session Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingSession ? 'Edit Session' : 'Create New Session'}
              </h3>
              <form onSubmit={handleCreateSession}>
                <div className="space-y-4">
                  <div>
                    <label className="label">Session Name</label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., Tuesday Guard Work"
                      className="input"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      Schedule Date
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingSession ? 'Save' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Share Session
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Anyone with this link can view "{sharingSession?.name}"
              </p>

              {shareUrl ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="input flex-1 text-sm"
                    />
                    <button
                      onClick={copyShareUrl}
                      className="btn-primary"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Logged-in users can copy this session to their library.
                  </p>
                </div>
              ) : (
                <div className="flex justify-center py-4">
                  <span className="spinner" />
                </div>
              )}

              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSharingSession(null);
                  setShareUrl('');
                }}
                className="btn-secondary w-full mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSessionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Session"
        message={`Are you sure you want to delete "${sessionToDelete?.name}"? This will not delete the games in the session.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
