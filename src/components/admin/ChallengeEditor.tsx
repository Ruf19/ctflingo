import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, AlertCircle, CheckCircle2, Upload, File as FileIcon, Download, Terminal, Flag, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Unit, Difficulty, ChallengeType, ChallengeFile } from '@/types';

interface ChallengeEditorProps {
  units: Unit[];
  presetUnitId: string | null;
  challengeId?: string | null;
  onClose: () => void;
  onChallengeCreated?: (id: string) => void;
}

interface HintDraft { id: string; content: string; dbId?: string; }

const CHALLENGE_TYPES: { type: ChallengeType; label: string }[] = [
  { type: 'quiz', label: 'Quiz' }, { type: 'static_file', label: 'Static File' }, { type: 'pcap', label: 'PCAP Analysis' },
  { type: 'log_analysis', label: 'Log Analysis' }, { type: 'docker_lab', label: 'Docker Lab' }, { type: 'api_lab', label: 'API Lab' },
  { type: 'code_review', label: 'Code Review' }, { type: 'forensics', label: 'Forensics' }, { type: 'crypto', label: 'Cryptography' },
  { type: 'web_exploit', label: 'Web Exploit' }, { type: 'reverse', label: 'Reverse Eng' }, { type: 'osint', label: 'OSINT' },
];

