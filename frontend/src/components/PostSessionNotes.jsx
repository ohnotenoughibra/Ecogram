import { useState } from 'react';
import api from '../utils/api';

export default function PostSessionNotes({ session, onUpdate, showToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    postClassNotes: session?.postClassNotes || '',
    whatWorked: session?.whatWorked || '',
    whatToImprove: session?.whatToImprove || '',
    sessionEffectiveness: session?.sessionEffectiveness || null
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/sessions/${session._id}`, {
        ...formData,
        completed: true,
        completedAt: new Date()
      });
      onUpdate?.(response.data);
      setIsEditing(false);
      showToast?.('Session notes saved!', 'success');
    } catch (error) {
      showToast?.('Failed to save notes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRating = (rating) => {
    setFormData(prev => ({ ...prev, sessionEffectiveness: rating }));
  };

  // Check if all games are completed
  const allGamesCompleted = session?.games?.every(g => g.completed);
  const completedCount = session?.games?.filter(g => g.completed).length || 0;
  const totalGames = session?.games?.length || 0;

  if (!session) return null;

  // Show completion prompt when all games done
  const showCompletionPrompt = allGamesCompleted && !session.completed && !isEditing;

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
            <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.061 1.062L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM10 14a4 4 0 100-8 4 4 0 000 8zm.75 4.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM14.95 16.95a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zm-9.9 0a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.062-1.06l1.061-1.06a.75.75 0 011.06 0zM17 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0117 10zM4.5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 014.5 10z" />
          </svg>
          Post-Class Reflection
        </h3>
        {session.completed && (
          <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Completed
          </span>
        )}
      </div>

      {/* Completion Prompt */}
      {showCompletionPrompt && (
        <div className="p-4 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-600">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                Great job! All {totalGames} games completed!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Take a moment to reflect on how the class went. This helps you improve future sessions.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary mt-3"
              >
                Add Reflection Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already completed view */}
      {session.completed && !isEditing && (
        <div className="space-y-4">
          {/* Effectiveness Rating */}
          {session.sessionEffectiveness && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Session Effectiveness</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg
                    key={star}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-6 h-6 ${star <= session.sessionEffectiveness ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {session.sessionEffectiveness}/5
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="grid md:grid-cols-2 gap-4">
            {session.whatWorked && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">What Worked Well</p>
                <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">{session.whatWorked}</p>
              </div>
            )}
            {session.whatToImprove && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">What to Improve</p>
                <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">{session.whatToImprove}</p>
              </div>
            )}
          </div>

          {session.postClassNotes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">General Notes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{session.postClassNotes}</p>
            </div>
          )}

          <button
            onClick={() => {
              setFormData({
                postClassNotes: session.postClassNotes || '',
                whatWorked: session.whatWorked || '',
                whatToImprove: session.whatToImprove || '',
                sessionEffectiveness: session.sessionEffectiveness || null
              });
              setIsEditing(true);
            }}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Edit reflection
          </button>
        </div>
      )}

      {/* Editing mode */}
      {isEditing && (
        <div className="space-y-4">
          {/* Effectiveness Rating */}
          <div>
            <label className="label">How effective was this session?</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-8 h-8 ${star <= (formData.sessionEffectiveness || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              {formData.sessionEffectiveness && (
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {formData.sessionEffectiveness === 1 && 'Poor'}
                  {formData.sessionEffectiveness === 2 && 'Below Average'}
                  {formData.sessionEffectiveness === 3 && 'Average'}
                  {formData.sessionEffectiveness === 4 && 'Good'}
                  {formData.sessionEffectiveness === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          {/* What Worked */}
          <div>
            <label className="label flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              What Worked Well
            </label>
            <textarea
              value={formData.whatWorked}
              onChange={(e) => setFormData(prev => ({ ...prev, whatWorked: e.target.value }))}
              placeholder="Which games got good engagement? What techniques clicked? Any breakthroughs?"
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* What to Improve */}
          <div>
            <label className="label flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              What to Improve
            </label>
            <textarea
              value={formData.whatToImprove}
              onChange={(e) => setFormData(prev => ({ ...prev, whatToImprove: e.target.value }))}
              placeholder="What didn't land? Concepts that need more time? Pacing issues?"
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* General Notes */}
          <div>
            <label className="label">Additional Notes</label>
            <textarea
              value={formData.postClassNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, postClassNotes: e.target.value }))}
              placeholder="Any other observations, student feedback, or ideas for next time..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? (
                <>
                  <span className="spinner mr-2" />
                  Saving...
                </>
              ) : (
                'Save Reflection'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Not yet ready for reflection */}
      {!allGamesCompleted && !session.completed && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Complete all games to add your post-class reflection.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {completedCount} of {totalGames} games completed
          </p>
        </div>
      )}
    </div>
  );
}
