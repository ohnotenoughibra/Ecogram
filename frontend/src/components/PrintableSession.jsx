import { forwardRef } from 'react';

const PrintableSession = forwardRef(({ session, games }, ref) => {
  if (!session) return null;

  const sessionGames = session.games?.map(sg => {
    const game = games?.find(g => g._id === (sg.game?._id || sg.game));
    return { ...sg, gameData: game || sg.game };
  }).filter(sg => sg.gameData) || [];

  const totalDuration = sessionGames.length * 5; // Assume 5 min per game
  const formatDate = (date) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const topicColors = {
    offensive: '#dc2626',
    defensive: '#2563eb',
    control: '#7c3aed',
    transition: '#059669',
    competition: '#d97706'
  };

  return (
    <div ref={ref} className="print-session bg-white text-black p-8 max-w-4xl mx-auto">
      <style>{`
        @media print {
          .print-session {
            padding: 0.5in;
            font-size: 11pt;
          }
          .print-session h1 {
            font-size: 18pt;
          }
          .print-session h2 {
            font-size: 14pt;
          }
          .print-session h3 {
            font-size: 12pt;
          }
          .page-break {
            page-break-before: always;
          }
          .no-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{session.name}</h1>
            <p className="text-gray-600 mt-1">{formatDate(session.scheduledDate)}</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>{sessionGames.length} games</p>
            <p>~{totalDuration} minutes</p>
          </div>
        </div>
      </div>

      {/* Quick Reference - Game List */}
      <div className="mb-8 no-break">
        <h2 className="text-lg font-bold mb-3 border-b pb-1">Session Overview</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 w-8">#</th>
              <th className="text-left py-2">Game</th>
              <th className="text-left py-2 w-24">Topic</th>
              <th className="text-left py-2 w-32">Position</th>
              <th className="text-center py-2 w-16">Done</th>
            </tr>
          </thead>
          <tbody>
            {sessionGames.map((sg, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2 font-medium">{idx + 1}</td>
                <td className="py-2">{sg.gameData?.name}</td>
                <td className="py-2 capitalize">{sg.gameData?.topic}</td>
                <td className="py-2">{sg.gameData?.position?.replace(/-/g, ' ') || '-'}</td>
                <td className="py-2 text-center">
                  <span className="inline-block w-4 h-4 border border-gray-400 rounded"></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Game Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold border-b pb-1">Game Details</h2>

        {sessionGames.map((sg, idx) => (
          <div key={idx} className="no-break border rounded-lg p-4 bg-gray-50">
            {/* Game Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="font-bold text-lg">{sg.gameData?.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span
                      className="px-2 py-0.5 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: topicColors[sg.gameData?.topic] || '#666' }}
                    >
                      {sg.gameData?.topic}
                    </span>
                    {sg.gameData?.position && (
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                        {sg.gameData.position.replace(/-/g, ' ')}
                      </span>
                    )}
                    {sg.gameData?.difficulty && (
                      <span className="text-xs text-gray-500">
                        {sg.gameData.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                ~5 min
              </div>
            </div>

            {/* Instructions Grid */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {sg.gameData?.topPlayer && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-sm mb-1 text-red-700">Top Player</h4>
                  <p className="text-sm">{sg.gameData.topPlayer}</p>
                </div>
              )}
              {sg.gameData?.bottomPlayer && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-sm mb-1 text-blue-700">Bottom Player</h4>
                  <p className="text-sm">{sg.gameData.bottomPlayer}</p>
                </div>
              )}
            </div>

            {/* Coaching Notes */}
            {sg.gameData?.coaching && (
              <div className="mt-3 bg-yellow-50 p-3 rounded border border-yellow-200">
                <h4 className="font-semibold text-sm mb-1 text-yellow-800">Coaching Notes</h4>
                <p className="text-sm">{sg.gameData.coaching}</p>
              </div>
            )}

            {/* Techniques */}
            {sg.gameData?.techniques?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {sg.gameData.techniques.map((tech, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Notes space */}
            <div className="mt-3 border-t pt-3">
              <p className="text-xs text-gray-500 mb-1">Session Notes:</p>
              <div className="h-12 border border-dashed border-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Session Notes Section */}
      <div className="mt-8 no-break">
        <h2 className="text-lg font-bold border-b pb-1 mb-3">Session Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-1">What worked well:</p>
            <div className="h-24 border border-dashed border-gray-300 rounded"></div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Areas to improve:</p>
            <div className="h-24 border border-dashed border-gray-300 rounded"></div>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">Notes for next session:</p>
          <div className="h-16 border border-dashed border-gray-300 rounded"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
        <p>Generated by Ecogram - BJJ Training Game Library</p>
        <p>Printed on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
});

PrintableSession.displayName = 'PrintableSession';

export default PrintableSession;
