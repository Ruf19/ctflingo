import { ArrowLeft, Clock, BookOpen, ExternalLink, Shield, Terminal, ListChecks, FileText, Table as TableIcon, Image as ImageIcon, ChevronRight, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lesson, LessonContentBlock, LessonResource } from '@/types';

interface LessonViewProps {
  lessonId: string | undefined;
  unitId: string | undefined;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onBack: () => void;
}

export function LessonView({ lessonId, unitId, onNavigate, onBack }: LessonViewProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    supabase
      .from('lessons')
      .select('*, content_blocks:lesson_content_blocks(*), resources:lesson_resources(*)')
      .eq('id', lessonId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setError(error?.message ?? 'Lesson not found');
        } else {
          const l = data as Lesson;
          l.content_blocks = (l.content_blocks as LessonContentBlock[]).sort(
            (a, b) => a.block_order - b.block_order
          );
          l.resources = (l.resources as LessonResource[]) ?? [];
          setLesson(l);
        }
        setLoading(false);
      });
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#050505] px-8 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-32 bg-[#18181b] rounded animate-pulse" />
          <div className="h-40 bg-[#09090b] border border-[#27272a] rounded-2xl animate-pulse" />
          <div className="h-64 bg-[#09090b] border border-[#27272a] rounded-2xl animate-pulse" />
          <div className="h-32 bg-[#09090b] border border-[#27272a] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-full bg-[#050505] flex items-center justify-center px-8 py-12">
        <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-6">
            <Terminal className="w-8 h-8 text-[#ef4444]" />
          </div>
          <p className="text-[#f4f4f5] font-medium text-lg mb-2">Data Not Found</p>
          <p className="text-[#52525b] text-sm mb-8">{error ?? 'The lesson you are looking for does not exist.'}</p>
          <button 
            onClick={onBack} 
            className="px-6 py-2.5 bg-[#18181b] border border-[#27272a] text-[#f4f4f5] font-medium rounded-lg hover:bg-[#27272a] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Unit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#050505] relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#60a5fa]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#84cc16]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        
        {/* Back Button */}
        <button 
          onClick={onBack} 
          className="group flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#84cc16] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Unit
        </button>

        {/* Lesson Header Card */}
        <div className="bg-[#09090b]/80 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 mb-10 shadow-xl relative overflow-hidden animate-fade-in-up">
          {/* Top Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#60a5fa]/30 to-transparent"></div>
          
          <div className="flex items-center gap-3 text-xs text-[#52525b] mb-4 font-mono uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#60a5fa]" />
              <span>Module</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-[#3f3f46]"></span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{lesson.duration_minutes} MIN EST</span>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">{lesson.title}</h1>
          {lesson.summary && <p className="text-[#a1a1aa] leading-relaxed text-lg">{lesson.summary}</p>}
        </div>

        {/* Content Blocks */}
        <div className="space-y-6 mb-12">
          {lesson.content_blocks?.map((block, i) => (
            <div key={block.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <ContentBlock block={block} />
            </div>
          ))}
        </div>

        {/* Resources */}
        {lesson.resources && lesson.resources.length > 0 && (
          <div className="mb-12 animate-fade-in-up delay-200">
            <h2 className="text-sm font-bold text-[#f4f4f5] mb-6 flex items-center gap-2 font-mono uppercase tracking-wider">
              <ExternalLink className="w-4 h-4 text-[#a78bfa]" />
              External Intelligence
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lesson.resources.map((res) => (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[#09090b] border border-[#27272a] rounded-xl p-5 flex items-center gap-4 hover:border-[#a78bfa]/50 hover:bg-[#18181b]/50 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center shrink-0 group-hover:bg-[#a78bfa]/20 transition-colors">
                    <FileText className="w-5 h-5 text-[#a78bfa]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm mb-1 truncate group-hover:text-[#a78bfa] transition-colors">{res.title}</h3>
                    <p className="text-xs text-[#52525b] font-mono uppercase tracking-wider">
                      {res.resource_type} · {res.estimated_minutes}m
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#3f3f46] group-hover:text-[#a78bfa] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA to challenges */}
        <div className="bg-gradient-to-br from-[#18181b] to-[#09090b] border border-[#27272a] rounded-2xl p-8 text-center relative overflow-hidden animate-fade-in-up delay-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#84cc16]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#84cc16]/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-[#84cc16] fill-[#84cc16]/20" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to test your skills?</h3>
            <p className="text-sm text-[#71717a] mb-6 max-w-md mx-auto">
              You've completed the intel gathering. Now it's time to execute and capture the flag.
            </p>
            <button
              onClick={() => onNavigate('unit', { id: unitId ?? '' })}
              className="px-8 py-3 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_25px_rgba(132,204,22,0.5)] inline-flex items-center gap-2"
            >
              View Challenges <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentBlock({ block }: { block: LessonContentBlock }) {
  
  // CODE BLOCK - Terminal Style
  if (block.block_type === 'code') {
    return (
      <div className="rounded-xl overflow-hidden border border-[#27272a] bg-[#09090b] shadow-lg">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#27272a] bg-[#18181b]/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#facc15]/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#84cc16]/50"></div>
            </div>
            <span className="text-xs font-mono text-[#52525b] ml-2 uppercase tracking-wider">{block.language ?? 'bash'}</span>
          </div>
          <Terminal className="w-3.5 h-3.5 text-[#3f3f46]" />
        </div>
        <pre className="p-5 overflow-x-auto text-sm font-mono text-[#a1a1aa] leading-relaxed">
          <code>{block.content}</code>
        </pre>
      </div>
    );
  }

  // SECURITY FOCUS - Orange Warning Style
  if (block.block_type === 'security_focus') {
    return (
      <div className="rounded-xl p-6 border border-[#f97316]/30 bg-[#f97316]/[0.03] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#f97316]"></div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#f97316]" />
          </div>
          <h3 className="font-bold text-[#f97316] uppercase tracking-wider text-sm">{block.title ?? 'Security Focus'}</h3>
        </div>
        <p className="text-sm text-[#d4d4d8] leading-relaxed whitespace-pre-wrap pl-11">{block.content}</p>
      </div>
    );
  }

  // KEY POINTS - Blue Checklist Style
  if (block.block_type === 'key_points') {
    const points = block.content.split('\n').filter((l) => l.trim());
    return (
      <div className="rounded-xl p-6 border border-[#60a5fa]/30 bg-[#60a5fa]/[0.03]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#60a5fa]/10 flex items-center justify-center">
            <ListChecks className="w-4 h-4 text-[#60a5fa]" />
          </div>
          <h3 className="font-bold text-[#60a5fa] uppercase tracking-wider text-sm">{block.title ?? 'Key Points'}</h3>
        </div>
        <ul className="space-y-3 pl-11">
          {points.map((point, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-[#d4d4d8] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] mt-1.5 shrink-0 shadow-[0_0_5px_rgba(96,165,250,0.5)]"></span>
              <span>{point.replace(/^[-*]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // TABLE - Clean Data Grid
  if (block.block_type === 'table') {
    const rows = block.content.split('\n').filter((r) => r.trim());
    const parsed = rows.map((r) => r.split('|').map((c) => c.trim()));
    if (parsed.length === 0) return null;
    const header = parsed[0];
    const body = parsed.slice(1);
    
    return (
      <div className="rounded-xl border border-[#27272a] bg-[#09090b] overflow-hidden">
        {block.title && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#27272a] bg-[#18181b]/30">
            <TableIcon className="w-4 h-4 text-[#84cc16]" />
            <h3 className="font-bold text-[#84cc16] uppercase tracking-wider text-xs">{block.title}</h3>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#18181b]/50">
                {header.map((cell, i) => (
                  <th key={i} className="text-left py-3 px-5 font-mono font-bold text-[#71717a] uppercase tracking-wider text-xs border-b border-[#27272a]">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]/50">
              {body.map((row, ri) => (
                <tr key={ri} className="hover:bg-[#18181b]/30 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-3 px-5 text-[#d4d4d8] font-mono text-xs">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // IMAGE - Framed Display
  if (block.block_type === 'image') {
    const url = block.content.trim();
    const caption = block.title;
    return (
      <div className="rounded-xl border border-[#27272a] bg-[#09090b] overflow-hidden p-2">
        <img src={url} alt={caption ?? 'Lesson image'} className="w-full rounded-lg object-cover" />
        {caption && (
          <div className="flex items-center gap-2 px-3 py-3">
            <ImageIcon className="w-3.5 h-3.5 text-[#52525b]" />
            <p className="text-xs text-[#71717a] font-mono uppercase tracking-wider">{caption}</p>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT TEXT BLOCK
  const iconMap: Record<string, typeof Shield> = {
    text: FileText,
    resource: ExternalLink,
  };
  const colorMap: Record<string, string> = {
    text: '#a1a1aa',
    resource: '#a78bfa',
  };
  
  const Icon = iconMap[block.block_type] ?? FileText;
  const color = colorMap[block.block_type] ?? '#a1a1aa';

  return (
    <div className="rounded-xl p-6 border border-[#27272a] bg-[#09090b]/50">
      {block.title && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#18181b] flex items-center justify-center">
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">{block.title}</h3>
        </div>
      )}
      <div className={`${block.title ? 'pl-11' : ''} text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap`}>
        {block.content}
      </div>
    </div>
  );
}