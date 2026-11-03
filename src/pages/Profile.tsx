import { BookOpen, Crown, LogOut, Trophy, User, Zap, Terminal, Shield, Activity } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUserXp, useSolvedChallenges, useJoinedUnits } from '@/hooks/useData';

export function Profile() {
  const { session, profile, signOut } = useAuth();
  const { xp } = useUserXp();
  const { solvedIds } = useSolvedChallenges();
  const { joinedUnitIds } = useJoinedUnits();

  if (!profile) return null;

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#84cc16]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#f97316]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
            <User className="w-3.5 h-3.5 text-[#84cc16]" />
            <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Operator Profile</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">My Profile</h1>
          <p className="text-[#71717a] text-lg">Manage your account and track your hacking progress.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 mb-10 shadow-xl relative overflow-hidden animate-fade-in-up delay-100">
          {/* Top Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#84cc16]/30 to-transparent"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-[#18181b] border border-[#84cc16]/30 flex items-center justify-center shadow-[0_0_30px_rgba(132,204,22,0.1)]">
                <span className="text-4xl font-black text-[#84cc16]">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Online Status Dot */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#84cc16] border-4 border-[#09090b] shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                    <h2 className="text-3xl font-black text-white tracking-tight">{profile.username}</h2>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                        profile.role === 'admin'
                          ? 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                          : 'bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/30'
                      }`}
                    >
                      {profile.role === 'admin' ? <Crown className="w-3 h-3 fill-current" /> : <Shield className="w-3 h-3" />}
                      {profile.role === 'admin' ? 'Root Access' : 'Standard User'}
                    </span>
                  </div>
                  <p className="text-[#a1a1aa] font-mono text-sm mb-1 flex items-center justify-center sm:justify-start gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[#52525b]" />
                    {session?.user.email}
                  </p>
                  <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5 mt-2">
                    <Activity className="w-3 h-3" />
                    Active since {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={signOut}
                  className="group px-5 py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] rounded-lg hover:bg-[#ef4444]/10 hover:border-[#ef4444]/30 hover:text-[#ef4444] transition-all duration-300 flex items-center gap-2 text-sm font-medium shrink-0"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up delay-200">
          
          {/* XP Card */}
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between h-40 transition-all duration-300 hover:border-[#84cc16]/30 hover:shadow-[0_0_30px_rgba(132,204,22,0.05)] group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-5 h-5 text-[#84cc16] fill-[#84cc16]/20" />
              </div>
              <span className="text-xs font-mono text-[#52525b] uppercase tracking-wider">Total XP</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{xp}</p>
          </div>

          {/* Solved Card */}
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between h-40 transition-all duration-300 hover:border-[#f97316]/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.05)] group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-5 h-5 text-[#f97316]" />
              </div>
              <span className="text-xs font-mono text-[#52525b] uppercase tracking-wider">Targets Rooted</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{solvedIds.size}</p>
          </div>

          {/* Units Card */}
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between h-40 transition-all duration-300 hover:border-[#60a5fa]/30 hover:shadow-[0_0_30px_rgba(96,165,250,0.05)] group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#60a5fa]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-5 h-5 text-[#60a5fa]" />
              </div>
              <span className="text-xs font-mono text-[#52525b] uppercase tracking-wider">Active Units</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{joinedUnitIds.size}</p>
          </div>

        </div>
      </div>
    </div>
  );
}