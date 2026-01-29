import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
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
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
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
  const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // Topic management state
  const [trainingTopics, setTrainingTopics] = useState([]);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  useEffect(() => {
    fetchSessions();
    fetchTemplates();
    fetchTopics();
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

  // Handle smart playlist navigation - create session from selected games
  useEffect(() => {
    const handleSmartPlaylist = async () => {
      if (location.state?.smartPlaylist && location.state?.gameIds) {
        const { smartPlaylist, gameIds } = location.state;
        // Clear the state to prevent re-triggering
        window.history.replaceState({}, document.title);

        try {
          // Create a session with the selected games
          const playlistNames = {
            'not-trained-30': 'Not Trained Recently',
            'never-used': 'Never Used Games',
            'high-difficulty': 'Advanced Challenge',
            'beginner-friendly': 'Beginner Friendly',
            'top-rated': 'Top Performers',
            'most-used': 'Favorites',
            'recently-added': 'Recently Added',
            'warmup-games': 'Warmup Collection',
            'favorites-stale': 'Forgotten Favorites',
            'leg-lock-focus': 'Leg Lock Focus'
          };

          const sessionName = playlistNames[smartPlaylist] || 'Smart Playlist Session';
          const response = await api.post('/sessions', {
            name: `${sessionName} - ${new Date().toLocaleDateString()}`,
            gameIds: gameIds
          });

          await fetchSessions();
          showToast(`Session created with ${gameIds.length} games!`, 'success');

          // Navigate to the new session
          navigate(`/session/${response.data._id}`);
        } catch (error) {
          console.error('Failed to create session from playlist:', error);
          showToast('Failed to create session from playlist', 'error');
        }
      }
    };

    handleSmartPlaylist();
  }, [location.state]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/sessions/templates/all');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const response = await api.get('/topics', {
        params: { startDate, endDate, active: true }
      });
      setTrainingTopics(response.data);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    }
  };

  // Get current topic
  const currentTopic = useMemo(() => {
    const today = new Date();
    return trainingTopics.find(topic => {
      const start = new Date(topic.startDate);
      const end = new Date(topic.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });
  }, [trainingTopics]);

  // Calculate topic balance for calendar
  const topicBalance = useMemo(() => {
    const counts = { offensive: 0, defensive: 0, control: 0, transition: 0 };
    trainingTopics.forEach(topic => {
      if (counts.hasOwnProperty(topic.category)) {
        counts[topic.category]++;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { counts, total };
  }, [trainingTopics]);

  const handleCreateTopic = async (topicData) => {
    try {
      if (editingTopic && !editingTopic._isNew) {
        await api.put(`/topics/${editingTopic._id}`, topicData);
        showToast('Topic updated', 'success');
      } else {
        await api.post('/topics', topicData);
        showToast('Topic created', 'success');
      }
      fetchTopics();
      setShowTopicModal(false);
      setEditingTopic(null);
    } catch (err) {
      showToast('Failed to save topic', 'error');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await api.delete(`/topics/${topicId}`);
      showToast('Topic deleted', 'success');
      fetchTopics();
    } catch (err) {
      showToast('Failed to delete topic', 'error');
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
    if (!sessionName.trim() || isCreatingSession) return;

    setIsCreatingSession(true);
    const sessionData = {
      name: sessionName,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null
    };

    try {
      if (editingSession) {
        await updateSession(editingSession._id, sessionData);
      } else {
        await createSession({ ...sessionData, gameIds: [] });
      }

      setShowCreateModal(false);
      setEditingSession(null);
      setSessionName('');
      setScheduledDate('');
    } finally {
      setIsCreatingSession(false);
    }
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
    if (sessionToDelete && !isDeletingSession) {
      const sessionId = sessionToDelete._id;
      setIsDeletingSession(true);
      // Close dialog immediately for better UX
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
      await deleteSession(sessionId);
      setIsDeletingSession(false);
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

  const [copied, setCopied] = useState(false);

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
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

  const handleDeleteTemplateClick = (template) => {
    setTemplateToDelete(template);
    setShowDeleteTemplateConfirm(true);
  };

  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    setIsDeletingTemplate(true);
    try {
      await api.delete(`/sessions/templates/${templateToDelete._id}`);
      showToast('Template deleted', 'success');
      fetchTemplates();
    } catch (error) {
      showToast('Failed to delete template', 'error');
    } finally {
      setIsDeletingTemplate(false);
      setShowDeleteTemplateConfirm(false);
      setTemplateToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Sessions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Plan and track your training sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Build options grouped as subtle secondary actions */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setShowQuickBuilder(true)}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-sm transition-all flex items-center gap-1.5"
              title="Build a class by position"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 018 1zM4.11 2.111a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.061 1.062L4.11 3.172a.75.75 0 010-1.06zm7.78 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0z" clipRule="evenodd" />
              </svg>
              Quick
            </button>
            <button
              onClick={() => setShowSmartBuilder(true)}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-sm transition-all flex items-center gap-1.5"
              title="Auto-generate a balanced session"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M13.442 1.543a.75.75 0 00-1.384 0l-.18.54a.75.75 0 01-.47.47l-.54.18a.75.75 0 000 1.384l.54.18a.75.75 0 01.47.47l.18.54a.75.75 0 001.384 0l.18-.54a.75.75 0 01.47-.47l.54-.18a.75.75 0 000-1.384l-.54-.18a.75.75 0 01-.47-.47l-.18-.54zM5.839 4.728a.75.75 0 00-1.378 0l-.475 1.137a.75.75 0 01-.424.424l-1.137.475a.75.75 0 000 1.378l1.137.475a.75.75 0 01.424.424l.475 1.137a.75.75 0 001.378 0l.475-1.137a.75.75 0 01.424-.424l1.137-.475a.75.75 0 000-1.378l-1.137-.475a.75.75 0 01-.424-.424l-.475-1.137z" />
              </svg>
              Smart
            </button>
          </div>
          {/* Primary action */}
          <button
            onClick={() => {
              setEditingSession(null);
              setSessionName('');
              setScheduledDate('');
              setShowCreateModal(true);
            }}
            className="btn-primary shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Session
          </button>
        </div>
      </div>

      {/* Today's Quick Start - More prominent with multiple sessions */}
      {categorizedSessions.todaySessions.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl text-white overflow-hidden shadow-lg shadow-primary-500/20">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M1 8a7 7 0 1114 0A7 7 0 011 8zm7.75-4.25a.75.75 0 00-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 000-1.5h-2.5v-3.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Today's Training</h3>
            </div>
            <div className="space-y-2">
              {categorizedSessions.todaySessions.map((todaySession, idx) => (
                <div key={todaySession._id} className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-mono text-primary-200">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{todaySession.name}</p>
                      <p className="text-xs text-primary-200">{todaySession.games?.length || 0} games</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartSession(todaySession)}
                    className="flex-shrink-0 px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors text-sm shadow-sm"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Toggle & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {/* Filter Tabs - With icons */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {[
            {
              key: 'all',
              label: 'All',
              count: sessions.filter(s => !s.isTemplate).length,
              icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h8.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0012.25 5H9.164a.25.25 0 01-.177-.073L7.823 3.513A1.75 1.75 0 006.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v2.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-2.5A1.75 1.75 0 0012.25 9H3.75z" /></svg>
            },
            {
              key: 'upcoming',
              label: 'Upcoming',
              count: categorizedSessions.upcoming.length,
              icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4 1.75a.75.75 0 01.75.75V3h6.5V2.5a.75.75 0 011.5 0V3h.25A2.75 2.75 0 0115.75 5.75v7.5A2.75 2.75 0 0113 16H3A2.75 2.75 0 01.25 13.25v-7.5A2.75 2.75 0 013 3h.25V2.5A.75.75 0 014 1.75zM1.75 7.75v5.5c0 .69.56 1.25 1.25 1.25h10c.69 0 1.25-.56 1.25-1.25v-5.5H1.75z" clipRule="evenodd" /></svg>
            },
            {
              key: 'recent',
              label: 'Recent',
              count: categorizedSessions.recent.length,
              icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M1 8a7 7 0 1114 0A7 7 0 011 8zm7.75-4.25a.75.75 0 00-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 000-1.5h-2.5v-3.5z" clipRule="evenodd" /></svg>
            },
            {
              key: 'favorites',
              label: 'Favorites',
              count: categorizedSessions.favorites.length,
              icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M7.433 1.963a.612.612 0 011.134 0l1.358 3.386a.612.612 0 00.494.376l3.6.389c.53.058.744.716.36 1.107l-2.698 2.756a.612.612 0 00-.189.584l.75 3.64c.107.52-.443.92-.917.672l-3.14-1.646a.612.612 0 00-.57 0l-3.14 1.646c-.474.249-1.024-.152-.917-.672l.75-3.64a.612.612 0 00-.189-.584L1.621 7.221c-.384-.39-.17-1.05.36-1.107l3.6-.389a.612.612 0 00.494-.376L7.433 1.963z" /></svg>
            },
            {
              key: 'templates',
              label: 'Templates',
              count: templates.length,
              icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M5 3.5A1.5 1.5 0 016.5 2h3a1.5 1.5 0 011.5 1.5V5h2.5A1.5 1.5 0 0115 6.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-7A1.5 1.5 0 012.5 5H5V3.5zm1.5 0V5h3V3.5a.5.5 0 00-.5-.5h-2a.5.5 0 00-.5.5z" /></svg>
            }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filterTab === tab.key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className={filterTab === tab.key ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}>
                {tab.icon}
              </span>
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  filterTab === tab.key
                    ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M2 4a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4zm0 4a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 8zm0 4a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 12z" clipRule="evenodd" />
            </svg>
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4 1.75a.75.75 0 01.75.75V3h6.5V2.5a.75.75 0 011.5 0V3h.25A2.75 2.75 0 0115.75 5.75v7.5A2.75 2.75 0 0113 16H3A2.75 2.75 0 01.25 13.25v-7.5A2.75 2.75 0 013 3h.25V2.5A.75.75 0 014 1.75zM1.75 7.75v5.5c0 .69.56 1.25 1.25 1.25h10c.69 0 1.25-.56 1.25-1.25v-5.5H1.75z" clipRule="evenodd" />
            </svg>
            Calendar
          </button>
        </div>
      </div>

      {/* Content */}
      {sessionsLoading && sessions.length === 0 ? (
        <Loading text="Loading sessions..." />
      ) : viewMode === 'calendar' ? (
        <SessionCalendar
          sessions={sessions}
          onScheduleSession={handleScheduleSession}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteClick}
          onStartSession={handleStartSession}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Current Topic & Topic Balance Section */}
          {filterTab === 'all' && (
            <div className="mb-6 space-y-4">
              {/* Current Topic Banner */}
              {currentTopic ? (
                <div
                  className={`p-4 rounded-xl border-2 ${
                    currentTopic.category === 'offensive' ? 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700' :
                    currentTopic.category === 'defensive' ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' :
                    currentTopic.category === 'control' ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700' :
                    currentTopic.category === 'transition' ? 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700' :
                    'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}
                  style={currentTopic.color ? { borderLeftWidth: '6px', borderLeftColor: currentTopic.color } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {currentTopic.color && (
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: currentTopic.color }} />
                        )}
                        <span className={`text-xs font-medium uppercase ${
                          currentTopic.category === 'offensive' ? 'text-red-700 dark:text-red-400' :
                          currentTopic.category === 'defensive' ? 'text-blue-700 dark:text-blue-400' :
                          currentTopic.category === 'control' ? 'text-purple-700 dark:text-purple-400' :
                          currentTopic.category === 'transition' ? 'text-green-700 dark:text-green-400' :
                          'text-gray-700 dark:text-gray-400'
                        }`}>
                          Current Focus
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.ceil((new Date(currentTopic.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">{currentTopic.name}</h3>
                      {currentTopic.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentTopic.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setEditingTopic(currentTopic); setShowTopicModal(true); }}
                      className="btn-secondary text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  {currentTopic.goals && currentTopic.goals.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {currentTopic.goals.map((goal, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full">{goal}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => { setEditingTopic(null); setShowTopicModal(true); }}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                  </svg>
                  Set a training topic to focus your sessions
                </button>
              )}

              {/* Topic Balance Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
                      <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505l6.418 1.069a.75.75 0 11-.246 1.48l-6.172-1.029a.75.75 0 01-.378-.146l-.016.006-.016-.006a.75.75 0 01-.378.146l-6.172 1.03a.75.75 0 01-.246-1.481L10 16.014V5.509a31.743 31.743 0 00-3.339.254l1.77 7.85a.75.75 0 01-.387.83A4.981 4.981 0 015 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.702-7.545a31.28 31.28 0 00-1.103.232.75.75 0 11-.336-1.462 33.186 33.186 0 016.668-.829V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
                    </svg>
                    Topic Balance
                  </h3>
                  <button
                    onClick={() => { setEditingTopic(null); setShowTopicModal(true); }}
                    className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                    </svg>
                    Add Topic
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Diversify your training by balancing topics across your calendar
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
                      const percentage = topicBalance.total > 0 ? (count / topicBalance.total) * 100 : 0;
                      const isLow = count === 0 || (count < topicBalance.total / 4 * 0.5);
                      return (
                        <div key={t.key}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1.5">
                              <span>{t.icon}</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{t.label}</span>
                              {isLow && topicBalance.total > 2 && (
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
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    <p>No training topics scheduled yet</p>
                    <p className="text-xs mt-1">Add topics to track your training focus over time</p>
                  </div>
                )}
                {/* Active Topics List */}
                {trainingTopics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Active & Upcoming Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {trainingTopics.slice(0, 5).map(topic => (
                        <button
                          key={topic._id}
                          onClick={() => { setEditingTopic(topic); setShowTopicModal(true); }}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors hover:shadow-sm ${
                            topic.category === 'offensive' ? 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400' :
                            topic.category === 'defensive' ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' :
                            topic.category === 'control' ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400' :
                            topic.category === 'transition' ? 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400' :
                            'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400'
                          }`}
                          style={topic.color ? { borderColor: topic.color } : {}}
                        >
                          {topic.color && <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: topic.color }} />}
                          {topic.name}
                        </button>
                      ))}
                      {trainingTopics.length > 5 && (
                        <span className="text-xs text-gray-400 py-1">+{trainingTopics.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Smart Insights - Compact inline stats */}
          {filterTab === 'all' && sessions.filter(s => !s.isTemplate).length > 0 && (
            <div className="flex items-center gap-4 mb-6 px-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-base font-bold text-gray-700 dark:text-gray-300">{sessions.filter(s => !s.isTemplate).length}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Total</span>
              </div>
              {categorizedSessions.upcoming.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <span className="text-base font-bold text-primary-600 dark:text-primary-400">{categorizedSessions.upcoming.length}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Upcoming</span>
                </div>
              )}
              {categorizedSessions.recent.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <span className="text-base font-bold text-green-600 dark:text-green-400">{categorizedSessions.recent.length}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">This Week</span>
                </div>
              )}
              {categorizedSessions.favorites.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                    <span className="text-base font-bold text-yellow-600 dark:text-yellow-400">{categorizedSessions.favorites.length}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Favorites</span>
                </div>
              )}
            </div>
          )}

          {/* Sessions List */}
          {filterTab === 'templates' ? (
            /* Templates View */
            <div>
              {templates.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-purple-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Templates Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Save your sessions as templates to quickly replicate training plans.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map(template => (
                    <div key={template._id} className="card p-4 hover:shadow-md transition-all group border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5 text-purple-500">
                              <path d="M5 3.5A1.5 1.5 0 016.5 2h3a1.5 1.5 0 011.5 1.5V5h2.5A1.5 1.5 0 0115 6.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-7A1.5 1.5 0 012.5 5H5V3.5zm1.5 0V5h3V3.5a.5.5 0 00-.5-.5h-2a.5.5 0 00-.5.5z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {template.templateName || template.name}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <span>{template.games?.length || 0} games</span>
                              {template.usageCount > 0 && (
                                <span className="text-purple-500">Used {template.usageCount}x</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplateClick(template)}
                          className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete template"
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
                      {template.games?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {template.games?.slice(0, 4).map((g, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md truncate max-w-[120px]"
                            >
                              {g.game?.name || 'Game'}
                            </span>
                          ))}
                          {template.games?.length > 4 && (
                            <span className="text-xs text-gray-400 py-1">
                              +{template.games.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="w-full py-2.5 px-4 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                          <path d="M6.3 2.841A1.5 1.5 0 005 4.11V11.89a1.5 1.5 0 002.3 1.269l5.344-3.89a1.5 1.5 0 000-2.538L7.3 2.84z" />
                        </svg>
                        Use Template
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
          ) : sessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Build Your First Session</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                Group your training games into structured sessions for class.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setEditingSession(null);
                    setSessionName('');
                    setScheduledDate('');
                    setShowCreateModal(true);
                  }}
                  className="btn-primary shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Create Session
                </button>
                <button
                  onClick={() => setShowSmartBuilder(true)}
                  className="btn-secondary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1">
                    <path d="M13.442 1.543a.75.75 0 00-1.384 0l-.18.54a.75.75 0 01-.47.47l-.54.18a.75.75 0 000 1.384l.54.18a.75.75 0 01.47.47l.18.54a.75.75 0 001.384 0l.18-.54a.75.75 0 01.47-.47l.54-.18a.75.75 0 000-1.384l-.54-.18a.75.75 0 01-.47-.47l-.18-.54zM5.839 4.728a.75.75 0 00-1.378 0l-.475 1.137a.75.75 0 01-.424.424l-1.137.475a.75.75 0 000 1.378l1.137.475a.75.75 0 01.424.424l.475 1.137a.75.75 0 001.378 0l.475-1.137a.75.75 0 01.424-.424l1.137-.475a.75.75 0 000-1.378l-1.137-.475a.75.75 0 01-.424-.424l-.475-1.137z" />
                  </svg>
                  Smart Build
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No sessions match this filter</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different category or create a new session</p>
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
                    {/* Quick name suggestions */}
                    {!editingSession && !sessionName && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[
                          `${new Date().toLocaleDateString('en-US', { weekday: 'long' })} Class`,
                          'Guard Work',
                          'Passing Drills',
                          'Submission Hunt',
                          'Defense Focus',
                          'Open Mat'
                        ].map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setSessionName(suggestion)}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
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
                    disabled={isCreatingSession}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={isCreatingSession || !sessionName.trim()}
                  >
                    {isCreatingSession && (
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isCreatingSession ? 'Creating...' : (editingSession ? 'Save' : 'Create')}
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
                      className={`btn-primary min-w-[70px] ${copied ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
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
          if (!isDeletingSession) {
            setShowDeleteConfirm(false);
            setSessionToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Session"
        message={`Are you sure you want to delete "${sessionToDelete?.name || 'this session'}"? This will not delete the games in the session.`}
        confirmText="Delete"
        type="danger"
        loading={isDeletingSession}
      />

      {/* Delete Template Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteTemplateConfirm}
        onClose={() => {
          setShowDeleteTemplateConfirm(false);
          setTemplateToDelete(null);
        }}
        onConfirm={handleConfirmDeleteTemplate}
        title="Delete Template"
        message={`Are you sure you want to delete the template "${templateToDelete?.templateName || templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={isDeletingTemplate}
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

      {/* Topic Modal */}
      {showTopicModal && (
        <TopicModal
          topic={editingTopic}
          onClose={() => { setShowTopicModal(false); setEditingTopic(null); }}
          onSave={handleCreateTopic}
          onDelete={editingTopic && !editingTopic._isNew ? () => handleDeleteTopic(editingTopic._id) : null}
        />
      )}
    </div>
  );
}

// Topic Modal Component
function TopicModal({ topic, onClose, onSave, onDelete }) {
  const isEditing = topic && !topic._isNew;
  const [name, setName] = useState(isEditing ? topic.name : '');
  const [description, setDescription] = useState(isEditing ? topic.description || '' : '');
  const [category, setCategory] = useState(isEditing ? topic.category : 'custom');
  const [color, setColor] = useState(isEditing ? topic.color || '' : '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [startDate, setStartDate] = useState(
    topic?.startDate ? new Date(topic.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    topic?.endDate ? new Date(topic.endDate).toISOString().split('T')[0] : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [goals, setGoals] = useState(isEditing && topic.goals ? topic.goals.join(', ') : '');

  const categories = [
    { value: 'offensive', label: 'Offensive', color: 'bg-red-500' },
    { value: 'defensive', label: 'Defensive', color: 'bg-blue-500' },
    { value: 'control', label: 'Control', color: 'bg-purple-500' },
    { value: 'transition', label: 'Transition', color: 'bg-green-500' },
    { value: 'competition', label: 'Competition', color: 'bg-orange-500' },
    { value: 'fundamentals', label: 'Fundamentals', color: 'bg-teal-500' },
    { value: 'custom', label: 'Custom', color: 'bg-gray-500' }
  ];

  const colorOptions = [
    { name: 'Red', value: '#ef4444' }, { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' }, { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' }, { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' }, { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' }, { name: 'Gray', value: '#6b7280' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name, description, category, color: color || null, startDate, endDate,
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
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Topic Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Guard Retention Focus" className="input" required />
            </div>

            <div>
              <label className="label">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-sm text-left transition-colors ${category === cat.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Custom Color (optional)</label>
              <button type="button" onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                {color ? (
                  <><span className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{colorOptions.find(c => c.value === color)?.name || 'Custom'}</span></>
                ) : (
                  <><span className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600" />
                    <span className="text-sm text-gray-500">Choose color</span></>
                )}
              </button>
              {showColorPicker && (
                <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map(c => (
                      <button key={c.value} type="button" onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c.value ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`}
                        style={{ backgroundColor: c.value }} title={c.name} />
                    ))}
                  </div>
                  {color && <button type="button" onClick={() => { setColor(''); setShowColorPicker(false); }} className="text-xs text-gray-500 hover:text-red-500 mt-2">Clear color</button>}
                </div>
              )}
            </div>

            <div>
              <label className="label">Description (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's the focus?" rows={2} className="input resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" required /></div>
              <div><label className="label">End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" min={startDate} required /></div>
            </div>

            <div className="flex gap-2">
              {[2, 3, 4].map(w => (
                <button key={w} type="button" onClick={() => setDuration(w)} className="chip text-xs">{w} weeks</button>
              ))}
            </div>

            <div>
              <label className="label">Goals (comma-separated, optional)</label>
              <input type="text" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g., Improve hip escapes, Work on frames" className="input" />
            </div>

            <div className="flex gap-3 pt-2">
              {onDelete && <button type="button" onClick={() => setShowDeleteConfirm(true)} className="btn-danger text-sm">Delete</button>}
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">{isEditing ? 'Save' : 'Create Topic'}</button>
            </div>
          </form>

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
              <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">Delete Topic</h3>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete "{name || topic?.name}"?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl">Cancel</button>
                  <button onClick={() => { onDelete(); onClose(); }} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl">Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
