import { useState } from 'react';
import api from '../utils/api';

const categoryOptions = [
  { value: 'offensive', label: 'Offensive', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive', color: 'bg-blue-500' },
  { value: 'control', label: 'Control', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition', color: 'bg-green-500' },
  { value: 'fundamentals', label: 'Fundamentals', color: 'bg-teal-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' }
];

export default function PostSessionNotes({ session, onUpdate, showToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('reflection'); // 'reflection' | 'coaches'
  const [formData, setFormData] = useState({
    postClassNotes: session?.postClassNotes || '',
    whatWorked: session?.whatWorked || '',
    whatToImprove: session?.whatToImprove || '',
    sessionEffectiveness: session?.sessionEffectiveness || null,
    // Coaches notes
    coachesNotes: {
      observations: session?.coachesNotes?.observations || '',
      problemsSpotted: session?.coachesNotes?.problemsSpotted || [],
      suggestedTopics: session?.coachesNotes?.suggestedTopics || [],
      highlightMoments: session?.coachesNotes?.highlightMoments || '',
      energyLevel: session?.coachesNotes?.energyLevel || null,
      attendanceNotes: session?.coachesNotes?.attendanceNotes || ''
    }
  });

  // Problem form state
  const [newProblem, setNewProblem] = useState({ description: '', severity: 'moderate', affectedStudents: 'general', suggestedFocus: '' });
  // Topic suggestion form state
  const [newTopic, setNewTopic] = useState({ topic: '', category: 'other', priority: 'medium', reason: '' });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/sessions/${session._id}`, {
        postClassNotes: formData.postClassNotes,
        whatWorked: formData.whatWorked,
        whatToImprove: formData.whatToImprove,
        sessionEffectiveness: formData.sessionEffectiveness,
        coachesNotes: formData.coachesNotes,
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

  const handleAddProblem = () => {
    if (!newProblem.description.trim()) return;
    setFormData(prev => ({
      ...prev,
      coachesNotes: {
        ...prev.coachesNotes,
        problemsSpotted: [...prev.coachesNotes.problemsSpotted, { ...newProblem }]
      }
    }));
    setNewProblem({ description: '', severity: 'moderate', affectedStudents: 'general', suggestedFocus: '' });
  };

  const handleRemoveProblem = (index) => {
    setFormData(prev => ({
      ...prev,
      coachesNotes: {
        ...prev.coachesNotes,
        problemsSpotted: prev.coachesNotes.problemsSpotted.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAddTopic = () => {
    if (!newTopic.topic.trim()) return;
    setFormData(prev => ({
      ...prev,
      coachesNotes: {
        ...prev.coachesNotes,
        suggestedTopics: [...prev.coachesNotes.suggestedTopics, { ...newTopic }]
      }
    }));
    setNewTopic({ topic: '', category: 'other', priority: 'medium', reason: '' });
  };

  const handleRemoveTopic = (index) => {
    setFormData(prev => ({
      ...prev,
      coachesNotes: {
        ...prev.coachesNotes,
        suggestedTopics: prev.coachesNotes.suggestedTopics.filter((_, i) => i !== index)
      }
    }));
  };

  const updateCoachesNotes = (field, value) => {
    setFormData(prev => ({
      ...prev,
      coachesNotes: { ...prev.coachesNotes, [field]: value }
    }));
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

          {/* Coach's Notes Display */}
          {session.coachesNotes && (session.coachesNotes.observations || session.coachesNotes.problemsSpotted?.length > 0 || session.coachesNotes.suggestedTopics?.length > 0) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-primary-500">
                  <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 00-11.215 0c-.22.578.254 1.139.872 1.139h9.47z" />
                </svg>
                Coach's Notes
              </h4>

              {session.coachesNotes.energyLevel && (
                <div className="mb-3">
                  <span className="text-xs text-gray-500">Energy Level: </span>
                  <span className="text-sm">
                    {session.coachesNotes.energyLevel === 'low' && '😴 Low'}
                    {session.coachesNotes.energyLevel === 'moderate' && '😐 Moderate'}
                    {session.coachesNotes.energyLevel === 'high' && '😊 High'}
                    {session.coachesNotes.energyLevel === 'very-high' && '🔥 Very High'}
                  </span>
                </div>
              )}

              {session.coachesNotes.observations && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Observations</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{session.coachesNotes.observations}</p>
                </div>
              )}

              {session.coachesNotes.problemsSpotted?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">Problems Spotted</p>
                  <div className="space-y-2">
                    {session.coachesNotes.problemsSpotted.map((problem, idx) => (
                      <div key={idx} className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-start gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          problem.severity === 'major' ? 'bg-red-200 text-red-800' :
                          problem.severity === 'moderate' ? 'bg-orange-200 text-orange-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {problem.severity}
                        </span>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{problem.description}</p>
                          {problem.suggestedFocus && (
                            <p className="text-xs text-gray-500 mt-0.5">Focus: {problem.suggestedFocus}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.coachesNotes.suggestedTopics?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Suggested Future Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {session.coachesNotes.suggestedTopics.map((topic, idx) => (
                      <div key={idx} className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center gap-1.5 border border-purple-200 dark:border-purple-800">
                        <span className={`w-2 h-2 rounded-full ${categoryOptions.find(c => c.value === topic.category)?.color || 'bg-gray-500'}`} />
                        <span className="text-sm text-purple-800 dark:text-purple-200">{topic.topic}</span>
                        <span className={`text-xs px-1 rounded ${
                          topic.priority === 'high' ? 'bg-red-100 text-red-700' :
                          topic.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {topic.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.coachesNotes.highlightMoments && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Highlight Moments</p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">{session.coachesNotes.highlightMoments}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setFormData({
                postClassNotes: session.postClassNotes || '',
                whatWorked: session.whatWorked || '',
                whatToImprove: session.whatToImprove || '',
                sessionEffectiveness: session.sessionEffectiveness || null,
                coachesNotes: {
                  observations: session?.coachesNotes?.observations || '',
                  problemsSpotted: session?.coachesNotes?.problemsSpotted || [],
                  suggestedTopics: session?.coachesNotes?.suggestedTopics || [],
                  highlightMoments: session?.coachesNotes?.highlightMoments || '',
                  energyLevel: session?.coachesNotes?.energyLevel || null,
                  attendanceNotes: session?.coachesNotes?.attendanceNotes || ''
                }
              });
              setIsEditing(true);
            }}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Edit notes
          </button>
        </div>
      )}

      {/* Editing mode */}
      {isEditing && (
        <div className="space-y-4">
          {/* Tab Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setActiveTab('reflection')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'reflection'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Reflection
            </button>
            <button
              onClick={() => setActiveTab('coaches')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'coaches'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Coach's Notes
            </button>
          </div>

          {/* Reflection Tab */}
          {activeTab === 'reflection' && (
            <>
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
            </>
          )}

          {/* Coach's Notes Tab */}
          {activeTab === 'coaches' && (
            <>
              {/* Energy Level */}
              <div>
                <label className="label">Class Energy Level</label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: 'Low', emoji: '😴' },
                    { value: 'moderate', label: 'Moderate', emoji: '😐' },
                    { value: 'high', label: 'High', emoji: '😊' },
                    { value: 'very-high', label: 'Very High', emoji: '🔥' }
                  ].map(level => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateCoachesNotes('energyLevel', level.value)}
                      className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                        formData.coachesNotes.energyLevel === level.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-lg">{level.emoji}</span>
                      <p className="text-xs mt-1">{level.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="label flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-blue-500">
                    <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    <path fillRule="evenodd" d="M1.38 8.28a.87.87 0 010-.566 7.003 7.003 0 0113.238.006.87.87 0 010 .566A7.003 7.003 0 011.379 8.28zM11 8a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Observations
                </label>
                <textarea
                  value={formData.coachesNotes.observations}
                  onChange={(e) => updateCoachesNotes('observations', e.target.value)}
                  placeholder="What did you notice during class? Student interactions, technique execution, common patterns..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {/* Problems Spotted */}
              <div>
                <label className="label flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-orange-500">
                    <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.3-2.25l5.197-9zM8 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Problems Spotted
                </label>

                {/* Existing problems */}
                {formData.coachesNotes.problemsSpotted.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.coachesNotes.problemsSpotted.map((problem, idx) => (
                      <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-start gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          problem.severity === 'major' ? 'bg-red-200 text-red-800' :
                          problem.severity === 'moderate' ? 'bg-orange-200 text-orange-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {problem.severity}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">{problem.description}</p>
                          {problem.suggestedFocus && (
                            <p className="text-xs text-gray-500 mt-1">Focus: {problem.suggestedFocus}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProblem(idx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                            <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new problem */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                  <input
                    type="text"
                    value={newProblem.description}
                    onChange={(e) => setNewProblem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the problem..."
                    className="input text-sm"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newProblem.severity}
                      onChange={(e) => setNewProblem(prev => ({ ...prev, severity: e.target.value }))}
                      className="input text-sm flex-1"
                    >
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="major">Major</option>
                    </select>
                    <input
                      type="text"
                      value={newProblem.suggestedFocus}
                      onChange={(e) => setNewProblem(prev => ({ ...prev, suggestedFocus: e.target.value }))}
                      placeholder="Suggested focus area"
                      className="input text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddProblem}
                      disabled={!newProblem.description.trim()}
                      className="btn-secondary text-sm px-3"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggested Topics for Future */}
              <div>
                <label className="label flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-purple-500">
                    <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 002 4.5v2.879a2.5 2.5 0 00.732 1.767l4.5 4.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-4.5-4.5A2.5 2.5 0 007.38 2H4.5zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Suggested Topics for Future
                </label>
                <p className="text-xs text-gray-500 mb-2">Based on what you observed, what should be covered in future sessions?</p>

                {/* Existing topics */}
                {formData.coachesNotes.suggestedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.coachesNotes.suggestedTopics.map((topic, idx) => (
                      <div key={idx} className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                        categoryOptions.find(c => c.value === topic.category)?.color.replace('bg-', 'bg-opacity-20 bg-')
                      } border`}>
                        <span className={`w-2 h-2 rounded-full ${categoryOptions.find(c => c.value === topic.category)?.color}`} />
                        <span className="text-sm">{topic.topic}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          topic.priority === 'high' ? 'bg-red-100 text-red-700' :
                          topic.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {topic.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(idx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new topic */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTopic.topic}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="Topic name (e.g., Guard retention drills)"
                      className="input text-sm flex-1"
                    />
                    <select
                      value={newTopic.category}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, category: e.target.value }))}
                      className="input text-sm w-32"
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newTopic.priority}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, priority: e.target.value }))}
                      className="input text-sm w-28"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <input
                      type="text"
                      value={newTopic.reason}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Why? (optional)"
                      className="input text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      disabled={!newTopic.topic.trim()}
                      className="btn-secondary text-sm px-3"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Highlight Moments */}
              <div>
                <label className="label flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-yellow-500">
                    <path d="M6.268 1.562a3 3 0 014.464 0l3.706 4.159a3 3 0 01.763 2.006v4.39a.75.75 0 01-1.5 0V7.727a1.5 1.5 0 00-.382-1.003l-3.706-4.159a1.5 1.5 0 00-2.232 0L3.675 6.724a1.5 1.5 0 00-.382 1.003v4.39a.75.75 0 01-1.5 0v-4.39a3 3 0 01.763-2.006l3.712-4.16z" />
                  </svg>
                  Highlight Moments
                </label>
                <textarea
                  value={formData.coachesNotes.highlightMoments}
                  onChange={(e) => updateCoachesNotes('highlightMoments', e.target.value)}
                  placeholder="Breakthroughs, great exchanges, student achievements..."
                  rows={2}
                  className="input resize-none"
                />
              </div>

              {/* Attendance Notes */}
              <div>
                <label className="label">Attendance Notes</label>
                <input
                  type="text"
                  value={formData.coachesNotes.attendanceNotes}
                  onChange={(e) => updateCoachesNotes('attendanceNotes', e.target.value)}
                  placeholder="Class size, notable absences, visitors..."
                  className="input"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
                'Save Notes'
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
