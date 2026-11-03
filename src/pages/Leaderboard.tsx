import { useMemo } from 'react';
import { Trophy, Zap, Target, TrendingUp, User, Crown, Terminal, Activity } from 'lucide-react';
import { useLeaderboard, useUserXp } from '@/hooks/useData';
import { useAuth } from '@/lib/auth';

// Updated colors to match the new theme
const USER_COLORS = ['#84cc16', '#60a5fa', '#f97316', '#a78bfa', '#f472b6', '#facc15', '#22d3ee', '#fb7185'];

export function Leaderboard() {
  const { entries, series, loading } = useLeaderboard();
  const { xp } = useUserXp();
  const { profile } = useAuth();
  const currentUser = profile?.username ?? '';

  // Filter out 'anon' or empty users from the leaderboard entirely
  const validEntries = entries.filter(e => e.user_id && e.user_id !== 'anon');
  const validSeries = series.filter(s => s.user_id && s.user_id !== 'anon');

  const myEntry = validEntries.find((e) => e.user_id === currentUser);
  const myRank = myEntry?.rank ?? '-';

  // Build SVG line chart
  const W = 800;
  const H = 320;
  const PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allDates = useMemo(() => {
    const ds = new Set<string>();
    validSeries.forEach((s) => s.points.forEach((p) => ds.add(p.date)));
    return Array.from(ds).sort();
  }, [validSeries]);

  const maxCumulative = useMemo(() => {
    let m = 0;
    validSeries.forEach((s) => s.points.forEach((p) => { if (p.cumulative > m) m = p.cumulative; }));
    // Add a little headroom to the top of the graph
    return Math.max(m * 1.2, 100); 
  }, [validSeries]);

  const xScale = (date: string) => {
    if (allDates.length <= 1) return PAD.left + chartW / 2;
    const idx = allDates.indexOf(date);
    return PAD.left + (idx / (allDates.length - 1)) * chartW;
  };

  const yScale = (val: number) => PAD.top + chartH - (val / maxCumulative) * chartH;

  const pathFor = (s: { points: { date: string; cumulative: number }[] }) => {
    if (s.points.length === 0) return '';
    return s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.date)} ${yScale(p.cumulative)}`).join(' ');
  };

  // Create a closed path for the gradient fill under the line
  const areaPathFor = (s: { points: { date: string; cumulative: number }[] }) => {
    if (s.points.length === 0) return '';
    const linePath = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.date)} ${yScale(p.cumulative)}`).join(' ');
    const lastPoint = s.points[s.points.length - 1];
    const firstPoint = s.points[0];
    return `${linePath} L ${xScale(lastPoint.date)} ${PAD.top + chartH} L ${xScale(firstPoint.date)} ${PAD.top + chartH} Z`;
  };

  const colorFor = (userId: string, rank: number) => {
    if (userId === currentUser) return '#84cc16';
    // Offset index by 1 so the first non-me user doesn't get the exact same green if I'm not in the list
    return USER_COLORS[(rank + 1) % USER_COLORS.length];
  };

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#facc15]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#84cc16]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
            <Trophy className="w-3.5 h-3.5 text-[#facc15]" />
            <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Global Rankings</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Leaderboard</h1>
          <p className="text-[#71717a] text-lg">Track your XP progress and see how you stack up against other hackers.</p>
        </div>

        {/* Your stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-fade-in-up delay-100">
          <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between h-32 transition-all duration-300 hover:border-[#facc15]/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#facc15]/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#facc15]" />
              </div>
              <span className="text-xs font-mono text-[#52525b] uppercase tracking-wider">Your Rank</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">#{myRank}</p>
          </div>
          
          <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between h-32 transition-all duration-300 hover:border-[#84cc16]/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#84cc16]/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#84cc16] fill-[#84cc16]/20" />
              </div>
              <span className="text-xs font-mono text-[#52525b] uppercase tracking-wider">Total XP</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{xp}</p>
          </div>
          
          <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between h-32 transition-all duration-300 hover:border-[#60a5fa]/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#60a5fa]/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#60a5fa]" />
              </div>
              <span className="text-xs font-mono text-[#52525b] uppercase tracking-wider">Targets Rooted</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{myEntry?.solved_count ?? 0}</p>
          </div>
        </div>

        {/* Line chart */}
        <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-8 mb-10 animate-fade-in-up delay-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#84cc16]/30 to-transparent"></div>
          
          <h2 className="text-sm font-bold text-[#f4f4f5] mb-8 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Activity className="w-4 h-4 text-[#84cc16]" /> XP Progress Over Time
          </h2>
          
          {loading ? (
            <div className="h-64 animate-pulse bg-[#18181b] rounded-xl" />
          ) : validSeries.length === 0 || allDates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#18181b] flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-[#3f3f46]" />
              </div>
              <p className="text-[#71717a] font-medium">No data available yet. Be the first to capture a flag!</p>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6">
                {validSeries.map((s) => (
                  <div key={s.user_id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b]/50 border border-[#27272a]">
                    <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: colorFor(s.user_id, s.rank), color: colorFor(s.user_id, s.rank) }} />
                    <span className={`text-xs font-mono uppercase tracking-wider ${s.user_id === currentUser ? 'text-[#84cc16] font-bold' : 'text-[#71717a]'}`}>
                      {s.user_id}{s.user_id === currentUser && ' (YOU)'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]" style={{ maxHeight: 320 }}>
                  <defs>
                    {/* Gradient for the area under the line */}
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#84cc16" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const y = PAD.top + chartH * (1 - t);
                    return (
                      <g key={t}>
                        <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                        <text x={PAD.left - 12} y={y + 4} fill="#52525b" fontSize="10" textAnchor="end" fontFamily="monospace">
                          {Math.round(maxCumulative * t)}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* X axis labels */}
                  {allDates.length > 0 && (
                    <>
                      <text x={PAD.left} y={H - 10} fill="#52525b" fontSize="10" textAnchor="start" fontFamily="monospace">
                        {allDates[0]?.slice(0, 10)}
                      </text>
                      {allDates.length > 2 && (
                        <text x={PAD.left + chartW / 2} y={H - 10} fill="#52525b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                          {allDates[Math.floor(allDates.length / 2)]?.slice(0, 10)}
                        </text>
                      )}
                      <text x={W - PAD.right} y={H - 10} fill="#52525b" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {allDates[allDates.length - 1]?.slice(0, 10)}
                      </text>
                    </>
                  )}
                  
                  {/* Lines and Areas */}
                  {validSeries.map((s) => {
                    const color = colorFor(s.user_id, s.rank);
                    const isMe = s.user_id === currentUser;
                    return (
                      <g key={s.user_id}>
                        {/* Area Fill (only for the current user to keep it clean) */}
                        {isMe && (
                          <path
                            d={areaPathFor(s)}
                            fill="url(#areaGradient)"
                          />
                        )}
                        
                        {/* The Line */}
                        <path
                          d={pathFor(s)}
                          fill="none"
                          stroke={color}
                          strokeWidth={isMe ? 3 : 2}
                          opacity={isMe ? 1 : 0.5}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          style={{ filter: isMe ? 'drop-shadow(0 0 8px rgba(132, 204, 22, 0.5))' : 'none' }}
                        />
                        
                        {/* End dot */}
                        {s.points.length > 0 && (
                          <circle
                            cx={xScale(s.points[s.points.length - 1].date)}
                            cy={yScale(s.points[s.points.length - 1].cumulative)}
                            r={isMe ? 5 : 3}
                            fill={color}
                            stroke="#09090b"
                            strokeWidth="2"
                            style={{ filter: isMe ? 'drop-shadow(0 0 5px rgba(132, 204, 22, 0.8))' : 'none' }}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Full ranking table */}
        <div className="bg-[#09090b] border border-[#27272a] rounded-2xl overflow-hidden animate-fade-in-up delay-300">
          <div className="px-6 py-4 border-b border-[#27272a] bg-[#18181b]/30 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#52525b]" />
            <h2 className="text-xs font-bold text-[#f4f4f5] font-mono uppercase tracking-wider">Full Rankings</h2>
          </div>
          
          {loading ? (
            <div className="h-32 animate-pulse bg-[#18181b]" />
          ) : validEntries.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#52525b] font-mono">NO_DATA_FOUND</div>
          ) : (
            <div className="divide-y divide-[#27272a]/50">
              {validEntries.map((entry) => {
                const isMe = entry.user_id === currentUser;
                return (
                  <div
                    key={entry.user_id}
                    className={`px-6 py-4 flex items-center gap-4 transition-colors ${isMe ? 'bg-[#84cc16]/[0.03]' : 'hover:bg-[#18181b]/50'}`}
                  >
                    <div className="w-8 flex justify-center">
                      {entry.rank === 1 ? (
                        <Crown className="w-5 h-5 text-[#facc15] fill-[#facc15]/20" />
                      ) : (
                        <span className={`font-mono font-bold text-sm ${entry.rank <= 3 ? 'text-[#f97316]' : 'text-[#52525b]'}`}>
                          {String(entry.rank).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isMe ? 'bg-[#84cc16]/10 border-[#84cc16]/30' : 'bg-[#18181b] border-[#27272a]'}`}>
                      <User className={`w-4 h-4 ${isMe ? 'text-[#84cc16]' : 'text-[#52525b]'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold truncate block ${isMe ? 'text-[#84cc16]' : 'text-[#f4f4f5]'}`}>
                        {entry.user_id} {isMe && <span className="text-xs font-normal text-[#84cc16]/70 ml-1">(YOU)</span>}
                      </span>
                    </div>
                    
                    <div className="text-right flex items-center gap-6">
                      <div className="hidden sm:block">
                        <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider mb-0.5">Solved</p>
                        <p className="text-sm font-bold text-[#a1a1aa] font-mono">{entry.solved_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider mb-0.5">XP</p>
                        <p className="text-sm font-black text-[#facc15] font-mono">{entry.total_xp}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}