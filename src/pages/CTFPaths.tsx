import { useState } from 'react';
import { Search, Trophy, Lock, Zap, CheckCircle2, Terminal, ChevronRight, Filter, Route, GitBranch, FolderOpen } from 'lucide-react';
import { useCTFPaths, useCTFPathProgress, useCTFCategories } from '@/hooks/useCTFData';
import { useUserXp } from '@/hooks/useData'; // Reusing existing hook for XP
import type { CTFPath, Difficulty, CTFPathCategory } from '@/types';

interface CTFPathsProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const DIFFICULTIES: (Difficulty | 'all')[] = ['all', 'beginner', 'intermediate', 'advanced', 'expert'];

export function CTFPaths({ onNavigate }: CTFPathsProps) {
  const { paths, loading } = useCTFPaths();
  const { categories } = useCTFCategories();
  const { progressMap } = useCTFPathProgress();
  const { xp } = useUserXp();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');

  // Filter paths based on search and difficulty
  const filteredPaths = paths.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.category?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  // Group filtered paths by their category_id
  // We iterate over 'categories' to maintain the admin-defined display_order
  const groupedPaths = categories.map(category => ({
    category,
    paths: filteredPaths.filter(p => p.category_id === category.id)
  })).filter(group => group.paths.length > 0); // Hide empty categories

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#84cc16]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#f97316]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        {/* Header & XP Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
              <GitBranch className="w-3.5 h-3.5 text-[#84cc16]" />
              <span className="text-xs font-medium text-[#a1a1aa] font-mono">GUIDED_PATHS</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">CTF Paths</h1>
            <p className="text-[#71717a] text-lg">Follow curated challenge tracks and master specific skills.</p>
          </div>
          
          {/* Sleek XP Card */}
          <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#84cc16]/20 rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_30px_rgba(132,204,22,0.05)] min-w-[280px]">
            <div className="w-12 h-12 rounded-xl bg-[#84cc16]/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-[#84cc16] fill-[#84cc16]/20" />
            </div>
            <div>
              <p className="text-2xl font-black text-white tracking-tight leading-none mb-1">{xp} <span className="text-sm font-medium text-[#84cc16]">XP</span></p>
              <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider">Total Earned</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10 animate-fade-in-up delay-100">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b] group-focus-within:text-[#84cc16] transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search paths, categories, topics..."
              className="w-full pl-12 pr-4 py-3.5 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-white placeholder-[#52525b] focus:border-[#84cc16]/50 focus:ring-1 focus:ring-[#84cc16]/50 focus:outline-none transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 bg-[#09090b] border border-[#27272a] rounded-xl p-1.5 overflow-x-auto scrollbar-hide">
            <Filter className="w-4 h-4 text-[#52525b] ml-2 shrink-0" />
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                  filter === d
                    ? 'bg-[#27272a] text-[#84cc16] shadow-sm'
                    : 'text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#18181b]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#09090b] border border-[#27272a] rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : groupedPaths.length === 0 ? (
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-20 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-[#18181b] flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-[#3f3f46]" />
            </div>
            <p className="text-[#f4f4f5] font-medium text-lg mb-2">No paths found</p>
            <p className="text-[#52525b] text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedPaths.map((group, catIndex) => (
              <div key={group.category.id} className="animate-fade-in-up" style={{ animationDelay: `${catIndex * 0.1}s` }}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center text-lg border border-[#f97316]/20">
                    {group.category.icon_emoji}
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{group.category.name}</h2>
                  <span className="text-xs text-[#52525b] font-mono bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">
                    {group.paths.length} PATH{group.paths.length !== 1 ? 'S' : ''}
                  </span>
                  {group.category.description && (
                    <span className="text-xs text-[#71717a] italic hidden md:inline">— {group.category.description}</span>
                  )}
                </div>

                {/* Paths Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {group.paths.map((path, i) => (
                    <CTFPathCard
                      key={path.id}
                      path={path}
                      progress={progressMap.get(path.id)}
                      onClick={() => onNavigate('ctf-path', { id: path.id })}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CTFPathCard({
  path,
  progress,
  onClick,
  index
}: {
  path: CTFPath;
  progress: any;
  onClick: () => void;
  index: number;
}) {
  const totalNodes = path.nodes?.length ?? 0;
  // If completed, count is total. Otherwise, it's the current node order (which represents completed count in 0-indexed logic usually, 
  // but let's assume current_node_order is the *next* to do, so completed = current_node_order)
  const completedNodes = progress?.completed ? totalNodes : (progress?.current_node_order ?? 0);
  const progressPct = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
  const fullyCompleted = progress?.completed === true;
  const started = progress?.started === true; // Assuming hook returns this or we infer from existence

  // Dynamic difficulty colors
  const diffColors: Record<Difficulty, string> = {
    beginner: 'text-[#84cc16] bg-[#84cc16]/10 border-[#84cc16]/20',
    intermediate: 'text-[#facc15] bg-[#facc15]/10 border-[#facc15]/20',
    advanced: 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/20',
    expert: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
  };

  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 0.05}s` }}
      className={`group relative bg-[#09090b] border rounded-2xl p-6 text-left transition-all duration-300 flex flex-col h-full animate-fade-in-up overflow-hidden ${
        fullyCompleted 
          ? 'border-[#84cc16]/30 ring-1 ring-[#84cc16]/20' 
          : 'border-[#27272a] hover:border-[#84cc16]/50 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(132,204,22,0.15)]'
      }`}
    >
      {/* Hover Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#84cc16]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#84cc16]/10 transition-all duration-500 pointer-events-none" />
      
      {/* Top Row: Badges & Meta */}
      <div className="relative z-10 flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 border transition-colors bg-[#18181b]/50 border-[#27272a] group-hover:border-[#84cc16]/30">
            {path.thumbnail_emoji}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block w-fit border ${diffColors[path.difficulty]}`}>
              {path.difficulty}
            </span>
            <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider">{path.category?.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {fullyCompleted ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#84cc16]/10 text-xs text-[#84cc16] border border-[#84cc16]/20 font-bold font-mono">
              <CheckCircle2 className="w-3 h-3" />
              COMPLETED
            </div>
          ) : started ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#60a5fa]/10 text-xs text-[#60a5fa] border border-[#60a5fa]/20 font-bold font-mono">
              <Route className="w-3 h-3" />
              IN PROGRESS
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-[#52525b] font-mono">
              <Trophy className="w-3 h-3" />
              {totalNodes} NODES
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1">
        <h3 className="text-xl font-bold mb-2 transition-colors text-white group-hover:text-[#84cc16]">
          {path.title}
        </h3>
        <p className="text-sm text-[#71717a] line-clamp-2 mb-4 leading-relaxed">
          {path.description}
        </p>
      </div>

      {/* Progress Bar */}
      {started && totalNodes > 0 && !fullyCompleted && (
        <div className="relative z-10 mb-6">
          <div className="flex items-center justify-between text-xs mb-2 font-mono">
            <span className="text-[#52525b] uppercase tracking-wider">Progress</span>
            <span className="text-[#84cc16] font-bold">{completedNodes}/{totalNodes} NODES</span>
          </div>
          <div className="h-1.5 bg-[#18181b] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#84cc16] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(132,204,22,0.5)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-[#27272a]/50 mt-auto">
        <div className="flex items-center gap-4 text-xs text-[#52525b] font-mono">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            {totalNodes} CHALLENGES
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#52525b] group-hover:text-[#84cc16] transition-colors text-xs font-mono font-bold">
          ACCESS <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
}