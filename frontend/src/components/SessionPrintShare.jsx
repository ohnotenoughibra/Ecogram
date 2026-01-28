import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

const topicLabels = {
  offensive: 'Offensive',
  defensive: 'Defensive',
  control: 'Control',
  transition: 'Transition'
};

const topicColors = {
  offensive: '#ef4444',
  defensive: '#3b82f6',
  control: '#a855f7',
  transition: '#22c55e'
};

export default function SessionPrintShare({ isOpen, onClose, session }) {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  if (!isOpen || !session) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${session.name} - Session Plan</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1f2937; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          .subtitle { color: #6b7280; margin-bottom: 24px; }
          .game { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
          .game-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
          .game-number { background: #f3f4f6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
          .game-name { font-weight: 600; font-size: 16px; }
          .topic-badge { padding: 2px 8px; border-radius: 9999px; font-size: 12px; color: white; margin-left: auto; }
          .section { margin-top: 12px; }
          .section-title { font-weight: 600; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
          .section-content { font-size: 14px; white-space: pre-wrap; }
          .skills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
          .skill { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
          @media print { body { padding: 0; } .game { border-color: #d1d5db; } }
        </style>
      </head>
      <body>
        <h1>${session.name}</h1>
        <p class="subtitle">${session.games?.length || 0} games${session.scheduledDate ? ' • ' + new Date(session.scheduledDate).toLocaleDateString() : ''}</p>
        ${session.games?.map((g, idx) => `
          <div class="game">
            <div class="game-header">
              <div class="game-number">${idx + 1}</div>
              <span class="game-name">${g.game?.name || 'Untitled'}</span>
              <span class="topic-badge" style="background: ${topicColors[g.game?.topic] || '#6b7280'}">${topicLabels[g.game?.topic] || 'General'}</span>
            </div>
            ${g.game?.topPlayer ? `<div class="section"><div class="section-title">Top Player</div><div class="section-content">${g.game.topPlayer}</div></div>` : ''}
            ${g.game?.bottomPlayer ? `<div class="section"><div class="section-title">Bottom Player</div><div class="section-content">${g.game.bottomPlayer}</div></div>` : ''}
            ${g.game?.coaching ? `<div class="section"><div class="section-title">Coaching Notes</div><div class="section-content">${g.game.coaching}</div></div>` : ''}
            ${g.game?.skills?.length ? `<div class="skills">${g.game.skills.map(s => `<span class="skill">#${s}</span>`).join('')}</div>` : ''}
          </div>
        `).join('') || '<p>No games in this session</p>'}
        <div class="footer">Generated from EcoGames BJJ Training App</div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleCopyText = () => {
    const text = `${session.name}
${session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : ''}
${session.games?.length || 0} games

${session.games?.map((g, idx) => `
${idx + 1}. ${g.game?.name || 'Untitled'} (${topicLabels[g.game?.topic] || 'General'})
${g.game?.topPlayer ? `   Top: ${g.game.topPlayer}` : ''}
${g.game?.bottomPlayer ? `   Bottom: ${g.game.bottomPlayer}` : ''}
${g.game?.coaching ? `   Coaching: ${g.game.coaching}` : ''}
${g.game?.skills?.length ? `   Skills: ${g.game.skills.map(s => '#' + s).join(' ')}` : ''}
`).join('\n') || 'No games'}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Session copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: session.name,
          text: `Check out my ${session.name} training session with ${session.games?.length || 0} games!`,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Failed to share', 'error');
        }
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Print / Share Session
            </h2>
            <button onClick={onClose} className="btn-icon" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Session Preview */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {session.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {session.games?.length || 0} games
              {session.scheduledDate && ` • ${new Date(session.scheduledDate).toLocaleDateString()}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {session.games?.slice(0, 5).map((g, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: topicColors[g.game?.topic] + '20', color: topicColors[g.game?.topic] }}
                >
                  {g.game?.name || 'Untitled'}
                </span>
              ))}
              {session.games?.length > 5 && (
                <span className="text-xs text-gray-400">+{session.games.length - 5} more</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Print */}
            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                  <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.241l.305 1.984A1.75 1.75 0 0114.084 19H5.915a1.75 1.75 0 01-1.73-2.016L4.492 15H4.25A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.749-.107 1.126-.153V2.75zm1.5 0v3.415a41.67 41.67 0 017 0V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25zM6.472 15.5l-.439 2.857a.25.25 0 00.247.288h7.44a.25.25 0 00.247-.288l-.439-2.857H6.472z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Print Session</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Print a formatted session plan</div>
              </div>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopyText}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {copied ? 'Copied!' : 'Copy as Text'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Copy session details to clipboard</div>
              </div>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-600 dark:text-purple-400">
                  <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Share Session</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {navigator.share ? 'Share via native share' : 'Copy link to clipboard'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
