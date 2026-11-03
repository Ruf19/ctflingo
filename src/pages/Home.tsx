import { useEffect, useState } from 'react';
import { Shield, Target, BookOpen, Trophy, ArrowRight, Activity, Lock, Zap, CheckCircle2, Terminal, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useUnits, useUserXp, useJoinedUnits, useSolvedChallenges } from '@/hooks/useData';
import type { Unit } from '@/types';

interface HomeProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const { profile } = useAuth();
  const { units, loading } = useUnits();
  const { xp } = useUserXp();
  const { joinedUnitIds } = useJoinedUnits();
  const { solvedIds } = useSolvedChallenges();
  const [stats, setStats] = useState({ lessons: 0, challenges: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('challenges').select('id', { count: 'exact', head: true }),
    ]).then(([l, c]) => {
      setStats({ lessons: l.count ?? 0, challenges: c.count ?? 0 });
    });
  }, []);

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      
      {/* Ambient Background Glows (No text, just smooth gradients) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#84cc16]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#f97316]/5 rounded-full blur-[150px] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#84cc16 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        
        {/* Hero / Welcome Section */}
        <div className="mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-6">
            <Activity className="w-3.5 h-3.5 text-[#84cc16]" />
            <span className="text-xs font-medium text-[#a1a1aa]">System Online // Welcome back, {profile?.username}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Ready to hack<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#a3e635]">something new?</span>
          </h1>
          <p className="text-lg text-[#71717a] max-w-2xl leading-relaxed">
            Jump back into your active units, tackle new challenges, and keep climbing the leaderboard.
          </p>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 animate-fade-in-up delay-100">
          {[
            { label: 'Your XP', value: xp, icon: Zap, color: 'text-[#84cc16]', bg: 'bg-[#84cc16]/10', border: 'border-[#84cc16]/20' },
            { label: 'Solved', value: solvedIds.size, icon: CheckCircle2, color: 'text-[#f4f4f5]', bg: 'bg-white/5', border: 'border-white/10' },
            { label: 'Active Units', value: joinedUnitIds.size, icon: BookOpen, color: 'text-[#60a5fa]', bg: 'bg-[#60a5fa]/10', border: 'border-[#60a5fa]/20' },
            { label: 'Total Challenges', value: stats.challenges, icon: Trophy, color: 'text-[#f97316]', bg: 'bg-[#f97316]/10', border: 'border-[#f97316]/20' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`bg-[#09090b]/80 backdrop-blur-sm border ${stat.border} rounded-xl p-5 flex flex-col justify-between h-32 transition-all duration-300 hover:-translate-y-1`}>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white tracking-tight">{loading ? '—' : stat.value}</p>
                  <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Action Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 animate-fade-in-up delay-200">
          
          {/* Continue Learning Card */}
          <button 
            onClick={() => onNavigate('explore')}
            className="lg:col-span-2 group relative overflow-hidden bg-[#09090b] border border-[#27272a] rounded-2xl p-8 text-left transition-all duration-300 hover:border-[#84cc16]/50 hover:shadow-[0_0_30px_rgba(132,204,22,0.05)] flex flex-col justify-between min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#84cc16]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#84cc16]/10 transition-all duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#84cc16]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-[#84cc16]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-[#84cc16] transition-colors">Explore Units</h2>
              <p className="text-[#71717a] max-w-md">Browse all available learning paths, from beginner web exploitation to advanced reverse engineering.</p>
            </div>
            
            <div className="relative z-10 mt-8 flex items-center gap-2 text-[#84cc16] font-medium text-sm group-hover:gap-3 transition-all">
              View all units <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Leaderboard Card */}
          <button 
            onClick={() => onNavigate('leaderboard')}
            className="group relative overflow-hidden bg-[#09090b] border border-[#27272a] rounded-2xl p-8 text-left transition-all duration-300 hover:border-[#f97316]/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.05)] flex flex-col justify-between min-h-[200px]"
          >
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#f97316]/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 group-hover:bg-[#f97316]/10 transition-all duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#f97316]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-6 h-6 text-[#f97316]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-[#f97316] transition-colors">Leaderboard</h2>
              <p className="text-[#71717a] text-sm">See how your XP stacks up against the rest of the hackers.</p>
            </div>
            
            <div className="relative z-10 mt-8 flex items-center gap-2 text-[#f97316] font-medium text-sm group-hover:gap-3 transition-all">
              Check rankings <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Featured / Recent Units */}
        <div className="animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#52525b]" />
              Available Targets
            </h2>
            <button
              onClick={() => onNavigate('explore')}
              className="text-sm text-[#71717a] hover:text-[#84cc16] transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#09090b] border border-[#27272a] rounded-xl h-48 animate-pulse" />
              ))}
            </div>
          ) : units.length === 0 ? (
            <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-12 text-center">
              <Lock className="w-10 h-10 text-[#27272a] mx-auto mb-3" />
              <p className="text-[#71717a] mb-2">No targets acquired yet</p>
              <p className="text-sm text-[#52525b]">An admin needs to deploy a unit first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.slice(0, 3).map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  userXp={xp}
                  joined={joinedUnitIds.has(unit.id)}
                  solvedIds={solvedIds}
                  onClick={() => onNavigate('unit', { id: unit.id })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Admin Quick Access (Only visible to admins) */}
        {profile?.role === 'admin' && (
          <div className="mt-12 pt-8 border-t border-[#18181b] animate-fade-in-up delay-300">
             <button
              onClick={() => onNavigate('admin')}
              className="w-full flex items-center justify-between p-4 bg-[#09090b] border border-[#27272a] rounded-xl hover:border-[#f4f4f5]/20 hover:bg-[#18181b] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f4f4f5]/5 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#f4f4f5]" />
                </div>
                <span className="font-medium text-[#a1a1aa] group-hover:text-white transition-colors">Admin Control Panel</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#52525b] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// Redesigned Unit Card Component
function UnitCard({
  unit,
  userXp,
  joined,
  solvedIds,
  onClick,
}: {
  unit: Unit;
  userXp: number;
  joined: boolean;
  solvedIds: Set<string>;
  onClick: () => void;
}) {
  const locked = userXp < unit.xp_required;
  const challenges = unit.challenges ?? [];
  const solvedCount = challenges.filter((c) => solvedIds.has(c.id)).length;
  const totalChallenges = challenges.length;
  const progressPct = totalChallenges > 0 ? Math.round((solvedCount / totalChallenges) * 100) : 0;
  const fullyCompleted = joined && totalChallenges > 0 && solvedCount === totalChallenges;

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`group relative bg-[#09090b] border rounded-xl p-6 text-left transition-all duration-300 flex flex-col h-full
        ${locked 
          ? 'border-[#18181b] opacity-50 cursor-not-allowed' 
          : 'border-[#27272a] hover:border-[#84cc16]/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(132,204,22,0.1)]'
        } 
        ${fullyCompleted ? 'ring-1 ring-[#84cc16]/30' : ''}
      `}
    >
      {/* Status Badges */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        {locked && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#18181b] text-xs text-[#f97316] border border-[#f97316]/20 font-mono">
            <Lock className="w-3 h-3" />
            {unit.xp_required} XP
          </div>
        )}
        {fullyCompleted && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#84cc16]/10 text-xs text-[#84cc16] border border-[#84cc16]/20 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Rooted
          </div>
        )}
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 ${locked ? 'bg-[#18181b] grayscale' : 'bg-[#18181b] group-hover:bg-[#27272a] transition-colors'}`}>
          {unit.thumbnail_emoji}
        </div>
        <div className="pt-1">
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block mb-1.5
            ${unit.difficulty === 'beginner' ? 'bg-[#84cc16]/10 text-[#84cc16]' : 
              unit.difficulty === 'intermediate' ? 'bg-[#facc15]/10 text-[#facc15]' :
              unit.difficulty === 'advanced' ? 'bg-[#f97316]/10 text-[#f97316]' :
              'bg-[#ef4444]/10 text-[#ef4444]'}
          `}>
            {unit.difficulty}
          </span>
          <h3 className="font-bold text-white text-lg leading-tight group-hover:text-[#84cc16] transition-colors">{unit.title}</h3>
        </div>
      </div>
      
      <p className="text-sm text-[#71717a] line-clamp-2 mb-6 flex-1">{unit.description}</p>

      {/* Progress Bar */}
      {joined && totalChallenges > 0 && !fullyCompleted && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span className="text-[#52525b]">PROGRESS</span>
            <span className="text-[#84cc16]">{solvedCount}/{totalChallenges}</span>
          </div>
          <div className="h-1.5 bg-[#18181b] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#84cc16] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-[#52525b] pt-4 border-t border-[#18181b] font-mono">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {unit.lessons?.length ?? 0} LESSONS
        </span>
        <span className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" />
          {totalChallenges} FLAGS
        </span>
      </div>
    </button>
  );
}