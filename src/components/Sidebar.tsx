import { useState } from 'react';
import {
  Home,
  Compass,
  BookOpen,
  Trophy,
  LayoutDashboard,
  BarChart3,
  User,
  LogOut,
  Crown,
  ChevronLeft,
  ChevronRight,
  GitBranch // New Icon
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import logoImg from '@/assets/logoImg.png';

interface SidebarProps {
  current: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ current, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore Units', icon: Compass },
    { id: 'ctf-paths', label: 'CTF Paths', icon: GitBranch }, // NEW ITEM
    { id: 'lessons', label: 'My Lessons', icon: BookOpen },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const adminItems = [
    { id: 'admin', label: 'Admin Panel', icon: LayoutDashboard },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen sticky top-0 bg-[#09090b]/95 backdrop-blur-xl border-r border-[#27272a] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Ambient glow at the top */}
      <div className="absolute top-0 left-0 w-full h-32 bg-[#84cc16]/5 blur-[50px] pointer-events-none" />

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-[#18181b] border border-[#27272a] rounded-full flex items-center justify-center text-[#71717a] hover:text-[#84cc16] hover:border-[#84cc16]/50 hover:shadow-[0_0_10px_rgba(132,204,22,0.2)] transition-all z-50"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header / Logo Area */}
      <div className={`relative flex items-center h-24 transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-6 justify-start'}`}>
        <div className="flex items-center gap-3 overflow-hidden w-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src={logoImg} 
              alt="CTFLingo" 
              className="h-20 w-auto object-contain shrink-0 drop-shadow-[0_0_10px_rgba(132,204,22,0.2)]" 
            />
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-hide px-3">
        {/* Learn Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-[10px] uppercase tracking-widest text-[#3f3f46] font-bold px-3 mb-2 whitespace-nowrap">
              Mainframe
            </p>
          )}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = current === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative w-full flex items-center rounded-xl transition-all duration-200 ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5 gap-3'
                  } ${
                    isActive 
                      ? 'bg-[#84cc16]/10 text-[#84cc16] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                      : 'text-[#71717a] hover:bg-[#18181b] hover:text-[#f4f4f5]'
                  }`}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#84cc16] rounded-r-full shadow-[0_0_8px_rgba(132,204,22,0.8)]" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-[#84cc16]' : 'text-[#52525b] group-hover:text-[#f4f4f5]'}`} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin Section */}
        {profile?.role === 'admin' && (
          <div>
            {!isCollapsed && (
              <p className="text-[10px] uppercase tracking-widest text-[#3f3f46] font-bold px-3 mb-2 whitespace-nowrap">
                Root Access
              </p>
            )}
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = current === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`group relative w-full flex items-center rounded-xl transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5 gap-3'
                    } ${
                      isActive 
                        ? 'bg-[#f97316]/10 text-[#f97316] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                        : 'text-[#71717a] hover:bg-[#18181b] hover:text-[#f4f4f5]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#f97316] rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                    )}
                    <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-[#f97316]' : 'text-[#52525b] group-hover:text-[#f4f4f5]'}`} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className={`p-3 border-t border-[#27272a]/50 transition-all duration-300`}>
        {profile && (
          <div 
            className={`group relative flex items-center w-full rounded-xl bg-[#18181b]/40 border border-[#27272a] hover:border-[#3f3f46] transition-all duration-300 overflow-hidden ${
              isCollapsed ? 'flex-col p-2 gap-2 justify-center' : 'gap-3 p-2.5 pr-3'
            }`}
            title={isCollapsed ? `${profile.username} (${profile.role})` : undefined}
          >
            {/* Avatar Container */}
            <div className="relative shrink-0">
              <div className={`rounded-full bg-[#050505] border flex items-center justify-center transition-all duration-300 ${
                isCollapsed ? 'w-10 h-10 border-[#84cc16]/50 shadow-[0_0_15px_rgba(132,204,22,0.2)]' : 'w-9 h-9 border-[#84cc16]/30'
              }`}>
                <span className={`font-bold text-[#84cc16] ${isCollapsed ? 'text-base' : 'text-sm'}`}>
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Online Status Dot */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#84cc16] border-2 border-[#18181b] shadow-[0_0_5px_rgba(132,204,22,0.8)]"></div>
              {/* Admin Crown Badge */}
              {profile.role === 'admin' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#09090b] border border-[#27272a] flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-[#f97316]" />
                </div>
              )}
            </div>
            {/* User Info & Logout */}
            {!isCollapsed ? (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate leading-tight">{profile.username}</p>
                  <p className="text-[10px] text-[#52525b] font-mono uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    {profile.role === 'admin' ? 'Root' : 'User'}
                  </p>
                </div>
                {/* Inline Logout Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); signOut(); }} 
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-[#52525b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Collapsed Logout Button */
              <button 
                onClick={signOut} 
                title="Sign Out"
                className="p-1.5 rounded-lg text-[#52525b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all mt-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}