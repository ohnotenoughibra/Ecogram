import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Import() {
  const navigate = useNavigate();
  const { importGames, showToast } = useApp();
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.endsWith('.json')) {
      showToast('Please select a JSON file', 'error');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.games || !Array.isArray(data.games)) {
        showToast('Invalid file format. Expected { games: [...] }', 'error');
        return;
      }

      setPreviewData({
        games: data.games,
        exportDate: data.exportDate,
        count: data.games.length
      });
    } catch (error) {
      showToast('Failed to parse JSON file', 'error');
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    setLoading(true);
    const result = await importGames(previewData.games);
    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  const topicLabels = {
    offensive: 'Offensive',
    defensive: 'Defensive',
    control: 'Control',
    transition: 'Transition'
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-1 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Games</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Import games from a previously exported JSON file
        </p>
      </div>

      {!previewData ? (
        <div
          className={`card p-8 border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Drop your file here
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary mt-4"
            >
              Select File
            </button>
            <p className="mt-4 text-xs text-gray-400">
              Accepts JSON files exported from EcoGames
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preview */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import Preview
              </h2>
              <button
                onClick={() => setPreviewData(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Select different file
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Total games</span>
                <span className="font-bold text-2xl text-gray-900 dark:text-white">
                  {previewData.count}
                </span>
              </div>

              {previewData.exportDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Exported on: {new Date(previewData.exportDate).toLocaleString()}
                </p>
              )}

              {/* Game preview list */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {previewData.games.slice(0, 10).map((game, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3"
                  >
                    <span className={`badge badge-${game.topic || 'transition'}`}>
                      {topicLabels[game.topic] || 'Transition'}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">
                      {game.name}
                    </span>
                  </div>
                ))}
                {previewData.games.length > 10 && (
                  <p className="text-center text-sm text-gray-500">
                    ... and {previewData.games.length - 10} more games
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewData(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2" />
                  Importing...
                </>
              ) : (
                `Import ${previewData.count} Games`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
