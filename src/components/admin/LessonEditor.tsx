import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, FileText, Terminal, Shield, ListChecks, ExternalLink, ChevronUp, ChevronDown, AlertCircle, CheckCircle2, Table as TableIcon, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Unit, BlockType, ResourceType } from '@/types';

interface LessonEditorProps {
  units: Unit[];
  presetUnitId: string | null;
  lessonId?: string | null;
  onClose: () => void;
}

interface BlockDraft { id: string; block_type: BlockType; title: string; content: string; language: string; }
interface ResourceDraft { id: string; title: string; url: string; resource_type: ResourceType; estimated_minutes: number; }

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof FileText; color: string }[] = [
  { type: 'text', label: 'Text', icon: FileText, color: '#a1a1aa' },
  { type: 'code', label: 'Code', icon: Terminal, color: '#84cc16' },
  { type: 'security_focus', label: 'Security', icon: Shield, color: '#f97316' },
  { type: 'key_points', label: 'Points', icon: ListChecks, color: '#60a5fa' },
  { type: 'resource', label: 'Resource', icon: ExternalLink, color: '#a78bfa' },
  { type: 'table', label: 'Table', icon: TableIcon, color: '#84cc16' },
  { type: 'image', label: 'Image', icon: ImageIcon, color: '#84cc16' },
];

