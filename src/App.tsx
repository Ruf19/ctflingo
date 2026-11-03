import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Home } from '@/pages/Home';
import { Explore } from '@/pages/Explore';
import { UnitDetail } from '@/pages/UnitDetail';
import { LessonView } from '@/pages/LessonView';
import { ChallengeView } from '@/pages/ChallengeView';
import { AdminPanel } from '@/pages/AdminPanel';
import { MyLessons, MyChallenges } from '@/pages/MyContent';
import { Leaderboard } from '@/pages/Leaderboard';
import { Profile } from '@/pages/Profile';
import { AuthPage } from '@/pages/AuthPage';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Challenge } from '@/types';
import { Landing } from '@/pages/Landing';

// --- NEW CTF PATH IMPORTS ---
import { CTFPaths } from '@/pages/CTFPaths';
import { CTFPathView } from '@/pages/CTFPathView';
import { CTFNodeView } from '@/pages/CTFNodeView';

interface Route {
  page: string;
  params: Record<string, string>;
}

function Shell() {
  const { session, profile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [route, setRoute] = useState<Route>({ page: 'home', params: {} });
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const navigate = (page: string, params: Record<string, string> = {}) => {
    setRoute({ page, params });
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    setRoute({ page: 'home', params: {} });
    setAuthMode(null);
  }, [session?.user.id]);

  // Existing challenge loading logic
  useEffect(() => {
    if (route.page === 'challenge' && route.params.id) {
      supabase
        .from('challenges')
        .select('*, hints:challenge_hints(*), files:challenge_files(*)')
        .eq('id', route.params.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const c = data as Challenge;
            c.hints = (c.hints ?? []).sort((a, b) => a.hint_order - b.hint_order);
            c.files = data.files ?? [];
            setChallenge(c);
          }
        });
    }
  }, [route.page, route.params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !profile) {
    return authMode ? (
      <AuthPage initialMode={authMode} onBack={() => setAuthMode(null)} />
    ) : (
      <Landing onSignUp={() => setAuthMode('signup')} onLogin={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0e14]">
      <Sidebar current={route.page} onNavigate={navigate} />
      <main className="flex-1 min-w-0">
        {route.page === 'home' && <Home onNavigate={navigate} />}
        {route.page === 'explore' && <Explore onNavigate={navigate} />}
        
        {/* --- NEW CTF PATH ROUTES --- */}
        {route.page === 'ctf-paths' && <CTFPaths onNavigate={navigate} />}
        {route.page === 'ctf-path' && (
          <CTFPathView 
            pathId={route.params.id} 
            onNavigate={navigate} 
            onBack={() => navigate('ctf-paths')} 
          />
        )}
        {route.page === 'ctf-node' && (
          <CTFNodeView 
            pathId={route.params.pathId}
            nodeId={route.params.nodeId}
            challengeId={route.params.challengeId}
            onNavigate={navigate} 
            onBack={() => navigate('ctf-path', { id: route.params.pathId })} 
          />
        )}
        {/* -------------------------- */}

        {route.page === 'unit' && (
          <UnitDetail unitId={route.params.id} onNavigate={navigate} onBack={() => navigate('explore')} />
        )}
        {route.page === 'lesson' && (
          <LessonView
            lessonId={route.params.id}
            unitId={route.params.unitId}
            onNavigate={navigate}
            onBack={() => navigate('unit', { id: route.params.unitId ?? '' })}
          />
        )}
        {route.page === 'challenge' && (
          <ChallengeView
            challenge={challenge ?? undefined}
            onBack={() => navigate('unit', { id: route.params.unitId ?? '' })}
          />
        )}
        {route.page === 'lessons' && <MyLessons onNavigate={navigate} />}
        {route.page === 'challenges' && <MyChallenges onNavigate={navigate} />}
        {route.page === 'leaderboard' && <Leaderboard />}
        {route.page === 'profile' && <Profile />}
        {route.page === 'admin' && profile.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

export default App;