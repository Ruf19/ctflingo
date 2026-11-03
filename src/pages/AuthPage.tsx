import { useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, Terminal, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { HackerBackground } from '@/components/HackerBackground';

export function AuthPage({ initialMode = 'login', onBack }: { initialMode?: 'login' | 'signup'; onBack?: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

   const submit = async () => {
    setBusy(true);
    setError(null);
    
    if (mode === 'signup') {
      const name = username.trim();
      if (!name) { 
        setError('Choose a username.'); 
        setBusy(false); 
        return; 
      }
      
      // Check if username exists
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', name).maybeSingle();
      if (existing) { 
        setError('That username is already taken.'); 
        setBusy(false); 
        return; 
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: name } },
      });
      
      if (error) {
        setError(error.message);
      } else if (data.user && !data.session) {
        // This means email confirmation is required and was sent!
        setError('Check your email! We sent a confirmation link to activate your account.');
        // Optional: Clear the form or switch to login mode
        setMode('login');
        setPassword('');
      } else if (data.session) {
        // This means email confirmation is OFF, and they are logged in immediately.
        // The AuthProvider will catch this and redirect them automatically.
      }
      
    } else {
      // LOGIN FLOW
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        // Give a clearer error message if they haven't confirmed their email yet
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before logging in.');
        } else {
          setError('Invalid email or password. Please try again.');
        }
      }
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 relative overflow-hidden selection:bg-[#84cc16] selection:text-black font-sans">
      
      {/* Live Hacker Background */}
      <HackerBackground />

      {/* Back to Landing Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-8 left-8 z-20 flex items-center gap-2 text-sm font-medium text-[#71717a] hover:text-[#84cc16] transition-colors duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Home
        </button>
      )}

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-fade-in-up">
        
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-[#84cc16] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(132,204,22,0.3)]">
            <Terminal className="w-8 h-8 text-[#050505]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">CTFLingo</h1>
          <p className="text-xs font-mono text-[#52525b] mt-1">learn.hack.repeat</p>
        </div>

        {/* Glassmorphism HUD Card */}
        <div className="w-full bg-[#09090b]/80 backdrop-blur-xl border border-[#27272a] rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Subtle top glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#84cc16]/50 to-transparent"></div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 mb-8 p-1 bg-[#18181b] rounded-lg border border-[#27272a]">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`py-2.5 rounded-md text-sm font-bold transition-all duration-300 ${
                  mode === m 
                    ? 'bg-[#27272a] text-[#84cc16] shadow-sm' 
                    : 'text-[#71717a] hover:text-[#a1a1aa]'
                }`}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a1a1aa] ml-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="hack3r"
                  className="w-full px-4 py-3 bg-[#050505] border border-[#27272a] rounded-lg text-sm text-white placeholder-[#3f3f46] focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] focus:outline-none transition-all duration-300"
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a1a1aa] ml-1">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[#050505] border border-[#27272a] rounded-lg text-sm text-white placeholder-[#3f3f46] focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] focus:outline-none transition-all duration-300"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a1a1aa] ml-1">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#050505] border border-[#27272a] rounded-lg text-sm text-white placeholder-[#3f3f46] focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] focus:outline-none transition-all duration-300"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-lg mt-2 animate-fade-in-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={busy || !email || !password || (mode === 'signup' && !username)}
              className="w-full py-3.5 mt-2 bg-[#84cc16] text-[#050505] font-bold rounded-lg hover:bg-[#a3e635] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] group"
            >
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Access Terminal' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>
          </div>
        </div>
        
        <p className="text-xs text-[#3f3f46] mt-8 font-mono">
          Secure connection established // AES-256
        </p>
      </div>
    </div>
  );
}