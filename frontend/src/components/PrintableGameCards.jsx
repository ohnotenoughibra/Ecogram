import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

const topicLabels = {
  offensive: 'Offensive / Submissions',
  defensive: 'Defensive / Escapes',
  control: 'Control / Passing',
  transition: 'Transition / Scrambles'
};

const topicColors = {
  offensive: { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' },
  defensive: { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' },
  control: { bg: '#F3E8FF', border: '#A855F7', text: '#7C3AED' },
  transition: { bg: '#DCFCE7', border: '#22C55E', text: '#15803D' }
};

const positionLabels = {
  'closed-guard': 'Closed Guard',
  'open-guard': 'Open Guard',
  'half-guard': 'Half Guard',
  'mount': 'Mount',
  'side-control': 'Side Control',
  'back-control': 'Back Control',
  'standing': 'Standing',
  'turtle': 'Turtle',
  'leg-locks': 'Leg Locks'
};

function GameCard({ game, size = 'medium' }) {
  const colors = topicColors[game.topic] || topicColors.offensive;

  return (
    <div
      className={`game-print-card ${size}`}
      style={{
        backgroundColor: 'white',
        border: `3px solid ${colors.border}`,
        borderRadius: '12px',
        padding: size === 'small' ? '12px' : '16px',
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `2px solid ${colors.bg}`
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: size === 'small' ? '14px' : '18px',
            fontWeight: 'bold',
            color: '#1F2937',
            margin: 0,
            lineHeight: 1.3
          }}>
            {game.name}
          </h3>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '4px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: colors.bg,
              color: colors.text,
              fontWeight: '600'
            }}>
              {topicLabels[game.topic]}
            </span>
            {game.position && (
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: '#F3F4F6',
                color: '#4B5563'
              }}>
                {positionLabels[game.position] || game.position}
              </span>
            )}
          </div>
        </div>
        {game.isFavorite && (
          <span style={{ fontSize: '16px' }}>⭐</span>
        )}
      </div>

      {/* Constraints */}
      {game.constraints && game.constraints.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h4 style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '6px'
          }}>
            Constraints
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: '16px',
            fontSize: size === 'small' ? '11px' : '13px',
            color: '#374151',
            lineHeight: 1.5
          }}>
            {game.constraints.slice(0, size === 'small' ? 3 : 5).map((constraint, idx) => (
              <li key={idx} style={{ marginBottom: '2px' }}>
                {constraint}
              </li>
            ))}
            {game.constraints.length > (size === 'small' ? 3 : 5) && (
              <li style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                +{game.constraints.length - (size === 'small' ? 3 : 5)} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Description */}
      {game.description && (
        <div style={{ marginBottom: '12px' }}>
          <h4 style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px'
          }}>
            Notes
          </h4>
          <p style={{
            fontSize: size === 'small' ? '10px' : '12px',
            color: '#4B5563',
            margin: 0,
            lineHeight: 1.4
          }}>
            {game.description.length > 150
              ? game.description.substring(0, 150) + '...'
              : game.description
            }
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: '8px',
        borderTop: '1px solid #E5E7EB',
        fontSize: '10px',
        color: '#9CA3AF'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {game.duration && (
            <span>⏱ {game.duration} min</span>
          )}
          {game.difficulty && (
            <span>
              {game.difficulty === 'beginner' ? '🟢' : game.difficulty === 'intermediate' ? '🟡' : '🔴'}
              {' '}{game.difficulty}
            </span>
          )}
          {game.gameType && game.gameType !== 'main' && (
            <span>
              {game.gameType === 'warmup' ? '🏃 Warmup' : '🧘 Cooldown'}
            </span>
          )}
        </div>
        {game.usageCount > 0 && (
          <span>Used {game.usageCount}x</span>
        )}
      </div>
    </div>
  );
}

