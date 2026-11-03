import { useState } from 'react';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Terminal, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Unit, Difficulty } from '@/types';

interface UnitEditorProps {
  unit: Unit | null;
  onClose: () => void;
}

const EMOJIS = ['🔒', '', '🔐', '🛡️', '⚡', '', '💀', '🧬', '📦', '🔑', '', '🐍', '🦠', '', '️'];
const CATEGORIES = ['Web Security', 'Cryptography', 'Reverse Engineering', 'Forensics', 'Network Security', 'Binary Exploitation', 'General'];

export function UnitEditor({ unit, onClose }: UnitEditorProps) {
  const [title, setTitle] = useState(unit?.title ?? '');
  const [description, setDescription] = useState(unit?.description ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(unit?.difficulty ?? 'beginner');
  const [category, setCategory] = useState(unit?.category ?? 'General');
  const [tags, setTags] = useState(unit?.tags.join(', ') ?? '');
  const [estimatedHours, setEstimatedHours] = useState(unit?.estimated_hours ?? 1);
  const [xpRequired, setXpRequired] = useState(unit?.xp_required ?? 0);
  const [prerequisites, setPrerequisites] = useState(unit?.prerequisites.join(', ') ?? '');
  const [objectives, setObjectives] = useState(unit?.objectives.join('\n') ?? '');
  const [emoji, setEmoji] = useState(unit?.thumbnail_emoji ?? '🔒');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    const payload = {
      title, description, difficulty, category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      estimated_hours: estimatedHours, xp_required: xpRequired,
      prerequisites: prerequisites.split(',').map((t) => t.trim()).filter(Boolean),
      objectives: objectives.split('\n').map((t) => t.trim()).filter(Boolean),
      thumbnail_emoji: emoji,
    };

    const { error } = unit
      ? await supabase.from('units').update(payload).eq('id', unit.id)
      : await supabase.from('units').insert({ ...payload, published: false });

    if (error) { setSaveError(error.message); setSaving(false); return; }
    setSaved(true); setSaving(false); setTimeout(onClose, 800);
  };

  const inputClass = "w-full px-4 py-3 bg-[#050505] border border-[#27272a] rounded-xl text-sm text-white placeholder-[#3f3f46] focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] focus:outline-none transition-all shadow-inner";

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#84cc16]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        <button onClick={onClose} className="group flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#84cc16] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Admin
        </button>

        <div className="mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] mb-4">
            <Terminal className="w-3.5 h-3.5 text-[#84cc16]" />
            <span className="text-xs font-medium text-[#a1a1aa] font-mono uppercase tracking-wider">Unit Configuration</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">{unit ? 'Edit Unit' : 'Deploy New Unit'}</h1>
          <p className="text-[#71717a] text-lg">Configure the parameters for this learning path.</p>
        </div>

        <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 shadow-xl relative overflow-hidden animate-fade-in-up delay-100 space-y-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#84cc16]/30 to-transparent"></div>
          
          {/* Emoji Picker */}
          <div>
            <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Thumbnail Icon</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Type emoji" className={`${inputClass} w-full sm:w-32 text-center text-2xl py-2`} />
              <div className="flex flex-wrap gap-2 bg-[#050505] p-2 rounded-xl border border-[#27272a]">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setEmoji(e)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${emoji === e ? 'border-[#84cc16] bg-[#84cc16]/10 scale-110 shadow-[0_0_15px_rgba(132,204,22,0.2)]' : 'border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181b]'}`}>{e}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Unit Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Web Exploitation Fundamentals" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will learners take away from this unit?" rows={3} className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputClass}>
                <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Est. Hours</label>
              <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))} min={1} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">XP Required</label>
              <input type="number" value={xpRequired} onChange={(e) => setXpRequired(Number(e.target.value))} min={0} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Tags (comma-sep)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="XSS, SQLi" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Prerequisites (comma-separated)</label>
            <input value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} placeholder="Basic HTTP, HTML knowledge" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-mono text-[#52525b] mb-2 block uppercase tracking-wider">Learning Objectives (one per line)</label>
            <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Understand common web vulnerabilities" rows={4} className={`${inputClass} resize-none`} />
          </div>

          {saveError && (<div className="flex items-center gap-2 text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-lg"><AlertCircle className="w-4 h-4 shrink-0" />{saveError}</div>)}
          {saved && (<div className="flex items-center gap-2 text-sm text-[#84cc16] bg-[#84cc16]/10 border border-[#84cc16]/20 p-3 rounded-lg"><CheckCircle2 className="w-4 h-4 shrink-0" />Unit configuration saved successfully!</div>)}
          
          <button onClick={save} disabled={saving || !title || saved} className="w-full py-4 mt-4 bg-[#84cc16] text-[#050505] font-bold rounded-xl hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg">
            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saving ? 'Processing...' : saved ? 'Deployed!' : unit ? 'Update Unit' : 'Deploy Unit'}
          </button>
        </div>
      </div>
    </div>
  );
}