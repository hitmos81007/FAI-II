import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

export interface SeriesPoint {
  match: number;
  matchLabel: string;
  playerWins: number;
  aiWins: number;
  netDiff: number;
  winner: string;
  rule?: string;
  difficulty?: string;
  time?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  playerName: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, playerName }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SeriesPoint;
    const isPlayerWin = data.winner.includes(playerName) || data.winner.includes('Player');
    const isAiWin = data.winner.includes('AI') || data.winner.includes('Opponent');

    return (
      <div
        style={{
          background: '#0b1329',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          fontSize: '0.82rem',
          color: '#f8fafc',
          minWidth: '200px',
        }}
      >
        <div style={{ fontWeight: 700, color: '#94a3b8', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '6px' }}>
          {data.match === 0 ? 'Series Baseline' : `Match #${data.match}`}
          {data.time ? <span style={{ float: 'right', fontWeight: 400, fontSize: '0.75rem', color: '#64748b' }}>{data.time}</span> : null}
        </div>

        {data.match > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Winner: </span>
            <span
              style={{
                fontWeight: 700,
                color: isPlayerWin ? '#34d399' : isAiWin ? '#f87171' : '#fbbf24',
              }}
            >
              {data.winner}
            </span>
            {data.difficulty && (
              <span
                style={{
                  marginLeft: '6px',
                  background: '#1e293b',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                }}
              >
                {data.difficulty}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '3px' }}>
          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
            {playerName}:
          </span>
          <span style={{ fontWeight: 700 }}>{data.playerWins} wins</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
          <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }}></span>
            AI Opponent:
          </span>
          <span style={{ fontWeight: 700 }}>{data.aiWins} wins</span>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <span style={{ color: '#64748b' }}>Net Differential:</span>
          <span style={{ fontWeight: 700, color: data.netDiff > 0 ? '#34d399' : data.netDiff < 0 ? '#f87171' : '#94a3b8' }}>
            {data.netDiff > 0 ? `+${data.netDiff}` : data.netDiff}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const SeriesWinsChart: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<SeriesPoint[]>([]);
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [viewMode, setViewMode] = useState<'cumulative' | 'diff'>('cumulative');

  // Load from localStorage or sync with parent window
  const loadData = () => {
    try {
      const storedName = localStorage.getItem('nim_player_name') || 'Player 1';
      setPlayerName(storedName);

      const raw = localStorage.getItem('nim_series_trend_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDataPoints(parsed);
          return;
        }
      }

      // If no explicit trend history stored yet, check overall wins
      const pWins = parseInt(localStorage.getItem('nim_player_wins') || '0', 10);
      const aiWins = parseInt(localStorage.getItem('nim_opponent_wins') || '0', 10);
      const mCount = parseInt(localStorage.getItem('nim_match_count') || '0', 10);

      const baseline: SeriesPoint[] = [
        {
          match: 0,
          matchLabel: 'Start',
          playerWins: 0,
          aiWins: 0,
          netDiff: 0,
          winner: 'Baseline',
        },
      ];

      if (mCount > 0 && (pWins > 0 || aiWins > 0)) {
        baseline.push({
          match: mCount,
          matchLabel: `M${mCount}`,
          playerWins: pWins,
          aiWins: aiWins,
          netDiff: pWins - aiWins,
          winner: pWins > aiWins ? storedName : 'Opponent AI',
        });
      }

      setDataPoints(baseline);
    } catch (e) {
      console.warn('Failed to load series trend history:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to custom updates from index.html
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('nim_series_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('nim_series_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    const latest = dataPoints[dataPoints.length - 1] || { playerWins: 0, aiWins: 0, match: 0, netDiff: 0 };
    const totalGames = latest.playerWins + latest.aiWins;
    const playerRate = totalGames > 0 ? ((latest.playerWins / totalGames) * 100).toFixed(1) : '0.0';
    const aiRate = totalGames > 0 ? ((latest.aiWins / totalGames) * 100).toFixed(1) : '0.0';

    let leadText = 'Tied Series';
    let leadColor = '#94a3b8';
    if (latest.playerWins > latest.aiWins) {
      leadText = `${playerName} (+${latest.playerWins - latest.aiWins})`;
      leadColor = '#34d399';
    } else if (latest.aiWins > latest.playerWins) {
      leadText = `AI (+${latest.aiWins - latest.playerWins})`;
      leadColor = '#f87171';
    }

    return {
      totalMatches: latest.match,
      playerWins: latest.playerWins,
      aiWins: latest.aiWins,
      playerRate,
      aiRate,
      leadText,
      leadColor,
    };
  }, [dataPoints, playerName]);

  // Demo simulation buttons to rapidly test trend line progression
  const simulateSampleMatch = (winnerType: 'player' | 'ai') => {
    const latest = dataPoints[dataPoints.length - 1] || { playerWins: 0, aiWins: 0, match: 0, netDiff: 0 };
    const nextMatch = latest.match + 1;
    const newPlayerWins = winnerType === 'player' ? latest.playerWins + 1 : latest.playerWins;
    const newAiWins = winnerType === 'ai' ? latest.aiWins + 1 : latest.aiWins;

    const diffLevel = localStorage.getItem('nim_ai_difficulty') || 'Hard';
    const ruleType = (document.getElementById('rule-selector') as HTMLSelectElement)?.value || 'Normal';

    const newPoint: SeriesPoint = {
      match: nextMatch,
      matchLabel: `M${nextMatch}`,
      playerWins: newPlayerWins,
      aiWins: newAiWins,
      netDiff: newPlayerWins - newAiWins,
      winner: winnerType === 'player' ? playerName : `Opponent (${diffLevel} AI)`,
      difficulty: diffLevel,
      rule: ruleType,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...dataPoints, newPoint];
    setDataPoints(updated);
    localStorage.setItem('nim_series_trend_history', JSON.stringify(updated));
    localStorage.setItem('nim_player_wins', newPlayerWins.toString());
    localStorage.setItem('nim_opponent_wins', newAiWins.toString());
    localStorage.setItem('nim_match_count', nextMatch.toString());

    // Sync HTML scoreboard pill
    const sb = document.getElementById('scoreboard-pill');
    if (sb) sb.innerText = `🏆 ${playerName}: ${newPlayerWins} | Opponent: ${newAiWins}`;
  };

  const resetSeriesChart = () => {
    if (confirm('Reset series chart trend and history?')) {
      const baseline: SeriesPoint[] = [
        {
          match: 0,
          matchLabel: 'Start',
          playerWins: 0,
          aiWins: 0,
          netDiff: 0,
          winner: 'Baseline',
        },
      ];
      setDataPoints(baseline);
      localStorage.setItem('nim_series_trend_history', JSON.stringify(baseline));
      localStorage.setItem('nim_player_wins', '0');
      localStorage.setItem('nim_opponent_wins', '0');
      localStorage.setItem('nim_match_count', '0');

      const sb = document.getElementById('scoreboard-pill');
      if (sb) sb.innerText = `🏆 ${playerName}: 0 | Opponent: 0`;

      window.dispatchEvent(new Event('nim_series_updated'));
    }
  };

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        padding: '16px 20px',
        color: '#f8fafc',
      }}
    >
      {/* Top Controls & Metrics Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px 14px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Series Matches</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{metrics.totalMatches}</div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px 14px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{playerName} Wins</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
            {metrics.playerWins}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>({metrics.playerRate}%)</span>
          </div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px 14px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#f43f5e' }}>AI Opponent Wins</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e' }}>
            {metrics.aiWins}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>({metrics.aiRate}%)</span>
          </div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px 14px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Series Leader</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: metrics.leadColor, marginTop: '3px' }}>
            {metrics.leadText}
          </div>
        </div>
      </div>

      {/* Action / View Switcher Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>View Mode:</span>
          <button
            onClick={() => setViewMode('cumulative')}
            style={{
              background: viewMode === 'cumulative' ? '#0284c7' : '#1e293b',
              color: viewMode === 'cumulative' ? '#fff' : '#94a3b8',
              border: '1px solid #334155',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: viewMode === 'cumulative' ? 600 : 400,
            }}
          >
            Cumulative Wins Trend
          </button>
          <button
            onClick={() => setViewMode('diff')}
            style={{
              background: viewMode === 'diff' ? '#0284c7' : '#1e293b',
              color: viewMode === 'diff' ? '#fff' : '#94a3b8',
              border: '1px solid #334155',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: viewMode === 'diff' ? 600 : 400,
            }}
          >
            Net Win Margin (Lead)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => simulateSampleMatch('player')}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
            title="Simulate 1 win for the Player to test trend line charting"
          >
            +1 Player Win
          </button>
          <button
            onClick={() => simulateSampleMatch('ai')}
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f87171',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
            title="Simulate 1 win for the AI to test trend line charting"
          >
            +1 AI Win
          </button>
          <button
            onClick={resetSeriesChart}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
            title="Clear series history"
          >
            Reset Chart
          </button>
        </div>
      </div>

      {/* Recharts Responsive Container */}
      <div style={{ width: '100%', height: 280, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'cumulative' ? (
            <LineChart data={dataPoints} margin={{ top: 10, right: 25, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="matchLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip playerName={playerName} />} />
              <Legend
                wrapperStyle={{ paddingTop: 10, fontSize: '0.85rem' }}
                formatter={(val) => {
                  if (val === 'playerWins') return `${playerName} Cumulative Wins`;
                  if (val === 'aiWins') return `Autonomous AI Cumulative Wins`;
                  return val;
                }}
              />
              <Line
                type="monotone"
                dataKey="playerWins"
                name="playerWins"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0284c7', stroke: '#38bdf8', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={600}
              />
              <Line
                type="monotone"
                dataKey="aiWins"
                name="aiWins"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ r: 4, fill: '#be123c', stroke: '#f43f5e', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={600}
              />
            </LineChart>
          ) : (
            <LineChart data={dataPoints} margin={{ top: 10, right: 25, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="matchLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" label={{ value: 'Tied (0)', fill: '#64748b', fontSize: 10, position: 'insideTopLeft' }} />
              <Tooltip content={<CustomTooltip playerName={playerName} />} />
              <Legend
                wrapperStyle={{ paddingTop: 10, fontSize: '0.85rem' }}
                formatter={() => `Series Win Differential (${playerName} Lead vs. AI)`}
              />
              <Line
                type="monotone"
                dataKey="netDiff"
                name="netDiff"
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ r: 4, fill: '#7e22ce', stroke: '#a855f7', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#a855f7', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={600}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
        <span>📊 Trend updates automatically after each match is completed.</span>
        <span>Generated with Recharts & SVG vector rendering</span>
      </div>
    </div>
  );
};
