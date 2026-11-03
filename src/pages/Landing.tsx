import { useEffect, useState } from 'react';
import { Activity, ArrowRight, BarChart3, BookOpen, Flag, Target, Terminal, Trophy, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { HackerBackground } from '@/components/HackerBackground';
import logoImg from '@/assets/logoImg.png';
import heroVideo from '@/assets/flag.webm';

interface LandingProps {
  onSignUp: () => void;
  onLogin: () => void;
}

interface Stats {
  units: number;
  lessons: number;
  challenges: number;
  xp_available: number;
}

export function Landing({ onSignUp, onLogin }: LandingProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    supabase.rpc('get_public_stats').then(({ data }) => {
      if (data) setStats(data as Stats);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f5] overflow-x-hidden selection:bg-[#84cc16] selection:text-black font-sans">
      <HackerBackground />
      
      {/* Top nav */}
      <header className="absolute top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between max-w-7xl mx-auto animate-fade-in-up">
        <div className="flex items-center gap-3 group cursor-pointer">
          <img 
            src={logoImg} 
            alt="CTFLingo" 
            className="h-12 md:h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(132,204,22,0.4)] group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onLogin} className="text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors">
            Log In
          </button>
          <button onClick={onSignUp} className="px-5 py-2 bg-[#84cc16] text-[#050505] text-sm font-bold rounded-md hover:bg-[#a3e635] transition-colors shadow-[0_0_15px_rgba(132,204,22,0.3)]">
            Sign Up
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-32 overflow-hidden">
        
        {/* Background Grid & Glows */}
        <div className="absolute inset-0 cyber-grid pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#84cc16]/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Decorative side text */}
        <div className="absolute top-32 right-8 text-[10px] font-mono text-[#84cc16]/30 text-right leading-relaxed hidden lg:block select-none pointer-events-none">
          CORE_TEMP 38C<br/>SEC_SHELL_EST<br/>PACKET_FILTER_ACTIVE<br/>CORE_TEMP 38C<br/>SEC_SHELL_EST
        </div>
        <div className="absolute bottom-32 left-8 text-[10px] font-mono text-[#84cc16]/30 leading-relaxed hidden lg:block select-none pointer-events-none">
          ACORE_TEMP 38C<br/>SEC_SHELL_EST<br/>PACKET_FILTER_ACTIVE
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">
          
          {/* Hero Video Screen - BIGGER & TIGHTER HUD */}
          <div className="mb-16 animate-fade-in-up relative inline-block group">
            {/* The Video - Made bigger */}
            <video 
              src={heroVideo} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="block w-80 md:w-[500px] h-auto object-contain drop-shadow-[0_0_40px_rgba(132,204,22,0.2)]"
            />
            
            {/* Floating HUD Corner Accents - Very close to the video edges */}
            
          </div>

          {/* Badge - Lifted up (more space above due to mb-16 on video) */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18181b]/80 border border-[#27272a] mb-8 animate-fade-in-up delay-100 backdrop-blur-sm">
            <Activity className="w-3.5 h-3.5 text-[#84cc16]" />
            <span className="text-xs font-medium text-[#d4d4d8] tracking-wide font-mono uppercase">Live CTF Learning Platform</span>
          </div>
          
          {/* HUD Framed Headline - NEW FONT APPLIED HERE */}
          <div className="hud-frame mb-8 animate-fade-in-up delay-100">
            <h1 className="font-cyber text-5xl md:text-7xl font-bold text-white tracking-wide uppercase leading-[1.1]">
              Hack the planet.<br />
              <span className="text-[#84cc16] drop-shadow-[0_0_15px_rgba(132,204,22,0.5)]">Learn by doing.</span>
            </h1>
          </div>
          
          <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200">
            Structured lessons, hands-on labs, and CTF-style challenges. Master cybersecurity from web exploitation to forensics. Capture flags, earn XP, and climb the ranks.
          </p>
          
          {/* Buttons */}
          <div className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300 mb-[-60px]">
            <button
              onClick={onSignUp}
              className="px-8 py-3.5 bg-[#18181b]/90 border border-[#84cc16]/50 text-white font-semibold rounded-md backdrop-blur-md hover:bg-[#84cc16] hover:text-[#050505] hover:border-[#84cc16] transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] group"
            >
              Start Hacking Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-3.5 bg-[#18181b]/90 border border-[#27272a] text-white font-semibold rounded-md backdrop-blur-md hover:bg-[#27272a] transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            >
              Log In
            </button>
          </div>

          {/* Mock Terminal Windows (Left and Right) */}
          <div className="relative w-full max-w-4xl h-48 mt-24 perspective-1000 animate-fade-in-up delay-300 pointer-events-none hidden md:block">
            
            {/* Left Terminal (Nmap scan) */}
            <div className="terminal-mock absolute left-0 bottom-0 w-72 h-40 transform -rotate-2 translate-y-10 opacity-80 hover:opacity-100 hover:-translate-y-8 transition-all duration-500">
              <div className="terminal-header">
                <div className="terminal-dot"></div><div className="terminal-dot"></div><div className="terminal-dot"></div>
              </div>
              <div className="p-3 text-[10px] text-[#84cc16]/80 leading-relaxed overflow-hidden h-full font-mono">
                <p>$ nmap scan 1333.168.8.8</p>
                <p className="text-[#71717a]">neepc cerzio 33.00%</p>
                <p className="text-[#71717a]">Nmap adie:13825858-8665...</p>
                <p className="mt-2 text-white">KEY-WORD  STATE SERVICE</p>
                <p>http      OPEN  PORTS</p>
                <p>ssh       OPEN  GCON</p>
                <p>ftp       OPEN  OPEN</p>
                <p className="mt-2 text-[#71717a]">Nmap action progress ...</p>
              </div>
            </div>

            {/* Right Terminal (Disassembler) */}
            <div className="terminal-mock absolute right-0 bottom-0 w-72 h-40 transform rotate-2 translate-y-10 opacity-80 hover:opacity-100 hover:-translate-y-8 transition-all duration-500">
              <div className="terminal-header">
                <div className="terminal-dot"></div><div className="terminal-dot"></div><div className="terminal-dot"></div>
              </div>
              <div className="p-3 text-[10px] text-[#a1a1aa] leading-relaxed overflow-hidden h-full font-mono">
                <p className="text-white mb-1">: Olcassambler:</p>
                <p><span className="text-[#71717a]">0000000037520</span> sado rox</p>
                <p><span className="text-[#71717a]">0000000037530</span> add rox</p>
                <p><span className="text-[#71717a]">0000000037540</span> ldi rdx, [0x23888]</p>
                <p><span className="text-[#71717a]">0000000037550</span> mov rcx</p>
                <p><span className="text-[#71717a]">0000000037560</span> mov rox</p>
                <p><span className="text-[#71717a]">0000000037570</span> mov rox</p>
                <p className="text-[#84cc16]"><span className="text-[#71717a]">0000000037580</span> call rax, [0x20008]</p>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="relative z-20 px-8 py-20 bg-[#050505] border-t border-[#18181b]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { label: 'Learning Units', value: stats?.units, icon: BookOpen, color: 'text-[#84cc16]', bg: 'bg-[#84cc16]/10' },
            { label: 'Lessons', value: stats?.lessons, icon: BookOpen, color: 'text-[#f4f4f5]', bg: 'bg-white/5' },
            { label: 'CTF Challenges', value: stats?.challenges, icon: Trophy, color: 'text-[#f97316]', bg: 'bg-[#f97316]/10' },
            { label: 'XP Available', value: stats?.xp_available, icon: Zap, color: 'text-[#facc15]', bg: 'bg-[#facc15]/10' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`bg-[#0a0a0a] rounded-xl p-6 text-center border border-[#18181b] hover:border-[#84cc16]/30 transition-colors duration-300 animate-fade-in-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <p className="text-3xl font-black text-white mb-1 tracking-tight font-cyber">{stats ? s.value : '—'}</p>
                <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-24 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-cyber text-3xl md:text-4xl font-bold text-white mb-4 tracking-wide uppercase">Level up your skills</h2>
            <p className="text-[#71717a] max-w-2xl mx-auto">Everything you need to go from beginner to elite hacker, all in one place.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: 'Structured Lessons', desc: 'Bite-size lessons with code examples, security focus sections and curated resources.', color: '#f4f4f5', bg: 'rgba(255,255,255,0.03)' },
              { icon: Flag, title: 'Capture The Flag', desc: 'Apply your knowledge in real-world scenarios across web, forensics, crypto, and OSINT.', color: '#f97316', bg: 'rgba(249, 115, 22, 0.05)' },
              { icon: BarChart3, title: 'XP & Leaderboard', desc: 'Earn XP for every flag, unlock gated advanced units, and compete globally.', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.05)' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-[#0a0a0a] border border-[#18181b] rounded-xl p-8 hover:border-[#84cc16]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ background: f.bg }}>
                    <Icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-cyber tracking-wide uppercase">{f.title}</h3>
                  <p className="text-[#71717a] leading-relaxed text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 py-24 bg-[#080808] border-y border-[#18181b]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-cyber text-3xl font-bold text-white text-center mb-16 tracking-wide uppercase animate-fade-in-up">The Path to Root</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            
            <div className="hidden md:block absolute top-6 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[#27272a] to-transparent"></div>

            {[
              { step: '01', icon: BookOpen, title: 'Read & Learn', desc: 'Consume structured content designed by security professionals.', color: '#f4f4f5' },
              { step: '02', icon: Target, title: 'Hack & Practice', desc: 'Jump into isolated labs and CTF challenges to test your skills.', color: '#84cc16' },
              { step: '03', icon: Trophy, title: 'Capture & Rank', desc: 'Submit flags, earn massive XP, and climb the global leaderboard.', color: '#f97316' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.2}s` }}>
                  <div className="w-12 h-12 rounded-full bg-[#050505] border border-[#27272a] flex items-center justify-center mb-6 z-10 relative group hover:border-[#84cc16] transition-colors duration-300">
                    <Icon className="w-5 h-5 transition-colors duration-300" style={{ color: step.color }} />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#050505] border border-[#27272a] flex items-center justify-center text-[10px] font-mono font-bold text-[#52525b] group-hover:text-[#84cc16] group-hover:border-[#84cc16] transition-colors">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 font-cyber tracking-wide uppercase">{step.title}</h3>
                  <p className="text-[#71717a] text-sm max-w-[200px]">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-8 py-32 text-center relative overflow-hidden bg-[#050505]">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#84cc16]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 animate-fade-in-up">
          <h2 className="font-cyber text-4xl md:text-5xl font-bold text-white mb-6 tracking-wide uppercase">Ready to capture your first flag?</h2>
          <p className="text-[#71717a] text-lg mb-10 max-w-xl mx-auto">Join learners mastering cybersecurity through hands-on practice. It's free, forever.</p>
          <button
            onClick={onSignUp}
            className="px-8 py-3.5 bg-[#84cc16] text-[#050505] text-lg font-bold rounded-md hover:bg-[#a3e635] transition-colors shadow-[0_0_20px_rgba(132,204,22,0.3)] inline-flex items-center gap-2 font-cyber tracking-wide uppercase"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="px-8 py-8 border-t border-[#18181b] text-center bg-[#050505]">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
           <Terminal className="w-4 h-4 text-[#84cc16]" />
           <span className="font-bold text-white tracking-tight text-sm font-cyber uppercase">CTFLingo</span>
        </div>
        <p className="text-xs text-[#3f3f46] font-mono">learn.hack.repeat // © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}