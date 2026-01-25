import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SessionItem from '../components/SessionItem';
import ConfirmModal from '../components/ConfirmModal';
import Loading from '../components/Loading';
import api from '../utils/api';

export default function Sessions() {
  const {
    sessions,
    sessionsLoading,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    showToast
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingSession, setSharingSession] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim()) return;

    if (editingSession) {
      await updateSession(editingSession._id, { name: sessionName });
    } else {
      await createSession({ name: sessionName, gameIds: [] });
    }

    setShowCreateModal(false);
    setEditingSession(null);
    setSessionName('');
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionName(session.name);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-primary-500">
              <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
            </svg>
            Sessions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize games into training sessions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSession(null);
            setSessionName('');
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

      {/* Sessions List */}
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
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <SessionItem
              key={session._id}
              session={session}
              onEdit={handleEditSession}
              onDelete={handleDeleteClick}
              onShare={handleShare}
            />
          ))}
        </div>
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
                <div className="mb-4">
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
                <div className="flex gap-3">
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