export default function PrintableGameCards({ isOpen, onClose, games: propGames, title = 'Game Cards', singleMode = false }) {
  const { games: allGames, selectedGames } = useApp();
  const printRef = useRef(null);
  const [cardSize, setCardSize] = useState(singleMode ? 'large' : 'medium');
  const [cardsPerRow, setCardsPerRow] = useState(singleMode ? 1 : 2);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Use provided games, or selected games, or all games
  // In single mode, only use propGames (should be a single game array)
  const gamesToPrint = singleMode ? (propGames || []).slice(0, 1) : (propGames ||
    (selectedGames.size > 0
      ? allGames.filter(g => selectedGames.has(g._id))
      : allGames));

  const handlePrint = () => {
    setIsPrinting(true);

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print game cards');
      setIsPrinting(false);
      return;
    }

    const printContent = generatePrintHTML(gamesToPrint, {
      cardSize,
      cardsPerRow,
      includeDescription,
      title
    });

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 250);
    };
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
                <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.241l.305 1.984A1.75 1.75 0 0114.084 19H5.915a1.75 1.75 0 01-1.73-2.016L4.492 15H4.25A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.749-.107 1.126-.153V2.75zm1.5 0v3.401a41.709 41.709 0 017 0V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25zM7.364 17.5l.294-1.914a.25.25 0 00-.247-.586H4.25a.75.75 0 01-.75-.75V8.653c0-.362.26-.678.616-.74a39.652 39.652 0 0111.768 0c.356.062.616.378.616.74v5.597a.75.75 0 01-.75.75h-3.161a.25.25 0 00-.247.586l.294 1.914H7.364z" clipRule="evenodd" />
              </svg>
              Export to Print / PDF
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {gamesToPrint.length} game{gamesToPrint.length !== 1 ? 's' : ''} ready to export
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label text-xs">Card Size</label>
              <select
                value={cardSize}
                onChange={(e) => setCardSize(e.target.value)}
                className="input text-sm"
              >
                <option value="small">Small (More per page)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="large">Large (More detail)</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">Cards Per Row</label>
              <select
                value={cardsPerRow}
                onChange={(e) => setCardsPerRow(Number(e.target.value))}
                className="input text-sm"
              >
                <option value={1}>1 per row</option>
                <option value={2}>2 per row</option>
                <option value={3}>3 per row</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDescription}
                  onChange={(e) => setIncludeDescription(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include notes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4" ref={printRef}>
          <div
            className="bg-white rounded-lg p-4"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)`,
              gap: '16px'
            }}
          >
            {gamesToPrint.slice(0, 6).map(game => (
              <GameCard
                key={game._id}
                game={game}
                size={cardSize}
              />
            ))}
          </div>
          {gamesToPrint.length > 6 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Preview showing 6 of {gamesToPrint.length} cards
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tip: Use "Save as PDF" in the print dialog to create a PDF file
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting || gamesToPrint.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {isPrinting ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.241l.305 1.984A1.75 1.75 0 0114.084 19H5.915a1.75 1.75 0 01-1.73-2.016L4.492 15H4.25A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.749-.107 1.126-.153V2.75zm1.5 0v3.401a41.709 41.709 0 017 0V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25zM7.364 17.5l.294-1.914a.25.25 0 00-.247-.586H4.25a.75.75 0 01-.75-.75V8.653c0-.362.26-.678.616-.74a39.652 39.652 0 0111.768 0c.356.062.616.378.616.74v5.597a.75.75 0 01-.75.75h-3.161a.25.25 0 00-.247.586l.294 1.914H7.364z" clipRule="evenodd" />
                  </svg>
                  Print / Save PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function generatePrintHTML(games, options) {
  const { cardSize, cardsPerRow, includeDescription, title } = options;

  const cardWidth = cardsPerRow === 1 ? '100%' : cardsPerRow === 2 ? '48%' : '31%';
  const fontSize = cardSize === 'small' ? '11px' : cardSize === 'medium' ? '13px' : '14px';
  const padding = cardSize === 'small' ? '12px' : cardSize === 'medium' ? '16px' : '20px';

  const cardsHTML = games.map(game => {
    const colors = topicColors[game.topic] || topicColors.offensive;

    return `
      <div class="game-card" style="
        width: ${cardWidth};
        background: white;
        border: 3px solid ${colors.border};
        border-radius: 12px;
        padding: ${padding};
        page-break-inside: avoid;
        break-inside: avoid;
        box-sizing: border-box;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid ${colors.bg};
        ">
          <div style="flex: 1;">
            <h3 style="
              font-size: ${cardSize === 'small' ? '14px' : '18px'};
              font-weight: bold;
              color: #1F2937;
              margin: 0;
              line-height: 1.3;
            ">${game.name}</h3>
            <div style="display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
              <span style="
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 999px;
                background: ${colors.bg};
                color: ${colors.text};
                font-weight: 600;
              ">${topicLabels[game.topic]}</span>
              ${game.position ? `<span style="
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 999px;
                background: #F3F4F6;
                color: #4B5563;
              ">${positionLabels[game.position] || game.position}</span>` : ''}
            </div>
          </div>
          ${game.isFavorite ? '<span style="font-size: 16px;">⭐</span>' : ''}
        </div>

        ${game.constraints && game.constraints.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <h4 style="
              font-size: 11px;
              font-weight: 600;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 6px;
            ">Constraints</h4>
            <ul style="
              margin: 0;
              padding-left: 16px;
              font-size: ${fontSize};
              color: #374151;
              line-height: 1.5;
            ">
              ${game.constraints.slice(0, cardSize === 'small' ? 3 : 5).map(c => `<li style="margin-bottom: 2px;">${c}</li>`).join('')}
              ${game.constraints.length > (cardSize === 'small' ? 3 : 5) ? `<li style="color: #9CA3AF; font-style: italic;">+${game.constraints.length - (cardSize === 'small' ? 3 : 5)} more</li>` : ''}
            </ul>
          </div>
        ` : ''}

        ${includeDescription && game.description ? `
          <div style="margin-bottom: 12px;">
            <h4 style="
              font-size: 11px;
              font-weight: 600;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
            ">Notes</h4>
            <p style="
              font-size: ${cardSize === 'small' ? '10px' : '12px'};
              color: #4B5563;
              margin: 0;
              line-height: 1.4;
            ">${game.description.length > 150 ? game.description.substring(0, 150) + '...' : game.description}</p>
          </div>
        ` : ''}

        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid #E5E7EB;
          font-size: 10px;
          color: #9CA3AF;
        ">
          <div style="display: flex; gap: 12px;">
            ${game.duration ? `<span>⏱ ${game.duration} min</span>` : ''}
            ${game.difficulty ? `<span>${game.difficulty === 'beginner' ? '🟢' : game.difficulty === 'intermediate' ? '🟡' : '🔴'} ${game.difficulty}</span>` : ''}
            ${game.gameType && game.gameType !== 'main' ? `<span>${game.gameType === 'warmup' ? '🏃 Warmup' : '🧘 Cooldown'}</span>` : ''}
          </div>
          ${game.usageCount > 0 ? `<span>Used ${game.usageCount}x</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - Ecogram</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .game-card { page-break-inside: avoid; break-inside: avoid; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f3f4f6;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #1f2937;
        }
        .header p {
          margin: 4px 0 0;
          font-size: 14px;
          color: #6b7280;
        }
        .cards-container {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: flex-start;
        }
        .footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>${games.length} game${games.length !== 1 ? 's' : ''} • Generated from Ecogram</p>
      </div>
      <div class="cards-container">
        ${cardsHTML}
      </div>
      <div class="footer">
        Generated on ${new Date().toLocaleDateString()} • Ecogram Training Game Library
      </div>
    </body>
    </html>
  `;
}
