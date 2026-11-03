import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Plus, BookOpen, Trophy, FileText, Eye, Edit3, Trash2,
  CheckCircle2, Flag, Search, Users, Crown, Shield, Terminal, Zap, ChevronDown, GitBranch
} from 'lucide-react';
import { useAllUnitsAdmin, useAllLessonsAdmin, useAllChallengesAdmin } from '@/hooks/useData';
import { useAllCTFPathsAdmin, useCTFCategories } from '@/hooks/useCTFData';
import { UnitEditor } from '@/components/admin/UnitEditor';
import { LessonEditor } from '@/components/admin/LessonEditor';
import { ChallengeEditor } from '@/components/admin/ChallengeEditor';
import { CTFPathEditor } from '@/components/admin/CTFPathEditor';
import { supabase } from '@/lib/supabase';
import type { Unit, Profile, CTFPath } from '@/types';

type Tab = 'overview' | 'users' | 'units' | 'lessons' | 'challenges' | 'ctf-paths';

interface UserWithStats extends Profile {
  email: string;
  total_xp: number;
  solved_count: number;
  rank: number;
}

export function AdminPanel() {
  const { units, loading, refresh } = useAllUnitsAdmin();
  const { lessons: allLessons, loading: lessonsLoading, refresh: refreshLessons } = useAllLessonsAdmin();
  const { challenges: allChallenges, loading: challengesLoading, refresh: refreshChallenges } = useAllChallengesAdmin();
  
  // --- CTF PATHS HOOKS ---
  const { paths: allPaths, loading: pathsLoading, refresh: refreshPaths } = useAllCTFPathsAdmin();
  const { categories, refresh: refreshCategories } = useCTFCategories();

  const [tab, setTab] = useState<Tab>('overview');
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showUnitEditor, setShowUnitEditor] = useState(false);
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [showChallengeEditor, setShowChallengeEditor] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  
  // --- CTF PATHS STATE ---
  const [editingPath, setEditingPath] = useState<CTFPath | null>(null);
  const [showPathEditor, setShowPathEditor] = useState(false);

  // User Management State
  const [allUsers, setAllUsers] = useState<UserWithStats[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
      if (profError) throw profError;

      const { data: solved, error: solvedError } = await supabase.from('solved_challenges').select('user_id, xp_awarded');
      if (solvedError) throw solvedError;

      const statsMap = new Map<string, { xp: number; solved: number }>();
      (solved || []).forEach(row => {
        const current = statsMap.get(row.user_id) || { xp: 0, solved: 0 };
        current.xp += row.xp_awarded || 0;
        current.solved += 1;
        statsMap.set(row.user_id, current);
      });

      // REMOVED THE supabase.auth.admin.listUsers() BLOCK THAT CAUSED 401 ERRORS

      const combined: UserWithStats[] = (profiles || []).map(p => {
        const stats = statsMap.get(p.username) || { xp: 0, solved: 0 };
        const statsById = statsMap.get(p.id) || { xp: 0, solved: 0 };
        return {
          ...p,
          email: 'protected@hidden.net', // Hardcoded fallback
          total_xp: Math.max(stats.xp, statsById.xp),
          solved_count: Math.max(stats.solved, statsById.solved),
          rank: 0
        };
      });

      combined.sort((a, b) => b.total_xp - a.total_xp);
      combined.forEach((u, i) => u.rank = i + 1);
      setAllUsers(combined);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'overview' || tab === 'users') {
      fetchUsers();
    }
  }, [tab]);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) fetchUsers();
    else alert("Failed to update role: " + error.message);
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [allUsers, userSearch]);

  // --- Handlers ---
  const togglePublish = async (unit: Unit) => {
    await supabase.from('units').update({ published: !unit.published }).eq('id', unit.id);
    refresh();
  };

  const deleteUnit = async (id: string) => {
    if (!confirm('Delete this unit and all its lessons and challenges?')) return;
    await supabase.from('units').delete().eq('id', id);
    refresh(); refreshLessons(); refreshChallenges();
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    await supabase.from('lessons').delete().eq('id', id);
    refreshLessons();
  };

  const deleteChallenge = async (id: string) => {
    if (!confirm('Delete this challenge?')) return;
    await supabase.from('challenges').delete().eq('id', id);
    refreshChallenges();
  };

  // --- CTF PATH HANDLERS ---
  const togglePathPublish = async (path: CTFPath) => {
    await supabase.from('ctf_paths').update({ published: !path.published }).eq('id', path.id);
    refreshPaths();
  };

  const deletePath = async (id: string) => {
    if (!confirm('Delete this CTF path and all progress?')) return;
    await supabase.from('ctf_paths').delete().eq('id', id);
    refreshPaths();
  };

  // --- Editor Modals ---
  if (showUnitEditor) return <UnitEditor unit={editingUnit} onClose={() => { setShowUnitEditor(false); setEditingUnit(null); refresh(); }} />;
  if (showLessonEditor) return <LessonEditor units={units} presetUnitId={selectedUnitId} lessonId={editingLessonId} onClose={() => { setShowLessonEditor(false); setEditingLessonId(null); refresh(); refreshLessons(); }} />;
  if (showChallengeEditor) return <ChallengeEditor units={units} presetUnitId={selectedUnitId} challengeId={editingChallengeId} onChallengeCreated={(id) => setEditingChallengeId(id)} onClose={() => { setShowChallengeEditor(false); setEditingChallengeId(null); refresh(); refreshChallenges(); }} />;
  
  // --- CTF PATH EDITOR MODAL ---
  if (showPathEditor) return (
    <CTFPathEditor 
      path={editingPath} 
      categories={categories} 
      allChallenges={allChallenges} 
      onClose={() => { setShowPathEditor(false); setEditingPath(null); refreshPaths(); refreshCategories(); }} 
      onRefresh={() => { refreshPaths(); refreshCategories(); }} 
    />
  );

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Operators', icon: Users },
    { id: 'units', label: 'Units', icon: BookOpen },
    { id: 'lessons', label: 'Lessons', icon: FileText },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'ctf-paths', label: 'CTF Paths', icon: GitBranch },
  ];

  const UserTable = ({ limit }: { limit?: number }) => (
    <div className="bg-[#09090b] border border-[#27272a] rounded-2xl overflow-hidden animate-fade-in-up">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#18181b]/50 border-b border-[#27272a]">
              <th className="px-6 py-4 text-xs font-mono font-bold text-[#52525b] uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-xs font-mono font-bold text-[#52525b] uppercase tracking-wider">Operator</th>
              <th className="px-6 py-4 text-xs font-mono font-bold text-[#52525b] uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="px-6 py-4 text-xs font-mono font-bold text-[#52525b] uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-mono font-bold text-[#52525b] uppercase tracking-wider text-right">XP</th>
              <th className="px-6 py-4 text-xs font-mono font-bold text-[#52525b] uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]/50">
            {usersLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-[#52525b] font-mono animate-pulse">SCANNING_DATABASE...</td></tr>
            ) : (limit ? filteredUsers.slice(0, limit) : filteredUsers).length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-[#52525b] font-mono">NO_OPERATORS_FOUND</td></tr>
            ) : (
              (limit ? filteredUsers.slice(0, limit) : filteredUsers).map((user) => (
                <tr key={user.id} className="hover:bg-[#18181b]/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={`font-mono font-bold text-sm ${user.rank <= 3 ? 'text-[#facc15]' : 'text-[#52525b]'}`}>#{String(user.rank).padStart(2, '0')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center text-xs font-bold text-[#84cc16]">{user.username.charAt(0).toUpperCase()}</div>
                      <span className="font-bold text-white text-sm">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell"><span className="text-xs text-[#71717a] font-mono">{user.email}</span></td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded font-mono font-bold uppercase tracking-wider border inline-flex items-center gap-1 ${user.role === 'admin' ? 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30' : 'bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/30'}`}>
                      {user.role === 'admin' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />} {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-sm font-mono font-bold text-[#facc15]"><Zap className="w-3 h-3 fill-current" /> {user.total_xp}</div>
                    <p className="text-[10px] text-[#52525b] font-mono mt-0.5">{user.solved_count} solved</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleRole(user.id, user.role)} className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-white hover:border-[#84cc16]/50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title={`Promote/Demote`}>
                      <Shield className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#f97316]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#84cc16]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
              <Terminal className="w-3.5 h-3.5 text-[#f97316]" />
              <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Root Control Panel</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-[#71717a] text-lg">Manage operators, deploy units, and configure challenges.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8 border-b border-[#27272a] overflow-x-auto scrollbar-hide animate-fade-in-up delay-100">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all duration-300 whitespace-nowrap ${
                  tab === t.id ? 'border-[#84cc16] text-[#84cc16] bg-[#84cc16]/5' : 'border-transparent text-[#71717a] hover:text-white hover:bg-[#18181b]/50'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-10 animate-fade-in-up delay-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Units', value: units.length, icon: BookOpen, color: 'text-[#84cc16]', bg: 'bg-[#84cc16]/10', border: 'border-[#84cc16]/20' },
                { label: 'Published', value: units.filter((u) => u.published).length, icon: CheckCircle2, color: 'text-[#60a5fa]', bg: 'bg-[#60a5fa]/10', border: 'border-[#60a5fa]/20' },
                { label: 'CTF Paths', value: allPaths.length, icon: GitBranch, color: 'text-[#f97316]', bg: 'bg-[#f97316]/10', border: 'border-[#f97316]/20' },
                { label: 'Operators', value: allUsers.length, icon: Users, color: 'text-[#facc15]', bg: 'bg-[#facc15]/10', border: 'border-[#facc15]/20' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`bg-[#09090b]/80 backdrop-blur-sm border ${s.border} rounded-2xl p-6 flex flex-col justify-between h-32 transition-all duration-300 hover:-translate-y-1`}>
                    <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><Icon className={`w-5 h-5 ${s.color}`} /></div>
                    <div>
                      <p className="text-2xl font-black text-white tracking-tight">{loading || usersLoading || pathsLoading ? '—' : s.value}</p>
                      <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Crown className="w-5 h-5 text-[#facc15]" /> Top Operators</h2>
                <button onClick={() => setTab('users')} className="text-sm text-[#71717a] hover:text-[#84cc16] transition-colors flex items-center gap-1 font-mono uppercase tracking-wider">View All <ChevronDown className="w-4 h-4 rotate-[-90deg]" /></button>
              </div>
              <UserTable limit={5} />
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-6 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between gap-4 bg-[#09090b] border border-[#27272a] rounded-xl p-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
                <input type="text" placeholder="Search operators..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-transparent border-none text-sm text-white placeholder-[#52525b] focus:ring-0 focus:outline-none" />
              </div>
              <div className="text-xs font-mono text-[#52525b] uppercase tracking-wider px-2">{filteredUsers.length} Records Found</div>
            </div>
            <UserTable />
          </div>
        )}

        {/* UNITS TAB */}
        {tab === 'units' && (
          <div className="animate-fade-in-up delay-200">
            <button onClick={() => { setEditingUnit(null); setShowUnitEditor(true); }} className="mb-6 px-6 py-3 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] flex items-center gap-2">
              <Plus className="w-5 h-5" /> Deploy New Unit
            </button>
            {loading ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-2xl h-40 animate-pulse" />
            ) : units.length === 0 ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-16 text-center"><BookOpen className="w-12 h-12 text-[#27272a] mx-auto mb-4" /><p className="text-[#71717a] font-medium">No units deployed yet.</p></div>
            ) : (
              <div className="space-y-4">
                {units.map((unit) => (
                  <div key={unit.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 flex items-center gap-5 hover:border-[#84cc16]/30 transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-2xl shrink-0 group-hover:border-[#84cc16]/30 transition-colors">{unit.thumbnail_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white truncate">{unit.title}</h3>
                        {unit.published ? <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">Live</span> : <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20">Draft</span>}
                      </div>
                      <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider flex items-center gap-2"><span>{unit.difficulty}</span> • <span>{unit.category}</span> • <span>{unit.estimated_hours}h</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePublish(unit)} className="p-2.5 text-[#52525b] hover:text-[#84cc16] rounded-lg hover:bg-[#18181b] transition-all" title={unit.published ? 'Unpublish' : 'Publish'}>{unit.published ? <Eye className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}</button>
                      <button onClick={() => { setEditingUnit(unit); setShowUnitEditor(true); }} className="p-2.5 text-[#52525b] hover:text-[#60a5fa] rounded-lg hover:bg-[#18181b] transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteUnit(unit.id)} className="p-2.5 text-[#52525b] hover:text-[#ef4444] rounded-lg hover:bg-[#18181b] transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LESSONS TAB */}
        {tab === 'lessons' && (
          <div className="animate-fade-in-up delay-200">
            <button onClick={() => { setSelectedUnitId(null); setEditingLessonId(null); setShowLessonEditor(true); }} className="mb-6 px-6 py-3 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create Module
            </button>
            {lessonsLoading ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-2xl h-40 animate-pulse" />
            ) : allLessons.length === 0 ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-16 text-center"><FileText className="w-12 h-12 text-[#27272a] mx-auto mb-4" /><p className="text-[#71717a] font-medium">No modules created yet.</p></div>
            ) : (
              <div className="space-y-3">
                {allLessons.map((lesson) => (
                  <div key={lesson.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 flex items-center gap-5 hover:border-[#60a5fa]/30 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center shrink-0 group-hover:border-[#60a5fa]/30 transition-colors"><FileText className="w-5 h-5 text-[#60a5fa]" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate mb-1">{lesson.title}</h3>
                      <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider flex items-center gap-2"><span>{lesson.unit_title}</span> • <span>{lesson.duration_minutes}m</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingLessonId(lesson.id); setSelectedUnitId(null); setShowLessonEditor(true); }} className="p-2.5 text-[#52525b] hover:text-[#60a5fa] rounded-lg hover:bg-[#18181b] transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteLesson(lesson.id)} className="p-2.5 text-[#52525b] hover:text-[#ef4444] rounded-lg hover:bg-[#18181b] transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHALLENGES TAB */}
        {tab === 'challenges' && (
          <div className="animate-fade-in-up delay-200">
            <button onClick={() => { setSelectedUnitId(null); setEditingChallengeId(null); setShowChallengeEditor(true); }} className="mb-6 px-6 py-3 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] flex items-center gap-2">
              <Plus className="w-5 h-5" /> Deploy Target
            </button>
            {challengesLoading ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-2xl h-40 animate-pulse" />
            ) : allChallenges.length === 0 ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-16 text-center"><Trophy className="w-12 h-12 text-[#27272a] mx-auto mb-4" /><p className="text-[#71717a] font-medium">No targets deployed yet.</p></div>
            ) : (
              <div className="space-y-3">
                {allChallenges.map((ch) => (
                  <div key={ch.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 flex items-center gap-5 hover:border-[#f97316]/30 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center shrink-0 group-hover:border-[#f97316]/30 transition-colors"><Trophy className="w-5 h-5 text-[#f97316]" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white truncate">{ch.title}</h3>
                        {ch.flag && <Flag className="w-3 h-3 text-[#84cc16]" />}
                      </div>
                      <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider flex items-center gap-2"><span>{ch.unit_title}</span> • <span>{ch.difficulty}</span> • <span className="text-[#facc15]">{ch.xp_reward} XP</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingChallengeId(ch.id); setSelectedUnitId(null); setShowChallengeEditor(true); }} className="p-2.5 text-[#52525b] hover:text-[#60a5fa] rounded-lg hover:bg-[#18181b] transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteChallenge(ch.id)} className="p-2.5 text-[#52525b] hover:text-[#ef4444] rounded-lg hover:bg-[#18181b] transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTF PATHS TAB */}
        {tab === 'ctf-paths' && (
          <div className="animate-fade-in-up delay-200">
            <button onClick={() => { setEditingPath(null); setShowPathEditor(true); }} className="mb-6 px-6 py-3 bg-[#f97316] text-[#050505] font-bold rounded-lg hover:bg-[#fb923c] transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center gap-2">
              <Plus className="w-5 h-5" /> Deploy New Path
            </button>
            {pathsLoading ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-2xl h-40 animate-pulse" />
            ) : allPaths.length === 0 ? (
              <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-16 text-center"><GitBranch className="w-12 h-12 text-[#27272a] mx-auto mb-4" /><p className="text-[#71717a] font-medium">No CTF paths deployed yet.</p></div>
            ) : (
              <div className="space-y-4">
                {allPaths.map((path) => (
                  <div key={path.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 flex items-center gap-5 hover:border-[#f97316]/30 transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-2xl shrink-0 group-hover:border-[#f97316]/30 transition-colors">{path.thumbnail_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white truncate">{path.title}</h3>
                        {path.published ? <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">Live</span> : <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20">Draft</span>}
                      </div>
                      <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider flex items-center gap-2">
                        <span>{path.category?.name ?? 'Uncategorized'}</span> • <span>{path.difficulty}</span> • <span>{path.nodes?.length ?? 0} NODES</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePathPublish(path)} className="p-2.5 text-[#52525b] hover:text-[#84cc16] rounded-lg hover:bg-[#18181b] transition-all" title={path.published ? 'Unpublish' : 'Publish'}>{path.published ? <Eye className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}</button>
                      <button onClick={() => { setEditingPath(path); setShowPathEditor(true); }} className="p-2.5 text-[#52525b] hover:text-[#60a5fa] rounded-lg hover:bg-[#18181b] transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deletePath(path.id)} className="p-2.5 text-[#52525b] hover:text-[#ef4444] rounded-lg hover:bg-[#18181b] transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}