import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SessionItem from '../components/SessionItem';
import SessionCalendar from '../components/SessionCalendar';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import SmartSessionBuilder from '../components/SmartSessionBuilder';
import QuickClassBuilder from '../components/QuickClassBuilder';
import api from '../utils/api';

export default function Sessions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showSmartBuilder, setShowSmartBuilder] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingSession, setSharingSession] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'upcoming' | 'recent' | 'favorites' | 'templates'
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [sessionToSaveAsTemplate, setSessionToSaveAsTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [showUseTemplateModal, setShowUseTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showQuickBuilder, setShowQuickBuilder] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchTemplates();
  }, []);

  // Handle ?new=true query parameter from QuickActions
  useEffect(() => {
    const isNew = searchParams.get('new');
    if (isNew === 'true') {
      setEditingSession(null);
      setSessionName('');
      setScheduledDate('');
      setShowCreateModal(true);
      // Clear the query param after opening
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/sessions/templates/all');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

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

  // Filter sessions based on active tab (exclude templates from regular sessions)
  const filteredSessions = useMemo(() => {
    const nonTemplateSessions = sessions.filter(s => !s.isTemplate);
    switch (filterTab) {
      case 'upcoming':
        return categorizedSessions.upcoming.filter(s => !s.isTemplate);
      case 'recent':
        return categorizedSessions.recent.filter(s => !s.isTemplate);
      case 'favorites':
        return categorizedSessions.favorites.filter(s => !s.isTemplate);
      case 'templates':
        return []; // Templates displayed separately
      default:
        return nonTemplateSessions;
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

  const handleSaveAsTemplate = (session) => {
    setSessionToSaveAsTemplate(session);
    setTemplateName(session.name);
    setTemplateDescription('');
    setShowTemplateModal(true);
  };

  const handleConfirmSaveTemplate = async () => {
    if (!sessionToSaveAsTemplate) return;

    try {
      await api.post(`/sessions/${sessionToSaveAsTemplate._id}/save-as-template`, {
        templateName: templateName || sessionToSaveAsTemplate.name,
        templateDescription
      });
      showToast('Saved as template!', 'success');
      fetchTemplates();
      setShowTemplateModal(false);
      setSessionToSaveAsTemplate(null);
    } catch (error) {
      showToast('Failed to save template', 'error');
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setSessionName(template.templateName || template.name);
    setScheduledDate('');
    setShowUseTemplateModal(true);
  };

  const handleCreateFromTemplate = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      const response = await api.post(`/sessions/from-template/${selectedTemplate._id}`, {
        name: sessionName,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null
      });
      showToast('Session created from template!', 'success');
      fetchSessions();
      setShowUseTemplateModal(false);
      setSelectedTemplate(null);
      navigate(`/session/${response.data._id}`);
    } catch (error) {
      showToast('Failed to create session', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Delete this template?')) return;

    try {
      await api.delete(`/sessions/templates/${templateId}`);
      showToast('Template deleted', 'success');
      fetchTemplates();
    } catch (error) {
      showToast('Failed to delete template', 'error');
    }
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickBuilder(true)}
            className="btn-secondary"
            title="Build a class by position"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
              <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.061 1.062L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
            Quick Build
          </button>
          <button
            onClick={() => setShowSmartBuilder(true)}
            className="btn-secondary"
            title="Auto-generate a balanced session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
              <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
            </svg>
            Smart Build
          </button>
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
            { key: 'all', label: 'All', count: sessions.filter(s => !s.isTemplate).length },
            { key: 'upcoming', label: 'Upcoming', count: categorizedSessions.upcoming.length },
            { key: 'recent', label: 'Recent', count: categorizedSessions.recent.length },
            { key: 'favorites', label: 'Favorites', count: categorizedSessions.favorites.length },
            { key: 'templates', label: 'Templates', count: templates.length, icon: '📋' }
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
          {filterTab === 'templates' ? (
            /* Templates View */
            <div>
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Templates Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                    Save your favorite sessions as templates to quickly create similar training plans.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map(template => (
                    <div key={template._id} className="card p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📋</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {template.templateName || template.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {template.games?.length || 0} games
                              {template.usageCount > 0 && ` • Used ${template.usageCount}x`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(template._id)}
                          className="btn-icon text-gray-400 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.3l.815 8.15A1.5 1.5 0 005.357 15h5.285a1.5 1.5 0 001.493-1.35l.815-8.15h.3a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75a.75.75 0 00-.75.75V4h3v-.75a.75.75 0 00-.75-.75h-1.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>

                      {template.templateDescription && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {template.templateDescription}
                        </p>
                      )}

                      {/* Games preview */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.games?.slice(0, 4).map((g, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded truncate max-w-[100px]"
                          >
                            {g.game?.name || 'Game'}
                          </span>
                        ))}
                        {template.games?.length > 4 && (
                          <span className="text-xs text-gray-400">
                            +{template.games.length - 4} more
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="btn-primary w-full text-sm"
                      >
                        Use This Template
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-4">
              {filteredSessions.map(session => (
                <SessionItem
                  key={session._id}
                  session={session}
                  onEdit={handleEditSession}
                  onDelete={handleDeleteClick}
                  onShare={handleShare}
                  onSessionUpdate={handleSessionUpdate}
                  onSaveAsTemplate={handleSaveAsTemplate}
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
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSessionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Session"
        message={`Are you sure you want to delete "${sessionToDelete?.name}"? This will not delete the games in the session.`}
        confirmText="Delete"
        type="danger"
      />

      {/* Smart Session Builder */}
      <SmartSessionBuilder
        isOpen={showSmartBuilder}
        onClose={() => setShowSmartBuilder(false)}
        onSessionCreated={() => fetchSessions()}
      />

      {/* Quick Class Builder */}
      <QuickClassBuilder
        isOpen={showQuickBuilder}
        onClose={() => setShowQuickBuilder(false)}
        onSessionCreated={() => fetchSessions()}
      />

      {/* Save as Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Save as Template
                  </h3>
                  <p className="text-sm text-gray-500">
                    Reuse this session structure
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Tuesday Guard Session"
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">
                    Description
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="What makes this session special?"
                    rows={2}
                    className="input resize-none"
                  />
                </div>

                {sessionToSaveAsTemplate && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This template will include {sessionToSaveAsTemplate.games?.length || 0} games
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSaveTemplate}
                  className="btn-primary flex-1"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Use Template Modal */}
      {showUseTemplateModal && selectedTemplate && (
        <div className="modal-overlay" onClick={() => setShowUseTemplateModal(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create from Template
              </h3>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedTemplate.templateName || selectedTemplate.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedTemplate.games?.length || 0} games
                </p>
              </div>

              <form onSubmit={handleCreateFromTemplate}>
                <div className="space-y-4">
                  <div>
                    <label className="label">Session Name</label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Name your session"
                      className="input"
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
                    onClick={() => setShowUseTemplateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Create Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
