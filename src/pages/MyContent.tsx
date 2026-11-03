import { BookOpen, Trophy, Lock, CheckCircle2, Zap, Terminal, ChevronRight, Flag, Clock } from 'lucide-react';
import { useUnits, useUserXp, useSolvedChallenges } from '@/hooks/useData';

interface MyContentProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export function MyLessons({ onNavigate }: MyContentProps) {
  const { units, loading } = useUnits();

  const allLessons = units.flatMap((u) => (u.lessons ?? []).map((l) => ({ lesson: l, unit: u })));

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#60a5fa]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#84cc16]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
            <BookOpen className="w-3.5 h-3.5 text-[#60a5fa]" />
            <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Knowledge Base</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">My Lessons</h1>
          <p className="text-[#71717a] text-lg">Review all available modules across your active units.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#09090b] border border-[#27272a] rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        ) : allLessons.length === 0 ? (
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-16 text-center animate-fade-in-up delay-100">
            <div className="w-16 h-16 rounded-full bg-[#18181b] flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-[#3f3f46]" />
            </div>
            <p className="text-[#f4f4f5] font-medium text-lg mb-2">No Data Found</p>
            <p className="text-[#52525b] text-sm">There are no lessons available in your current units.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allLessons.map(({ lesson, unit }, i) => (
              <button
                key={lesson.id}
                onClick={() => onNavigate('lesson', { id: lesson.id, unitId: unit.id })}
                style={{ animationDelay: `${i * 0.05}s` }}
                className="group w-full bg-[#09090b] border border-[#27272a] rounded-xl p-5 text-left hover:border-[#60a5fa]/50 hover:bg-[#18181b]/50 transition-all duration-300 flex items-center gap-5 animate-fade-in-up"
              >
                <div className="w-12 h-12 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center shrink-0 group-hover:border-[#60a5fa]/30 group-hover:bg-[#60a5fa]/10 transition-colors">
                  <BookOpen className="w-5 h-5 text-[#60a5fa]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white mb-1 group-hover:text-[#60a5fa] transition-colors truncate">{lesson.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#52525b] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3 h-3" /> {unit.title}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#3f3f46]"></span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {lesson.duration_minutes}m
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-[#3f3f46] group-hover:text-[#60a5fa] group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MyChallenges({ onNavigate }: MyContentProps) {
  const { units, loading } = useUnits();
  const { xp } = useUserXp();
  const { solvedIds } = useSolvedChallenges();

  const allChallenges = units.flatMap((u) => (u.challenges ?? []).map((c) => ({ challenge: c, unit: u })));

  // Dynamic difficulty colors
  const diffColors: Record<string, string> = {
    beginner: 'text-[#84cc16] bg-[#84cc16]/10 border-[#84cc16]/20',
    intermediate: 'text-[#facc15] bg-[#facc15]/10 border-[#facc15]/20',
    advanced: 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/20',
    expert: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
  };

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#f97316]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#84cc16]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        
        {/* Header & XP Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
              <Flag className="w-3.5 h-3.5 text-[#f97316]" />
              <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Target Practice</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Challenges</h1>
            <p className="text-[#71717a] text-lg">Track your progress and capture flags across all units.</p>
          </div>

          {/* Sleek XP Card */}
          <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#84cc16]/20 rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_30px_rgba(132,204,22,0.05)] min-w-[280px]">
            <div className="w-12 h-12 rounded-xl bg-[#84cc16]/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-[#84cc16] fill-[#84cc16]/20" />
            </div>
            <div>
              <p className="text-2xl font-black text-white tracking-tight leading-none mb-1">{xp} <span className="text-sm font-medium text-[#84cc16]">XP</span></p>
              <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider mt-1">{solvedIds.size} Targets Rooted</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#09090b] border border-[#27272a] rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : allChallenges.length === 0 ? (
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-16 text-center animate-fade-in-up delay-100">
            <div className="w-16 h-16 rounded-full bg-[#18181b] flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-[#3f3f46]" />
            </div>
            <p className="text-[#f4f4f5] font-medium text-lg mb-2">No Targets Found</p>
            <p className="text-[#52525b] text-sm">There are no challenges available in your current units.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allChallenges.map(({ challenge, unit }, i) => {
              const solved = solvedIds.has(challenge.id);
              return (
                <button
                  key={challenge.id}
                  onClick={() => onNavigate('challenge', { id: challenge.id, unitId: unit.id })}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  className={`group relative bg-[#09090b] border rounded-2xl p-6 text-left transition-all duration-300 flex flex-col h-full overflow-hidden animate-fade-in-up
                    ${solved 
                      ? 'border-[#84cc16]/30 bg-[#84cc16]/[0.02]' 
                      : 'border-[#27272a] hover:border-[#f97316]/50 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)]'
                    }
                  `}
                >
                  {/* Hover Glow */}
                  {!solved && (
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#f97316]/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#f97316]/10 transition-all duration-500 pointer-events-none" />
                  )}

                  {solved && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#84cc16]/10 text-xs text-[#84cc16] border border-[#84cc16]/20 font-bold font-mono z-10">
                      <CheckCircle2 className="w-3 h-3" /> ROOTED
                    </div>
                  )}

                  <div className="relative z-10 flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      solved ? 'bg-[#84cc16]/10 border-[#84cc16]/20' : 'bg-[#18181b] border-[#27272a] group-hover:border-[#f97316]/30'
                    }`}>
                      {solved ? (
                        <Flag className="w-5 h-5 text-[#84cc16] fill-[#84cc16]/20" />
                      ) : (
                        <Trophy className="w-5 h-5 text-[#f97316]" />
                      )}
                    </div>
                    
                    {!solved && (
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#facc15]/10 border border-[#facc15]/20 text-xs font-bold text-[#facc15] font-mono">
                        <Zap className="w-3 h-3 fill-current" /> +{challenge.xp_reward}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${diffColors[challenge.difficulty] || diffColors.beginner}`}>
                        {challenge.difficulty}
                      </span>
                      <span className="text-[10px] text-[#52525b] font-mono uppercase">{challenge.challenge_type.replace('_', ' ')}</span>
                    </div>
                    <h3 className={`font-bold text-lg mb-2 transition-colors line-clamp-1 ${solved ? 'text-[#a1a1aa]' : 'text-white group-hover:text-[#f97316]'}`}>{challenge.title}</h3>
                    <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3 h-3" /> {unit.title}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center justify-end pt-4 mt-4 border-t border-[#27272a]/50 text-xs text-[#52525b] font-mono">
                    {!solved && (
                       <div className="flex items-center gap-1 text-[#f97316] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                         HACK <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                       </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}