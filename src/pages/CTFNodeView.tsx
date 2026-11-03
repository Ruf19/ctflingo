import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Target, Lightbulb, Flag, CheckCircle2, XCircle, Lock, Zap, Sparkles, File as FileIcon, Download, Terminal, ChevronRight, ShieldAlert, Route, Play } from 'lucide-react';
import { useSolvedChallenges, useUserXp } from '@/hooks/useData';
import { useCTFNodeChallenge, useAdvanceCTFNode, useCTFPath } from '@/hooks/useCTFData';
import type { CTFPathNode } from '@/types';

interface CTFNodeViewProps {
  pathId: string | undefined;
  nodeId: string | undefined;
  challengeId: string | undefined;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onBack: () => void;
}

export function CTFNodeView({ pathId, nodeId, challengeId, onNavigate, onBack }: CTFNodeViewProps) {
  const [flagInput, setFlagInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [pathCompleted, setPathCompleted] = useState(false);
  
  const { challenge, loading } = useCTFNodeChallenge(challengeId);
  const { solvedIds, solveChallenge } = useSolvedChallenges();
  const { refresh: refreshXp } = useUserXp();
  const { advanceNode, advancing } = useAdvanceCTFNode();
  const { path } = useCTFPath(pathId);

  // Find current node and next node
  const currentNode = path?.nodes?.find(n => n.id === nodeId);
  const nextNode = path?.nodes?.find(n => n.node_order === (currentNode?.node_order ?? -1) + 1);

  useEffect(() => {
    setFlagInput('');
    setResult(null);
    setRevealedHints(0);
    setShowPopup(false);
    setPathCompleted(false);
  }, [challengeId]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!challenge || !currentNode) {
    return (
      <div className="min-h-full bg-[#050505] flex items-center justify-center px-8 py-12">
        <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-6">
            <Terminal className="w-8 h-8 text-[#ef4444]" />
          </div>
          <p className="text-[#f4f4f5] font-medium text-lg mb-2">Target Not Found</p>
          <p className="text-[#52525b] text-sm mb-8">The challenge node you are looking for does not exist.</p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-[#18181b] border border-[#27272a] text-[#f4f4f5] font-medium rounded-lg hover:bg-[#27272a] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Path
          </button>
        </div>
      </div>
    );
  }

  const alreadySolved = solvedIds.has(challenge.id);

  const submitFlag = async () => {
    if (alreadySolved) return;
    
    const correct = !challenge.flag
      ? true
      : flagInput.trim().toLowerCase() === challenge.flag.trim().toLowerCase();

    if (correct) {
      await solveChallenge(challenge.id, challenge.xp_reward);
      refreshXp();
      setResult('correct');
      
      // Advance path progress
      const result = await advanceNode(pathId!, currentNode.node_order);
      if (result?.path_completed) {
        setPathCompleted(true);
      }
      
      setShowPopup(true);
    } else {
      setResult('wrong');
    }
  };

  const handleNextNode = () => {
    setShowPopup(false);
    if (nextNode) {
      onNavigate('ctf-node', { 
        pathId: pathId!, 
        nodeId: nextNode.id, 
        challengeId: nextNode.challenge_id 
      });
    } else {
      // Path completed, go back to path view
      onNavigate('ctf-path', { id: pathId! });
    }
  };

  const hints = challenge.hints ?? [];
  const files = challenge.files ?? [];
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

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
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#f97316]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#84cc16]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        {/* Path Progress Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <button 
            onClick={onBack} 
            className="group flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#84cc16] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Path Map
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181b] border border-[#27272a]">
            <Route className="w-3.5 h-3.5 text-[#f97316]" />
            <span className="text-xs font-mono font-bold text-[#a1a1aa]">
              NODE {String(currentNode.node_order + 1).padStart(2, '0')} 
              <span className="text-[#52525b] mx-1">/</span> 
              {String(path?.nodes?.length ?? 0).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden animate-fade-in-up delay-100">
          {/* Top Glow Line */}
          <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${alreadySolved ? 'via-[#84cc16]/50' : 'via-[#f97316]/50'} to-transparent`}></div>
          
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${alreadySolved ? 'bg-[#84cc16]/10 border-[#84cc16]/20' : 'bg-[#f97316]/10 border-[#f97316]/20'}`}>
                {alreadySolved ? <CheckCircle2 className="w-7 h-7 text-[#84cc16]" /> : <Trophy className="w-7 h-7 text-[#f97316]" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${diffColors[challenge.difficulty]}`}>
                    {challenge.difficulty}
                  </span>
                  <span className="text-[10px] text-[#52525b] font-mono uppercase tracking-wider">{challenge.challenge_type.replace('_', ' ')}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{challenge.title}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {alreadySolved && (
                <span className="px-3 py-1.5 rounded-md bg-[#84cc16]/10 text-xs font-bold text-[#84cc16] border border-[#84cc16]/20 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Rooted
                </span>
              )}
              <span className="px-3 py-1.5 rounded-md bg-[#facc15]/10 text-sm font-bold text-[#facc15] border border-[#facc15]/20 flex items-center gap-1.5 font-mono shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                <Zap className="w-4 h-4 fill-current" /> +{challenge.xp_reward} XP
              </span>
            </div>
          </div>
          
          <p className="text-[#a1a1aa] leading-relaxed text-lg pl-[72px]">{challenge.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Objectives & Files */}
          <div className="lg:col-span-1 space-y-6 animate-fade-in-up delay-200">
            {/* Objectives */}
            {challenge.objectives.length > 0 && (
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-xs font-bold text-[#f4f4f5] mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Target className="w-4 h-4 text-[#84cc16]" /> Mission Objectives
                </h3>
                <ul className="space-y-3">
                  {challenge.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#a1a1aa] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] mt-1.5 shrink-0 shadow-[0_0_5px_rgba(132,204,22,0.5)]"></span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-xs font-bold text-[#f4f4f5] mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <FileIcon className="w-4 h-4 text-[#60a5fa]" /> Secure Assets
                </h3>
                <div className="space-y-3">
                  {files.map((f) => (
                    <a
                      key={f.id}
                      href={`${supabaseUrl}/storage/v1/object/public/challenge-files/${f.file_path}`}
                      download={f.filename}
                      className="group flex items-center gap-3 p-3 bg-[#18181b]/50 border border-[#27272a] rounded-lg hover:border-[#60a5fa]/50 hover:bg-[#18181b] transition-all duration-300"
                    >
                      <div className="w-8 h-8 rounded bg-[#60a5fa]/10 flex items-center justify-center shrink-0 group-hover:bg-[#60a5fa]/20 transition-colors">
                        <FileIcon className="w-4 h-4 text-[#60a5fa]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-[#60a5fa] transition-colors">{f.filename}</p>
                        <p className="text-[10px] text-[#52525b] font-mono uppercase tracking-wider mt-0.5">{formatSize(f.file_size)} · {f.file_type || 'unknown'}</p>
                      </div>
                      <Download className="w-4 h-4 text-[#3f3f46] group-hover:text-[#60a5fa] group-hover:translate-y-0.5 transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Hints */}
            {hints.length > 0 && (
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-xs font-bold text-[#f4f4f5] mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-[#facc15]" /> Intel / Hints
                </h3>
                <div className="space-y-3">
                  {hints.map((hint, i) => {
                    const revealed = i < revealedHints;
                    return (
                      <div key={hint.id}>
                        {revealed ? (
                          <div className="p-4 bg-[#facc15]/[0.03] border border-[#facc15]/20 rounded-lg text-sm text-[#d4d4d8] leading-relaxed relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#facc15]"></div>
                            <p className="pl-3">{hint.content}</p>
                          </div>
                        ) : i === revealedHints ? (
                          <button
                            onClick={() => setRevealedHints(i + 1)}
                            className="w-full p-4 border border-dashed border-[#3f3f46] rounded-lg text-sm text-[#71717a] hover:border-[#facc15]/50 hover:text-[#facc15] hover:bg-[#facc15]/[0.02] flex items-center justify-center gap-2 transition-all duration-300 group"
                          >
                            <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            <span className="font-mono uppercase tracking-wider text-xs">Decrypt Hint {i + 1}</span>
                          </button>
                        ) : (
                          <div className="p-4 border border-dashed border-[#27272a] rounded-lg text-sm text-[#3f3f46] flex items-center justify-center gap-2 font-mono uppercase tracking-wider text-xs">
                            <Lock className="w-3.5 h-3.5" /> Encrypted
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Flag Submission Terminal */}
          <div className="lg:col-span-2 animate-fade-in-up delay-300">
            <div className="bg-[#09090b] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl sticky top-8">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#27272a] bg-[#18181b]/50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#facc15]/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#84cc16]/50"></div>
                  </div>
                  <span className="text-xs font-mono text-[#52525b] ml-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3 h-3" /> root@ctflingo:~# submit_flag
                  </span>
                </div>
                {alreadySolved && <ShieldAlert className="w-4 h-4 text-[#84cc16]" />}
              </div>

              {/* Terminal Body */}
              <div className="p-8">
                {alreadySolved ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-[#84cc16]/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(132,204,22,0.2)]">
                      <CheckCircle2 className="w-10 h-10 text-[#84cc16]" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Access Granted</h3>
                    <p className="text-[#71717a] mb-6">You have successfully captured the flag.</p>
                    
                    {!nextNode && !pathCompleted ? (
                       <div className="px-4 py-2 rounded-lg bg-[#84cc16]/10 border border-[#84cc16]/20 flex items-center gap-2 font-mono text-sm font-bold text-[#84cc16] mb-6">
                        <Sparkles className="w-4 h-4" /> PATH COMPLETED
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-lg bg-[#facc15]/10 border border-[#facc15]/20 flex items-center gap-2 font-mono text-sm font-bold text-[#facc15] mb-6">
                        <Zap className="w-4 h-4 fill-current" /> +{challenge.xp_reward} XP SECURED
                      </div>
                    )}

                    <button
                      onClick={() => onNavigate('ctf-path', { id: pathId! })}
                      className="px-6 py-2.5 bg-[#18181b] border border-[#27272a] text-[#f4f4f5] font-medium rounded-lg hover:bg-[#27272a] transition-colors inline-flex items-center gap-2"
                    >
                      <Route className="w-4 h-4" /> Return to Path Map
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-mono text-[#52525b] mb-2 uppercase tracking-wider">Enter Captured Flag</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-[#84cc16] font-mono text-sm">$</span>
                        </div>
                        <input
                          value={flagInput}
                          onChange={(e) => { setFlagInput(e.target.value); setResult(null); }}
                          onKeyDown={(e) => e.key === 'Enter' && submitFlag()}
                          placeholder="flag{...}"
                          className={`w-full pl-8 pr-4 py-4 bg-[#050505] border rounded-xl text-base font-mono text-white placeholder-[#3f3f46] focus:outline-none transition-all shadow-inner
                            ${result === 'wrong' ? 'border-[#ef4444] focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]' : 'border-[#27272a] focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16]'}
                          `}
                          autoFocus
                        />
                      </div>
                      {result === 'wrong' && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-[#ef4444] font-mono animate-fade-in-up">
                          <XCircle className="w-4 h-4" /> Access Denied: Invalid flag signature.
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={submitFlag}
                      disabled={!flagInput.trim() || advancing}
                      className="w-full py-4 bg-[#84cc16] text-[#050505] font-bold rounded-xl hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                    >
                      {advancing ? 'Processing...' : 'Execute Submission'} <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup - Path Aware */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/90 backdrop-blur-md animate-fade-in-up p-4">
          <div className="bg-[#09090b] border border-[#84cc16]/30 rounded-2xl p-10 max-w-md w-full text-center relative overflow-hidden shadow-[0_0_50px_rgba(132,204,22,0.15)]">
            {/* Background Glow */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(132,204,22,0.1)_0%,transparent_50%)] pointer-events-none animate-pulse-glow"></div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(132,204,22,0.3)]">
                {pathCompleted ? <Route className="w-12 h-12 text-[#84cc16]" /> : <Sparkles className="w-12 h-12 text-[#84cc16]" />}
              </div>
              
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                {pathCompleted ? 'PATH MASTERED' : 'TARGET ROOTED'}
              </h2>
              
              <p className="text-[#71717a] mb-8">
                {pathCompleted 
                  ? "Incredible work. You have completed every challenge in this track."
                  : "Excellent work. You have successfully bypassed the security controls."}
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-8 px-4 py-3 rounded-xl bg-[#facc15]/10 border border-[#facc15]/20">
                <Zap className="w-5 h-5 text-[#facc15] fill-current" />
                <span className="text-[#facc15] font-bold font-mono text-lg">+{challenge.xp_reward} XP ACQUIRED</span>
              </div>
              
              {pathCompleted ? (
                <button
                  onClick={() => { setShowPopup(false); onNavigate('ctf-path', { id: pathId! }); }}
                  className="w-full py-3.5 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2"
                >
                  View Path Summary <ChevronRight className="w-4 h-4" />
                </button>
              ) : nextNode ? (
                <button
                  onClick={handleNextNode}
                  className="w-full py-3.5 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2"
                >
                  Next Target: {nextNode.challenge?.title} <Play className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => { setShowPopup(false); onNavigate('ctf-path', { id: pathId! }); }}
                  className="w-full py-3.5 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2"
                >
                  Return to Map <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}