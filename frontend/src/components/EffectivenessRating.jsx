import { useState } from 'react';
import api from '../utils/api';

export default function EffectivenessRating({ isOpen, onClose, game, sessionId, onRated }) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await api.post(`/games/${game._id}/rate-effectiveness`, {
        rating,
        sessionId,
        notes: notes.trim()
      });

      if (onRated) onRated(rating);
      onClose();
    } catch (error) {
      console.error('Failed to rate game:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onRated) onRated(null);
    onClose();
  };

  if (!isOpen || !game) return null;

  return (
    <div className="modal-overlay" onClick={handleSkip}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          {/* Header */}
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-green-600 dark:text-green-400">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            How effective was this drill?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {game.name}
          </p>

          {/* Star Rating */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-1 transition-transform hover:scale-110 ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path d="M12 2.25l2.918 6.625 7.332.596-5.5 5.093 1.625 7.186L12 17.75l-6.375 4-1.625-7.186-5.5-5.093 7.332-.596L12 2.25z" />
                </svg>
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          <div className="flex justify-between text-xs text-gray-400 mb-4 px-2">
            <span>Not effective</span>
            <span>Very effective</span>
          </div>

          {/* Optional Notes */}
          {rating > 0 && (
            <div className="mb-4 animate-fade-in">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Quick notes (optional): What worked? What didn't?"
                rows={2}
                className="input resize-none text-sm"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="btn-secondary flex-1 text-sm"
              disabled={submitting}
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="btn-primary flex-1 text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