export function LessonEditor({ units, presetUnitId, lessonId, onClose }: LessonEditorProps) {
  const [unitId, setUnitId] = useState(presetUnitId ?? units[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [duration, setDuration] = useState(20);
  const [order, setOrder] = useState(0);
  const [blocks, setBlocks] = useState<BlockDraft[]>([]);
  const [resources, setResources] = useState<ResourceDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!!lessonId);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    supabase.from('lessons').select('*, blocks:lesson_content_blocks(*), resources:lesson_resources(*)').eq('id', lessonId).maybeSingle().then(({ data }) => {
      if (data) {
        setUnitId(data.unit_id); setTitle(data.title); setSummary(data.summary); setDuration(data.duration_minutes); setOrder(data.lesson_order);
        const sortedBlocks = (data.blocks ?? []).sort((a: any, b: any) => a.block_order - b.block_order);
        setBlocks(sortedBlocks.map((b: any) => ({ id: crypto.randomUUID(), block_type: b.block_type, title: b.title ?? '', content: b.content, language: b.language ?? '' })));
        setResources((data.resources ?? []).map((r: any) => ({ id: crypto.randomUUID(), title: r.title, url: r.url, resource_type: r.resource_type, estimated_minutes: r.estimated_minutes })));
      }
      setLoading(false);
    });
  }, [lessonId]);

  const addBlock = (type: BlockType) => setBlocks([...blocks, { id: crypto.randomUUID(), block_type: type, title: '', content: '', language: type === 'code' ? 'bash' : '' }]);
  const updateBlock = (id: string, field: keyof BlockDraft, value: string) => setBlocks(blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  const removeBlock = (id: string) => setBlocks(blocks.filter((b) => b.id !== id));
  const moveBlock = (idx: number, dir: -1 | 1) => { const newIdx = idx + dir; if (newIdx < 0 || newIdx >= blocks.length) return; const copy = [...blocks]; [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]; setBlocks(copy); };
  
  const addResource = () => setResources([...resources, { id: crypto.randomUUID(), title: '', url: '', resource_type: 'article', estimated_minutes: 10 }]);
  const updateResource = (id: string, field: keyof ResourceDraft, value: string | number) => setResources(resources.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const removeResource = (id: string) => setResources(resources.filter((r) => r.id !== id));

  const save = async () => {
    setSaving(true); setSaveError(null);
    const payload = { unit_id: unitId, title, summary, duration_minutes: duration, lesson_order: order };
    let lessonUuid: string;

    if (lessonId) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', lessonId);
      if (error) { setSaveError(error.message); setSaving(false); return; }
      lessonUuid = lessonId;
      await supabase.from('lesson_content_blocks').delete().eq('lesson_id', lessonUuid);
      await supabase.from('lesson_resources').delete().eq('lesson_id', lessonUuid);
    } else {
      const { data: lesson, error } = await supabase.from('lessons').insert(payload).select().single();
      if (error || !lesson) { setSaveError(error?.message ?? 'Failed'); setSaving(false); return; }
      lessonUuid = lesson.id;
    }

    if (blocks.length > 0) {
      const { error } = await supabase.from('lesson_content_blocks').insert(blocks.map((b, i) => ({ lesson_id: lessonUuid, block_order: i, block_type: b.block_type, title: b.title || null, content: b.content, language: b.language || null })));
      if (error) setSaveError('Blocks failed: ' + error.message);
    }
    if (resources.length > 0) {
      const { error } = await supabase.from('lesson_resources').insert(resources.map((r) => ({ lesson_id: lessonUuid, title: r.title, url: r.url, resource_type: r.resource_type, estimated_minutes: r.estimated_minutes })));
      if (error && !saveError) setSaveError('Resources failed: ' + error.message);
    }
    setSaved(true); setSaving(false); setTimeout(onClose, 800);
  };

  const inputClass = "w-full px-4 py-3 bg-[#050505] border border-[#27272a] rounded-xl text-sm text-white placeholder-[#3f3f46] focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] focus:outline-none transition-all shadow-inner";

  if (loading) return <div className="min-h-full bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#60a5fa]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        <button onClick={onClose} className="group flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#84cc16] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Admin
        </button>

        <div className="mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
            <FileText className="w-3.5 h-3.5 text-[#60a5fa]" />
            <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Module Configuration</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">{lessonId ? 'Edit Module' : 'Create Module'}</h1>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 shadow-xl relative overflow-hidden animate-fade-in-up delay-100 space-y-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#60a5fa]/30 to-transparent"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Parent Unit</label>
                <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputClass}>
                  {units.map((u) => (<option key={u.id} value={u.id}>{u.thumbnail_emoji} {u.title}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Duration (mins)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Module Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Understanding XSS" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Summary</label>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief overview" rows={2} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Order (0 = first)</label>
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className={inputClass} />
            </div>
          </div>

          {/* Content Blocks */}
          <div className="animate-fade-in-up delay-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Terminal className="w-5 h-5 text-[#84cc16]" /> Content Blocks</h2>
              <div className="flex flex-wrap gap-2 bg-[#09090b] p-1.5 rounded-xl border border-[#27272a]">
                {BLOCK_TYPES.map((bt) => {
                  const Icon = bt.icon;
                  return (
                    <button key={bt.type} onClick={() => addBlock(bt.type)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#71717a] hover:bg-[#18181b] hover:text-white flex items-center gap-1.5 transition-colors border border-transparent hover:border-[#27272a]">
                      <Icon className="w-3.5 h-3.5" style={{ color: bt.color }} /> {bt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {blocks.map((block, idx) => {
                const bt = BLOCK_TYPES.find((t) => t.type === block.block_type)!;
                const Icon = bt.icon;
                return (
                  <div key={block.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: bt.color }}></div>
                    <div className="flex items-center justify-between mb-4 pl-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: bt.color }} />
                        <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">{bt.label} #{idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveBlock(idx, -1)} className="p-1.5 text-[#52525b] hover:text-white rounded hover:bg-[#18181b]"><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => moveBlock(idx, 1)} className="p-1.5 text-[#52525b] hover:text-white rounded hover:bg-[#18181b]"><ChevronDown className="w-4 h-4" /></button>
                        <button onClick={() => removeBlock(block.id)} className="p-1.5 text-[#52525b] hover:text-[#ef4444] rounded hover:bg-[#ef4444]/10"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="space-y-3 pl-3">
                      {block.block_type !== 'code' && block.block_type !== 'key_points' && (
                        <input value={block.title} onChange={(e) => updateBlock(block.id, 'title', e.target.value)} placeholder={block.block_type === 'image' ? 'Image caption (optional)' : 'Block title (optional)'} className={inputClass} />
                      )}
                      {block.block_type === 'code' && (
                        <input value={block.language} onChange={(e) => updateBlock(block.id, 'language', e.target.value)} placeholder="Language (e.g. python, bash)" className={`${inputClass} font-mono`} />
                      )}
                      {block.block_type === 'image' ? (
                        <input value={block.content} onChange={(e) => updateBlock(block.id, 'content', e.target.value)} placeholder="Paste image URL here (https://...)" className={`${inputClass} font-mono`} />
                      ) : (
                        <textarea value={block.content} onChange={(e) => updateBlock(block.id, 'content', e.target.value)} placeholder={block.block_type === 'code' ? 'Paste code...' : block.block_type === 'key_points' ? 'One point per line' : block.block_type === 'table' ? 'Name | Type\nXSS | Web' : 'Write content...'} rows={block.block_type === 'code' ? 6 : 4} className={`${inputClass} resize-none ${block.block_type === 'code' ? 'font-mono' : ''}`} />
                      )}
                    </div>
                  </div>
                );
              })}
              {blocks.length === 0 && (<div className="bg-[#09090b] border border-dashed border-[#27272a] rounded-xl p-12 text-center text-sm text-[#52525b] font-mono">NO_BLOCKS_DETECTED</div>)}
            </div>
          </div>

          {/* Resources */}
          <div className="animate-fade-in-up delay-300">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><ExternalLink className="w-5 h-5 text-[#a78bfa]" /> External Resources</h2>
              <button onClick={addResource} className="px-4 py-2 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] text-xs font-bold rounded-lg hover:bg-[#27272a] hover:text-white transition-colors flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> ADD INTEL</button>
            </div>
            <div className="space-y-3">
              {resources.map((res) => (
                <div key={res.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center">
                  <input value={res.title} onChange={(e) => updateResource(res.id, 'title', e.target.value)} placeholder="Title" className={`${inputClass} flex-1`} />
                  <input value={res.url} onChange={(e) => updateResource(res.id, 'url', e.target.value)} placeholder="https://" className={`${inputClass} flex-1 font-mono`} />
                  <select value={res.resource_type} onChange={(e) => updateResource(res.id, 'resource_type', e.target.value)} className={`${inputClass} w-full sm:w-32`}>
                    <option value="article">Article</option><option value="video">Video</option><option value="docs">Docs</option><option value="tool">Tool</option>
                  </select>
                  <button onClick={() => removeResource(res.id)} className="p-3 text-[#52525b] hover:text-[#ef4444] rounded-lg hover:bg-[#ef4444]/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {saveError && (<div className="flex items-center gap-2 text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-lg animate-fade-in-up"><AlertCircle className="w-4 h-4 shrink-0" />{saveError}</div>)}
          {saved && (<div className="flex items-center gap-2 text-sm text-[#84cc16] bg-[#84cc16]/10 border border-[#84cc16]/20 p-3 rounded-lg animate-fade-in-up"><CheckCircle2 className="w-4 h-4 shrink-0" />Module saved successfully!</div>)}
          
          <button onClick={save} disabled={saving || !title || !unitId || saved} className="w-full py-4 mt-4 bg-[#84cc16] text-[#050505] font-bold rounded-xl hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg animate-fade-in-up delay-300">
            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saving ? 'Processing...' : saved ? 'Deployed!' : lessonId ? 'Update Module' : 'Deploy Module'}
          </button>
        </div>
      </div>
    </div>
  );
}