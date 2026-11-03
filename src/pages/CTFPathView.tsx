import { useState } from 'react';
import { ArrowLeft, Play, CheckCircle2, Lock, Terminal, Trophy, Zap, Route, ChevronRight, Flag } from 'lucide-react';
import { useCTFPath, useCTFPathProgress, useJoinCTFPath, useCTFPathTotalXP } from '@/hooks/useCTFData';
import { useSolvedChallenges } from '@/hooks/useData'; // Reuse existing hook for solved status
import { CTFPathCanvas } from '@/components/CTFPathCanvas';
import type { CTFPathNode } from '@/types';

interface CTFPathViewProps {
  pathId: string | undefined;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onBack: () => void;
}

export function CTFPathView({ pathId, onNavigate, onBack }: CTFPathViewProps) {
  const { path, loading, error } = useCTFPath(pathId);
  const { progressMap, refresh: refreshProgress } = useCTFPathProgress();
  const { joinPath, joining } = useJoinCTFPath();
  const { solvedIds } = useSolvedChallenges();
  
  const progress = pathId ? progressMap.get(pathId) : undefined;
  const totalXP = useCTFPathTotalXP(path?.nodes);
  
  const [joiningError, setJoiningError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-full bg-[#050505] px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-32 bg-[#18181b] rounded animate-pulse" />
          <div className="h-64 bg-[#09090b] border border-[#27272a] rounded-2xl animate-pulse" />
          <div className="h-96 bg-[#09090b] border border-[#27272a] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="min-h-full bg-[#050505] flex items-center justify-center px-8 py-12">
        <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-6">
            <Terminal className="w-8 h-8 text-[#ef4444]" />
          </div>
          <p className="text-[#f4f4f5] font-medium text-lg mb-2">Path Not Found</p>
          <p className="text-[#52525b] text-sm mb-8">The CTF path you are looking for does not exist or has been moved.</p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-[#18181b] border border-[#27272a] text-[#f4f4f5] font-medium rounded-lg hover:bg-[#27272a] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Paths
          </button>
        </div>
      </div>
    );
  }

  const nodes = path.nodes ?? [];
  const isJoined = !!progress;
  const isCompleted = progress?.completed === true;
  
  // Calculate progress stats
  const completedNodesCount = isCompleted 
    ? nodes.length 
    : (progress?.current_node_order ?? 0);
  const progressPct = nodes.length > 0 ? Math.round((completedNodesCount / nodes.length) * 100) : 0;

  const handleJoin = async () => {
    setJoiningError(null);
    const success = await joinPath(path.id);
    if (success) {
      refreshProgress();
    } else {
      setJoiningError("Failed to initialize path. Please try again.");
    }
  };

  const handleNodeClick = (node: CTFPathNode) => {
    // Only allow clicking if joined and node is unlocked (order <= current_node_order)
    // Note: Canvas handles visual locking, but we double check here
    if (!isJoined) return;
    
    const isUnlocked = isCompleted || node.node_order <= (progress?.current_node_order ?? 0);
    if (!isUnlocked) return;

    onNavigate('ctf-node', { 
      pathId: path.id, 
      nodeId: node.id,
      challengeId: node.challenge_id 
    });
  };

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
      
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        {/* Back Button */}
        <button 
          onClick={onBack} 
          className="group flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#84cc16] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Paths
        </button>

        {/* Main Header Card */}
        <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden animate-fade-in-up">
          {/* Top Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#84cc16]/30 to-transparent"></div>
          
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Emoji Icon Box */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 border shadow-inner ${
              isCompleted ? 'bg-[#84cc16]/10 border-[#84cc16]/30' : 'bg-[#18181b]/50 border-[#27272a]'
            }`}>
              {path.thumbnail_emoji}
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider border ${diffColors[path.difficulty]}`}>
                  {path.difficulty}
                </span>
                <span className="text-xs text-[#52525b] font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Route className="w-3 h-3" /> {path.category?.name}
                </span>
                <span className="text-xs text-[#facc15] font-mono flex items-center gap-1.5">
                  <Zap className="w-3 h-3 fill-current" /> {totalXP} XP TOTAL
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">{path.title}</h1>
              <p className="text-[#a1a1aa] leading-relaxed mb-6 max-w-3xl">{path.description}</p>
            </div>
          </div>

          {/* Action Area: Join / Progress */}
          <div className="mt-8 pt-8 border-t border-[#27272a]/50">
            {!isJoined ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#18181b]/30 border border-[#27272a] rounded-xl p-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Ready to start this track?</h3>
                  <p className="text-sm text-[#71717a]">Join this path to track your progress through the challenges.</p>
                </div>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-8 py-3 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_25px_rgba(132,204,22,0.5)] flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {joining ? 'Initializing...' : <><Play className="w-4 h-4 fill-current" /> Join Path</>}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-[#84cc16]/10' : 'bg-[#60a5fa]/10'}`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#84cc16]" /> : <Route className="w-4 h-4 text-[#60a5fa]" />}
                    </div>
                    <span className={`text-sm font-bold font-mono uppercase tracking-wider ${isCompleted ? 'text-[#84cc16]' : 'text-[#60a5fa]'}`}>
                      {isCompleted ? 'Path Completed' : 'Path Active'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#f4f4f5] font-mono">
                    {completedNodesCount}/{nodes.length} NODES <span className="text-[#52525b] font-normal">({progressPct}%)</span>
                  </span>
                </div>
                
                {nodes.length > 0 && (
                  <div className="h-2.5 bg-[#18181b] rounded-full overflow-hidden border border-[#27272a]/50">
                    <div
                      className="h-full bg-[#84cc16] rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(132,204,22,0.6)]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {joiningError && (
              <p className="mt-4 text-sm text-[#ef4444] flex items-center gap-2">
                <Terminal className="w-4 h-4" /> {joiningError}
              </p>
            )}
          </div>
        </div>

        {/* Visual Path Canvas */}
        <div className="mb-12 animate-fade-in-up delay-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
              <Route className="w-4 h-4 text-[#f97316]" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Mission Map</h2>
            <span className="text-xs text-[#52525b] font-mono bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">
              {nodes.length} TARGETS
            </span>
          </div>
          
          {!isJoined ? (
             <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                  <Lock className="w-12 h-12 text-[#27272a] mb-4" />
                  <p className="text-[#71717a] font-medium text-lg">Join the path to unlock the mission map</p>
                </div>
                {/* Blurred preview */}
                <div className="opacity-30 pointer-events-none">
                  <CTFPathCanvas nodes={nodes} progress={undefined} onNodeClick={() => {}} />
                </div>
             </div>
          ) : nodes.length === 0 ? (
            <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-12 text-center">
              <Terminal className="w-12 h-12 text-[#27272a] mx-auto mb-4" />
              <p className="text-[#71717a] font-medium">No challenges configured for this path yet.</p>
            </div>
          ) : (
            <CTFPathCanvas 
              nodes={nodes} 
              progress={progress} 
              onNodeClick={handleNodeClick} 
            />
          )}
        </div>

        {/* Challenge List (Alternative View / Mobile Fallback) */}
        {isJoined && nodes.length > 0 && (
          <div className="animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#84cc16]/10 flex items-center justify-center">
                <Flag className="w-4 h-4 text-[#84cc16]" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Target List</h2>
            </div>
            
            <div className="space-y-3">
              {nodes.map((node, idx) => {
                const challenge = node.challenge;
                if (!challenge) return null;
                
                const isSolved = solvedIds.has(challenge.id);
                const isUnlocked = isCompleted || node.node_order <= (progress?.current_node_order ?? 0);
                const isCurrent = !isCompleted && node.node_order === (progress?.current_node_order ?? 0);
                
                return (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    disabled={!isUnlocked}
                    className={`w-full bg-[#09090b] border rounded-xl p-5 text-left transition-all duration-300 flex items-center gap-5 group ${
                      !isUnlocked 
                        ? 'border-[#27272a] opacity-50 cursor-not-allowed grayscale' 
                        : isSolved
                        ? 'border-[#84cc16]/30 bg-[#84cc16]/[0.02]'
                        : isCurrent
                        ? 'border-[#f97316]/50 bg-[#f97316]/[0.02] shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                        : 'border-[#27272a] hover:border-[#84cc16]/50 hover:bg-[#18181b]/50'
                    }`}
                  >
                    {/* Node Number / Status */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border font-mono font-bold text-sm ${
                      isSolved 
                        ? 'bg-[#84cc16]/10 border-[#84cc16]/30 text-[#84cc16]' 
                        : isCurrent
                        ? 'bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]'
                        : 'bg-[#18181b] border-[#27272a] text-[#52525b]'
                    }`}>
                      {isSolved ? <CheckCircle2 className="w-6 h-6" /> : String(idx + 1).padStart(2, '0')}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold truncate ${isSolved ? 'text-[#a1a1aa]' : 'text-white group-hover:text-[#84cc16] transition-colors'}`}>
                          {challenge.title}
                        </h3>
                        {!isUnlocked && <Lock className="w-3 h-3 text-[#52525b]" />}
                      </div>
                      <p className="text-xs text-[#71717a] line-clamp-1">{challenge.description}</p>
                    </div>
                    
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-[#52525b] font-mono shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#facc15]" />
                        {challenge.xp_reward}
                      </span>
                      {isUnlocked && !isSolved && (
                        <ChevronRight className={`w-5 h-5 ${isCurrent ? 'text-[#f97316]' : 'text-[#3f3f46] group-hover:text-[#84cc16] group-hover:translate-x-1 transition-all'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}