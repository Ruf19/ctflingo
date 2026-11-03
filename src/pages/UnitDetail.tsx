import { ArrowLeft, BookOpen, Trophy, Clock, Target, CheckCircle2, Tag, ChevronRight, Lock, Zap, Play, Terminal, Flag } from 'lucide-react';
import { useUnit, useUserXp, useJoinedUnits, useSolvedChallenges } from '@/hooks/useData';

interface UnitDetailProps {
  unitId: string | undefined;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onBack: () => void;
}

export function UnitDetail({ unitId, onNavigate, onBack }: UnitDetailProps) {
  const { unit, loading, error } = useUnit(unitId);
  const { xp } = useUserXp();
  const { joinedUnitIds, joinUnit } = useJoinedUnits();
  const { solvedIds } = useSolvedChallenges();

  if (loading) {
    return (
      <div className="min-h-full bg-[#050505] px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-32 bg-[#18181b] rounded animate-pulse" />
          <div className="h-64 bg-[#09090b] border border-[#27272a] rounded-2xl animate-pulse" />
          <div className="h-40 bg-[#09090b] border border-[#27272a] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="min-h-full bg-[#050505] flex items-center justify-center px-8 py-12">
        <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-6">
            <Terminal className="w-8 h-8 text-[#ef4444]" />
          </div>
          <p className="text-[#f4f4f5] font-medium text-lg mb-2">Target Not Found</p>
          <p className="text-[#52525b] text-sm mb-8">The unit you are looking for does not exist or has been moved.</p>
          <button 
            onClick={onBack} 
            className="px-6 py-2.5 bg-[#18181b] border border-[#27272a] text-[#f4f4f5] font-medium rounded-lg hover:bg-[#27272a] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Base
          </button>
        </div>
      </div>
    );
  }

  const locked = xp < unit.xp_required;
  const joined = joinedUnitIds.has(unit.id);
  const lessons = unit.lessons ?? [];
  const challenges = unit.challenges ?? [];
  const solvedCount = challenges.filter((c) => solvedIds.has(c.id)).length;
  const totalChallenges = challenges.length;
  const progressPct = totalChallenges > 0 ? Math.round((solvedCount / totalChallenges) * 100) : 0;
  const fullyCompleted = joined && totalChallenges > 0 && solvedCount === totalChallenges;

  // Dynamic difficulty colors
  const diffColors = {
    beginner: 'text-[#84cc16] bg-[#84cc16]/10 border-[#84cc16]/20',
    intermediate: 'text-[#facc15] bg-[#facc15]/10 border-[#facc15]/20',
    advanced: 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/20',
    expert: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
  };

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#84cc16]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#f97316]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-12">
        
        {/* Back Button */}
        <button 
          onClick={onBack} 
          className="group flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#84cc16] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Explore
        </button>

        {/* Main Header Card */}
        <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden animate-fade-in-up">
          
          {/* Top Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#84cc16]/30 to-transparent"></div>

          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Emoji Icon Box */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 border shadow-inner ${
              locked ? 'bg-[#18181b] border-[#27272a] grayscale opacity-50' : 'bg-[#18181b]/50 border-[#27272a]'
            }`}>
              {unit.thumbnail_emoji}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider border ${diffColors[unit.difficulty]}`}>
                  {unit.difficulty}
                </span>
                <span className="text-xs text-[#52525b] font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" /> {unit.category}
                </span>
                <span className="text-xs text-[#52525b] font-mono flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {unit.estimated_hours}h EST
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">{unit.title}</h1>
              <p className="text-[#a1a1aa] leading-relaxed mb-6 max-w-3xl">{unit.description}</p>

              {unit.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {unit.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#71717a] font-mono uppercase tracking-wider">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Area: Locked / Join / Progress */}
          <div className="mt-8 pt-8 border-t border-[#27272a]/50">
            {locked ? (
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#f97316]/5 border border-[#f97316]/20 rounded-xl p-6">
                <div className="w-14 h-14 rounded-full bg-[#f97316]/10 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                  <Lock className="w-7 h-7 text-[#f97316]" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-lg font-bold text-[#f97316] mb-1">Access Denied</h3>
                  <p className="text-sm text-[#a1a1aa]">
                    You need <span className="text-[#f97316] font-bold font-mono">{unit.xp_required} XP</span> to unlock this unit. You currently have <span className="text-[#84cc16] font-bold font-mono">{xp} XP</span>.
                  </p>
                </div>
              </div>
            ) : !joined ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#18181b]/30 border border-[#27272a] rounded-xl p-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Ready to deploy?</h3>
                  <p className="text-sm text-[#71717a]">Join this unit to track your progress and access all materials.</p>
                </div>
                <button
                  onClick={() => joinUnit(unit.id)}
                  className="px-8 py-3 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_25px_rgba(132,204,22,0.5)] flex items-center gap-2 whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Join Unit
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#84cc16]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    </div>
                    <span className="text-sm font-bold text-[#84cc16] font-mono uppercase tracking-wider">
                      {fullyCompleted ? 'Unit Rooted' : 'Deployment Active'}
                    </span>
                  </div>
                  {totalChallenges > 0 && (
                    <span className="text-sm font-bold text-[#f4f4f5] font-mono">
                      {solvedCount}/{totalChallenges} FLAGS <span className="text-[#52525b] font-normal">({progressPct}%)</span>
                    </span>
                  )}
                </div>
                
                {totalChallenges > 0 && (
                  <div className="h-2.5 bg-[#18181b] rounded-full overflow-hidden border border-[#27272a]/50">
                    <div
                      className="h-full bg-[#84cc16] rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(132,204,22,0.6)]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Learning Objectives */}
          {unit.objectives.length > 0 && !locked && (
            <div className="mt-8 pt-8 border-t border-[#27272a]/50">
              <h3 className="text-sm font-bold text-[#f4f4f5] mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Target className="w-4 h-4 text-[#84cc16]" />
                Mission Objectives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unit.objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#18181b]/30 border border-[#27272a]/50">
                    <CheckCircle2 className="w-4 h-4 text-[#52525b] mt-0.5 shrink-0" />
                    <span className="text-sm text-[#a1a1aa] leading-relaxed">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full Screen Locked Overlay Message */}
        {locked && (
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-16 text-center animate-fade-in-up delay-100">
            <div className="w-20 h-20 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#3f3f46]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Unit Encrypted</h2>
            <p className="text-[#71717a] max-w-md mx-auto mb-6">
              Earn <span className="text-[#f97316] font-bold">{unit.xp_required} XP</span> by completing challenges in other units to decrypt this content.
            </p>
            <button 
              onClick={onBack}
              className="px-6 py-2.5 bg-[#18181b] border border-[#27272a] text-[#f4f4f5] font-medium rounded-lg hover:bg-[#27272a] transition-colors inline-flex items-center gap-2"
            >
              Find other targets <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Lessons Section */}
        {!locked && (
          <div className="mb-12 animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#60a5fa]/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#60a5fa]" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Lessons</h2>
              <span className="text-xs text-[#52525b] font-mono bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">{lessons.length} MODULES</span>
            </div>

            {!joined ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-12 text-center">
                <Lock className="w-10 h-10 text-[#27272a] mx-auto mb-4" />
                <p className="text-[#71717a] font-medium">Join this unit to access the lessons.</p>
              </div>
            ) : lessons.length === 0 ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-12 text-center">
                <BookOpen className="w-10 h-10 text-[#27272a] mx-auto mb-4" />
                <p className="text-[#71717a] font-medium">No lessons added to this unit yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson, i) => (
                  <button
                    key={lesson.id}
                    onClick={() => onNavigate('lesson', { id: lesson.id, unitId: unit.id })}
                    className="group w-full bg-[#09090b] border border-[#27272a] rounded-xl p-5 text-left hover:border-[#60a5fa]/50 hover:bg-[#18181b]/50 transition-all duration-300 flex items-center gap-5"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#60a5fa] font-mono font-bold text-sm group-hover:border-[#60a5fa]/30 group-hover:bg-[#60a5fa]/10 transition-colors shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white mb-1 group-hover:text-[#60a5fa] transition-colors truncate">{lesson.title}</h3>
                      <p className="text-xs text-[#71717a] line-clamp-1">{lesson.summary || 'No summary available.'}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#52525b] font-mono shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {lesson.duration_minutes}m
                      </span>
                      <span className="hidden sm:flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        {lesson.content_blocks?.length ?? 0} BLOCKS
                      </span>
                      <ChevronRight className="w-5 h-5 text-[#3f3f46] group-hover:text-[#60a5fa] group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Challenges Section */}
        {!locked && (
          <div className="animate-fade-in-up delay-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#f97316]" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Challenges</h2>
              <span className="text-xs text-[#52525b] font-mono bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">{challenges.length} TARGETS</span>
            </div>

            {!joined ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-12 text-center">
                <Lock className="w-10 h-10 text-[#27272a] mx-auto mb-4" />
                <p className="text-[#71717a] font-medium">Join this unit to access the challenges.</p>
              </div>
            ) : challenges.length === 0 ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-12 text-center">
                <Trophy className="w-10 h-10 text-[#27272a] mx-auto mb-4" />
                <p className="text-[#71717a] font-medium">No challenges added to this unit yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.map((ch) => {
                  const solved = solvedIds.has(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => onNavigate('challenge', { id: ch.id, unitId: unit.id })}
                      className={`group relative bg-[#09090b] border rounded-xl p-6 text-left transition-all duration-300 flex flex-col h-full overflow-hidden
                        ${solved 
                          ? 'border-[#84cc16]/30 bg-[#84cc16]/[0.02]' 
                          : 'border-[#27272a] hover:border-[#f97316]/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(249,115,22,0.15)]'
                        }
                      `}
                    >
                      {/* Hover Glow */}
                      {!solved && (
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#f97316]/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#f97316]/10 transition-all duration-500 pointer-events-none" />
                      )}

                      {solved && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#84cc16]/10 text-xs text-[#84cc16] border border-[#84cc16]/20 font-bold font-mono z-10">
                          <CheckCircle2 className="w-3 h-3" />
                          ROOTED
                        </div>
                      )}

                      <div className="relative z-10 flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
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
                            <Zap className="w-3 h-3 fill-current" />
                            +{ch.xp_reward} XP
                          </div>
                        )}
                      </div>

                      <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${diffColors[ch.difficulty]}`}>
                            {ch.difficulty}
                          </span>
                          <span className="text-[10px] text-[#52525b] font-mono uppercase">{ch.challenge_type.replace('_', ' ')}</span>
                        </div>
                        <h3 className={`font-bold text-lg mb-2 transition-colors ${solved ? 'text-[#a1a1aa]' : 'text-white group-hover:text-[#f97316]'}`}>{ch.title}</h3>
                        <p className="text-sm text-[#71717a] line-clamp-2 leading-relaxed">{ch.description}</p>
                      </div>

                      <div className="relative z-10 flex items-center justify-between pt-4 mt-4 border-t border-[#27272a]/50 text-xs text-[#52525b] font-mono">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5"><Target className="w-3 h-3" /> {ch.objectives.length} OBJ</span>
                          <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3" /> {ch.hints?.length ?? 0} HINTS</span>
                        </div>
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
        )}
      </div>
    </div>
  );
}