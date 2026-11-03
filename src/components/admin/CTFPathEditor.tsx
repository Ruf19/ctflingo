import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, CheckCircle2, Terminal, FolderOpen, GitBranch, MapPin, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CTFPath, CTFPathCategory, Difficulty, Challenge, CTFPathNode } from '@/types';

interface CTFPathEditorProps {
  path: CTFPath | null;
  categories: CTFPathCategory[];
  allChallenges: Challenge[];
  onClose: () => void;
  onRefresh: () => void;
}

interface NodeDraft {
  id: string; // temp id or db id
  challenge_id: string;
  node_order: number;
  position_x: number;
  position_y: number;
  challenge?: Challenge;
}

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export function CTFPathEditor({ path, categories, allChallenges, onClose, onRefresh }: CTFPathEditorProps) {
  // --- Path State ---
  const [title, setTitle] = useState(path?.title ?? '');
  const [description, setDescription] = useState(path?.description ?? '');
  const [categoryId, setCategoryId] = useState(path?.category_id ?? categories[0]?.id ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(path?.difficulty ?? 'beginner');
  const [emoji, setEmoji] = useState(path?.thumbnail_emoji ?? '🎯');
  const [published, setPublished] = useState(path?.published ?? false);
  
  // --- Nodes State ---
  const [nodes, setNodes] = useState<NodeDraft[]>(
    path?.nodes?.map(n => ({ ...n, challenge: allChallenges.find(c => c.id === n.challenge_id) })) ?? []
  );
  
  // --- Category Management State ---
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📁');
  const [localCategories, setLocalCategories] = useState<CTFPathCategory[]>(categories);

  // --- General State ---
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!!path);

  useEffect(() => {
    if (path) {
      // If editing, ensure we have challenge data for nodes
      const enrichedNodes = path.nodes?.map(n => ({
        ...n,
        challenge: allChallenges.find(c => c.id === n.challenge_id)
      })) ?? [];
      setNodes(enrichedNodes);
    }
  }, [path, allChallenges]);

  // --- Category Handlers ---
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const { data, error } = await supabase.from('ctf_path_categories').insert({
      name: newCatName,
      icon_emoji: newCatEmoji,
      display_order: localCategories.length
    }).select().single();
    
    if (!error && data) {
      setLocalCategories([...localCategories, data as CTFPathCategory]);
      setCategoryId(data.id);
      setNewCatName('');
      onRefresh(); // Refresh parent list
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Paths using it will need to be reassigned.')) return;
    const { error } = await supabase.from('ctf_path_categories').delete().eq('id', id);
    if (!error) {
      setLocalCategories(localCategories.filter(c => c.id !== id));
      if (categoryId === id) setCategoryId(localCategories[0]?.id ?? '');
      onRefresh();
    }
  };

  // --- Node Handlers ---
  const addNode = () => {
    const newNode: NodeDraft = {
      id: crypto.randomUUID(),
      challenge_id: allChallenges[0]?.id ?? '',
      node_order: nodes.length,
      position_x: 100 + (nodes.length * 150), // Auto-layout simple horizontal
      position_y: 300,
      challenge: allChallenges[0]
    };
    setNodes([...nodes, newNode]);
  };

  const updateNode = (id: string, field: keyof NodeDraft, value: any) => {
    setNodes(nodes.map(n => {
      if (n.id === id) {
        const updated = { ...n, [field]: value };
        if (field === 'challenge_id') {
          updated.challenge = allChallenges.find(c => c.id === value);
        }
        return updated;
      }
      return n;
    }));
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id).map((n, i) => ({ ...n, node_order: i })));
  };

  const moveNode = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= nodes.length) return;
    const copy = [...nodes];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    // Update orders
    setNodes(copy.map((n, i) => ({ ...n, node_order: i })));
  };

  // --- Save Handler ---
  const save = async () => {
    setSaving(true);
    setSaveError(null);

    const payload = {
      title,
      description,
      category_id: categoryId,
      difficulty,
      thumbnail_emoji: emoji,
      published
    };

    let pathId = path?.id;

    try {
      // 1. Save Path
      if (pathId) {
        const { error } = await supabase.from('ctf_paths').update(payload).eq('id', pathId);
        if (error) throw error;
        
        // Delete existing nodes to re-insert (simplest way to handle reordering/deletion)
        await supabase.from('ctf_path_nodes').delete().eq('path_id', pathId);
      } else {
        const { data, error } = await supabase.from('ctf_paths').insert(payload).select().single();
        if (error || !data) throw error;
        pathId = data.id;
      }

      // 2. Save Nodes
      if (nodes.length > 0 && pathId) {
        const nodesPayload = nodes.map(n => ({
          path_id: pathId,
          challenge_id: n.challenge_id,
          node_order: n.node_order,
          position_x: n.position_x,
          position_y: n.position_y
        }));
        
        const { error: nodesError } = await supabase.from('ctf_path_nodes').insert(nodesPayload);
        if (nodesError) throw nodesError;
      }

      setSaved(true);
      setTimeout(onClose, 800);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-[#050505] border border-[#27272a] rounded-xl text-sm text-white placeholder-[#3f3f46] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] focus:outline-none transition-all shadow-inner";

  if (loading) return <div className="min-h-full bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#f97316]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-8 py-12">
        <button onClick={onClose} className="group flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#f97316] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Admin
        </button>

        <div className="mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
            <GitBranch className="w-3.5 h-3.5 text-[#f97316]" />
            <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Path Configuration</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">{path ? 'Edit Path' : 'Deploy New Path'}</h1>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 shadow-xl relative overflow-hidden animate-fade-in-up delay-100 space-y-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f97316]/30 to-transparent"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Path Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Web Exploitation 101" className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Category</label>
                <div className="flex gap-2">
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputClass} flex-1`}>
                    {localCategories.map(c => <option key={c.id} value={c.id}>{c.icon_emoji} {c.name}</option>)}
                  </select>
                  <button 
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    className="px-4 py-2 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] rounded-xl hover:bg-[#27272a] hover:text-white transition-colors"
                    title="Manage Categories"
                  >
                    <FolderOpen className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Manager Dropdown */}
            {showCategoryManager && (
              <div className="p-4 bg-[#050505] border border-[#27272a] rounded-xl space-y-4 animate-fade-in-up">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><FolderOpen className="w-4 h-4 text-[#f97316]" /> Manage Categories</h3>
                <div className="flex gap-2">
                  <input value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)} className="w-16 px-2 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-center text-xl" />
                  <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New Category Name" className="flex-1 px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-white" />
                  <button onClick={handleCreateCategory} className="px-4 py-2 bg-[#f97316] text-black font-bold rounded-lg text-sm">Add</button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {localCategories.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-[#09090b] rounded border border-[#27272a]">
                      <span className="text-sm text-[#a1a1aa]">{c.icon_emoji} {c.name}</span>
                      <button onClick={() => handleDeleteCategory(c.id)} className="text-[#52525b] hover:text-[#ef4444]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn in this track?" rows={3} className={`${inputClass} resize-none`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputClass}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Icon Emoji</label>
                <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className={`${inputClass} text-center text-2xl py-1`} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#18181b] border border-[#27272a] rounded-xl w-full hover:border-[#f97316]/50 transition-colors">
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 rounded border-[#3f3f46] text-[#f97316] focus:ring-[#f97316] bg-[#050505]" />
                  <span className="text-sm font-bold text-white">Publish Immediately</span>
                </label>
              </div>
            </div>
          </div>

          {/* Node Arranger */}
          <div className="animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-[#84cc16]" /> Mission Nodes</h2>
              <button onClick={addNode} className="px-4 py-2 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] text-xs font-bold rounded-lg hover:bg-[#27272a] hover:text-white transition-colors flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> ADD NODE
              </button>
            </div>

            <div className="space-y-4">
              {nodes.map((node, idx) => (
                <div key={node.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#84cc16]"></div>
                  
                  {/* Order Controls */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <span className="text-xs font-mono text-[#52525b] font-bold">NODE {String(idx + 1).padStart(2, '0')}</span>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveNode(idx, -1)} className="p-1 text-[#52525b] hover:text-white rounded hover:bg-[#18181b]"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => moveNode(idx, 1)} className="p-1 text-[#52525b] hover:text-white rounded hover:bg-[#18181b]"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Challenge Selector */}
                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <label className="text-[10px] font-mono text-[#52525b] mb-1 block uppercase">Target Challenge</label>
                      <select 
                        value={node.challenge_id} 
                        onChange={(e) => updateNode(node.id, 'challenge_id', e.target.value)}
                        className={inputClass}
                      >
                        {allChallenges.map(c => (
                          <option key={c.id} value={c.id}>{c.title} ({c.difficulty})</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Position Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-[#52525b] mb-1 block uppercase">Pos X</label>
                        <input 
                          type="number" 
                          value={node.position_x} 
                          onChange={(e) => updateNode(node.id, 'position_x', Number(e.target.value))}
                          className={`${inputClass} py-2 font-mono`} 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#52525b] mb-1 block uppercase">Pos Y</label>
                        <input 
                          type="number" 
                          value={node.position_y} 
                          onChange={(e) => updateNode(node.id, 'position_y', Number(e.target.value))}
                          className={`${inputClass} py-2 font-mono`} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={() => removeNode(node.id)} className="p-2 text-[#52525b] hover:text-[#ef4444] rounded-lg hover:bg-[#ef4444]/10 transition-colors self-start">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {nodes.length === 0 && (
                <div className="bg-[#09090b] border border-dashed border-[#27272a] rounded-xl p-12 text-center text-sm text-[#52525b] font-mono">
                  NO_NODES_CONFIGURED
                </div>
              )}
            </div>
          </div>

          {saveError && (<div className="flex items-center gap-2 text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-lg animate-fade-in-up"><AlertCircle className="w-4 h-4 shrink-0" />{saveError}</div>)}
          {saved && (<div className="flex items-center gap-2 text-sm text-[#84cc16] bg-[#84cc16]/10 border border-[#84cc16]/20 p-3 rounded-lg animate-fade-in-up"><CheckCircle2 className="w-4 h-4 shrink-0" />Path deployed successfully!</div>)}

          <button onClick={save} disabled={saving || !title || !categoryId || saved} className="w-full py-4 mt-4 bg-[#f97316] text-[#050505] font-bold rounded-xl hover:bg-[#fb923c] transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg animate-fade-in-up delay-300">
            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saving ? 'Processing...' : saved ? 'Deployed!' : path ? 'Update Path' : 'Deploy Path'}
          </button>
        </div>
      </div>
    </div>
  );
}