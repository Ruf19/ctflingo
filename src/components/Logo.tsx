import { Terminal } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-xl', sub: 'text-xs' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-lg bg-gradient-to-br from-[#00ff88] to-[#00cc6a] flex items-center justify-center`}>
        <Terminal className={`${s.icon} text-[#0a0e14]`} strokeWidth={2.5} />
      </div>
      <div>
        <h1 className={`${s.text} font-bold text-white tracking-tight`}>CTFLingo</h1>
        <p className={`${s.sub} text-[#4a5a6e] font-mono`}>learn.hack.repeat</p>
      </div>
    </div>
  );
}