export function ChallengeEditor({ units, presetUnitId, challengeId, onClose, onChallengeCreated }: ChallengeEditorProps) {
  const [unitId, setUnitId] = useState(presetUnitId ?? units[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [challengeType, setChallengeType] = useState<ChallengeType>('quiz');
  const [flag, setFlag] = useState('');
  const [xpReward, setXpReward] = useState(100);
  const [objectives, setObjectives] = useState('');
  const [hints, setHints] = useState<HintDraft[]>([]);
  const [files, setFiles] = useState<ChallengeFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!!challengeId);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(challengeId ?? null);

  useEffect(() => {
    if (!challengeId) return;
    setLoading(true);
    supabase.from('challenges').select('*, hints:challenge_hints(*)').eq('id', challengeId).maybeSingle().then(({ data }) => {
      if (data) {
        setUnitId(data.unit_id); setTitle(data.title); setDescription(data.description); setDifficulty(data.difficulty);
        setChallengeType(data.challenge_type); setFlag(data.flag ?? ''); setXpReward(data.xp_reward); setObjectives((data.objectives ?? []).join('\n'));
        const sortedHints = (data.hints ?? []).sort((a: any, b: any) => a.hint_order - b.hint_order);
        setHints(sortedHints.map((h: any) => ({ id: crypto.randomUUID(), content: h.content, dbId: h.id })));
      }
      setLoading(false);
    });
    supabase.from('challenge_files').select('*').eq('challenge_id', challengeId).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setFiles(data as ChallengeFile[]);
    });
  }, [challengeId]);

  const addHint = () => setHints([...hints, { id: crypto.randomUUID(), content: '' }]);
  const updateHint = (id: string, content: string) => setHints(hints.map((h) => (h.id === id ? { ...h, content } : h)));
  const removeHint = (id: string) => setHints(hints.filter((h) => h.id !== id));
  const moveHint = (idx: number, dir: -1 | 1) => { const newIdx = idx + dir; if (newIdx < 0 || newIdx >= hints.length) return; const copy = [...hints]; [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]; setHints(copy); };

  const uploadFile = async (file: File) => {
    if (!title || !unitId) { setSaveError('Add a title and select a unit first.'); return; }
    setUploading(true); setSaveError(null);
    let chId = activeChallengeId;
    if (!chId) {
      const { data: created, error } = await supabase.from('challenges').insert({ unit_id: unitId, title, description, difficulty, challenge_type: challengeType, flag: flag || null, xp_reward: xpReward, objectives: objectives.split('\n').map(t=>t.trim()).filter(Boolean) }).select().single();
      if (error || !created) { setSaveError('Failed to create challenge: ' + error?.message); setUploading(false); return; }
      chId = created.id; setActiveChallengeId(created.id); onChallengeCreated?.(created.id);
    }
    const ext = file.name.split('.').pop();
    const filePath = `${chId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('challenge-files').upload(filePath, file);
    if (uploadErr) { setSaveError('Upload failed: ' + uploadErr.message); setUploading(false); return; }
    const { data: fileRow, error: dbErr } = await supabase.from('challenge_files').insert({ challenge_id: chId, filename: file.name, file_path: filePath, file_size: file.size, file_type: file.type }).select().single();
    if (dbErr) setSaveError('DB record failed: ' + dbErr.message);
    else if (fileRow) setFiles(prev => [fileRow as ChallengeFile, ...prev]);
    setUploading(false);
  };

  const deleteFile = async (file: ChallengeFile) => {
    await supabase.storage.from('challenge-files').remove([file.file_path]);
    await supabase.from('challenge_files').delete().eq('id', file.id);
    setFiles(prev => prev.filter(f => f.id !== file.id));
  };

  const formatSize = (b: number) => b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB';

  const save = async () => {
    setSaving(true); setSaveError(null);
    const payload = { unit_id: unitId, title, description, difficulty, challenge_type: challengeType, flag: flag || null, xp_reward: xpReward, objectives: objectives.split('\n').map(t=>t.trim()).filter(Boolean) };
    let challengeUuid: string;
    if (activeChallengeId) {
      const { error } = await supabase.from('challenges').update(payload).eq('id', activeChallengeId);
      if (error) { setSaveError(error.message); setSaving(false); return; }
      challengeUuid = activeChallengeId;
      await supabase.from('challenge_hints').delete().eq('challenge_id', challengeUuid);
    } else {
      const { data, error } = await supabase.from('challenges').insert(payload).select().single();
      if (error || !data) { setSaveError(error?.message ?? 'Failed'); setSaving(false); return; }
      challengeUuid = data.id;
    }
    const validHints = hints.filter(h => h.content.trim());
    if (validHints.length > 0) {
      const { error } = await supabase.from('challenge_hints').insert(validHints.map((h, i) => ({ challenge_id: challengeUuid, hint_order: i, content: h.content })));
      if (error) setSaveError('Hints failed: ' + error.message);
    }
    setSaved(true); setSaving(false); setTimeout(onClose, 800);
  };

  const inputClass = "w-full px-4 py-3 bg-[#050505] border border-[#27272a] rounded-xl text-sm text-white placeholder-[#3f3f46] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] focus:outline-none transition-all shadow-inner";

  if (loading) return <div className="min-h-full bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" /></div>;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#f97316]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        <button onClick={onClose} className="group flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#f97316] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Admin
        </button>

        <div className="mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
            <Flag className="w-3.5 h-3.5 text-[#f97316]" />
            <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Target Configuration</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">{activeChallengeId ? 'Edit Target' : 'Deploy New Target'}</h1>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 shadow-xl relative overflow-hidden animate-fade-in-up delay-100 space-y-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f97316]/30 to-transparent"></div>
            
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Parent Unit</label>
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputClass}>
                {units.map(u => <option key={u.id} value={u.id}>{u.thumbnail_emoji} {u.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Target Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Find the Hidden Flag" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is the challenge about?" rows={3} className={`${inputClass} resize-none`} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputClass}>
                  <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Type</label>
                <select value={challengeType} onChange={(e) => setChallengeType(e.target.value as ChallengeType)} className={inputClass}>
                  {CHALLENGE_TYPES.map(ct => <option key={ct.type} value={ct.type}>{ct.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Flag (Answer)</label>
                <input value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="Lingo{...}" className={`${inputClass} font-mono text-[#84cc16]`} />
              </div>
              <div>
                <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">XP Reward</label>
                <div className="relative">
                  <input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} className={`${inputClass} pl-10 font-mono text-[#facc15]`} />
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#facc15] fill-current" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Objectives (one per line)</label>
              <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Identify the vulnerability" rows={3} className={`${inputClass} resize-none`} />
            </div>
          </div>

          {/* Hints */}
          <div className="animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Terminal className="w-5 h-5 text-[#facc15]" /> Hints / Intel</h2>
              <button onClick={addHint} className="px-4 py-2 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] text-xs font-bold rounded-lg hover:bg-[#27272a] hover:text-white transition-colors flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> ADD HINT</button>
            </div>
            <div className="space-y-3">
              {hints.map((hint, idx) => (
                <div key={hint.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-4 flex gap-4 items-start group">
                  <span className="text-xs font-mono text-[#52525b] mt-3 font-bold">{String(idx+1).padStart(2,'0')}</span>
                  <textarea value={hint.content} onChange={(e) => updateHint(hint.id, e.target.value)} placeholder="Hint text..." rows={2} className={`${inputClass} flex-1 resize-none`} />
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveHint(idx, -1)} className="p-1.5 text-[#52525b] hover:text-white rounded hover:bg-[#18181b]"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveHint(idx, 1)} className="p-1.5 text-[#52525b] hover:text-white rounded hover:bg-[#18181b]"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeHint(hint.id)} className="p-1.5 text-[#52525b] hover:text-[#ef4444] rounded hover:bg-[#ef4444]/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {hints.length === 0 && <div className="bg-[#09090b] border border-dashed border-[#27272a] rounded-xl p-8 text-center text-sm text-[#52525b] font-mono">NO_HINTS_CONFIGURED</div>}
            </div>
          </div>

          {/* Files */}
          <div className="animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileIcon className="w-5 h-5 text-[#60a5fa]" /> Secure Assets</h2>
              <label className="px-4 py-2 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] text-xs font-bold rounded-lg hover:bg-[#27272a] hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> UPLOAD FILE
                <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) uploadFile(f); e.target.value=''; }} />
              </label>
            </div>
            
            {uploading && <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-4 text-sm text-[#a1a1aa] flex items-center gap-3 mb-4 font-mono"><div className="w-4 h-4 border-2 border-[#60a5fa] border-t-transparent rounded-full animate-spin" /> UPLOADING_ASSET...</div>}
            
            <div className="space-y-3">
              {files.map(f => (
                <div key={f.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-4 flex items-center gap-4 group hover:border-[#60a5fa]/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#60a5fa]/10 flex items-center justify-center shrink-0"><FileIcon className="w-5 h-5 text-[#60a5fa]" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{f.filename}</p>
                    <p className="text-xs text-[#52525b] font-mono mt-0.5">{formatSize(f.file_size)} · {f.file_type || 'unknown'}</p>
                  </div>
                  <a href={`${supabaseUrl}/storage/v1/object/public/challenge-files/${f.file_path}`} download={f.filename} className="p-2 text-[#52525b] hover:text-[#60a5fa] rounded-lg hover:bg-[#18181b] transition-colors"><Download className="w-4 h-4" /></a>
                  <button onClick={() => deleteFile(f)} className="p-2 text-[#52525b] hover:text-[#ef4444] rounded-lg hover:bg-[#ef4444]/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {files.length === 0 && !uploading && <div className="bg-[#09090b] border border-dashed border-[#27272a] rounded-xl p-8 text-center text-sm text-[#52525b] font-mono">NO_ASSETS_UPLOADED</div>}
            </div>
          </div>

          {saveError && (<div className="flex items-center gap-2 text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-lg animate-fade-in-up"><AlertCircle className="w-4 h-4 shrink-0" />{saveError}</div>)}
          {saved && (<div className="flex items-center gap-2 text-sm text-[#84cc16] bg-[#84cc16]/10 border border-[#84cc16]/20 p-3 rounded-lg animate-fade-in-up"><CheckCircle2 className="w-4 h-4 shrink-0" />Target deployed successfully!</div>)}
          
          <button onClick={save} disabled={saving || !title || !unitId || saved} className="w-full py-4 mt-4 bg-[#f97316] text-[#050505] font-bold rounded-xl hover:bg-[#fb923c] transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg animate-fade-in-up delay-300">
            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saving ? 'Processing...' : saved ? 'Deployed!' : activeChallengeId ? 'Update Target' : 'Deploy Target'}
          </button>
        </div>
      </div>
    </div>
  );
}