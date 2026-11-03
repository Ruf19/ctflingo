import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Unit, Lesson, Challenge } from '@/types';

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('units')
      .select('*, lessons:lessons(id, title, summary, duration_minutes, lesson_order), challenges:challenges(id, title, difficulty, xp_reward, challenge_type, objectives)')
      .eq('published', true)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setUnits((data as Unit[]) ?? []);
        setLoading(false);
      });
  }, []);

  return { units, loading, error };
}

export function useUnit(id: string | undefined) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      supabase.from('units').select('*').eq('id', id).maybeSingle(),
      supabase.from('lessons').select('*, content_blocks:lesson_content_blocks(*), resources:lesson_resources(*)').eq('unit_id', id).order('lesson_order', { ascending: true }),
      supabase.from('challenges').select('*, hints:challenge_hints(*)').eq('unit_id', id).order('created_at', { ascending: true }),
    ]).then(([unitRes, lessonsRes, challengesRes]) => {
      if (unitRes.error || !unitRes.data) {
        setError(unitRes.error?.message ?? 'Unit not found');
        setLoading(false);
        return;
      }
      const u = unitRes.data as Unit;
      u.lessons = (lessonsRes.data as Lesson[]) ?? [];
      u.challenges = (challengesRes.data as Challenge[]) ?? [];
      setUnit(u);
      setLoading(false);
    });
  }, [id]);

  return { unit, loading, error };
}

export function useAllLessonsAdmin() {
  const [lessons, setLessons] = useState<(Lesson & { unit_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    supabase.from('lessons').select('*, unit:units(title)').order('created_at', { ascending: false }).then(({ data }) => {
      const rows = (data ?? []) as (Lesson & { unit: { title: string } | null })[];
      setLessons(rows.map((r) => ({ ...r, unit_title: r.unit?.title ?? 'Unknown' })));
      setLoading(false);
    });
  };

  useEffect(() => { refresh(); }, []);
  return { lessons, loading, refresh };
}

export function useAllChallengesAdmin() {
  const [challenges, setChallenges] = useState<(Challenge & { unit_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    supabase.from('challenges').select('*, unit:units(title)').order('created_at', { ascending: false }).then(({ data }) => {
      const rows = (data ?? []) as (Challenge & { unit: { title: string } | null })[];
      setChallenges(rows.map((r) => ({ ...r, unit_title: r.unit?.title ?? 'Unknown' })));
      setLoading(false);
    });
  };

  useEffect(() => { refresh(); }, []);
  return { challenges, loading, refresh };
}

export function useAllUnitsAdmin() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    supabase.from('units').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUnits((data as Unit[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { refresh(); }, []);
  return { units, loading, refresh };
}

export function useUserXp() {
  const { profile } = useAuth();
  const username = profile?.username;
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    if (!username) return;
    supabase.from('solved_challenges').select('xp_awarded').eq('user_id', username).then(({ data }) => {
      setXp((data ?? []).reduce((sum, r) => sum + (r.xp_awarded ?? 0), 0));
      setLoading(false);
    });
  };

  useEffect(() => { setLoading(true); refresh(); }, [username]);
  return { xp, loading, refresh };
}

export function useJoinedUnits() {
  const { profile } = useAuth();
  const username = profile?.username;
  const [joinedUnitIds, setJoinedUnitIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    if (!username) return;
    supabase.from('user_progress').select('unit_id').eq('user_id', username).then(({ data }) => {
      setJoinedUnitIds(new Set((data ?? []).map((r) => r.unit_id)));
      setLoading(false);
    });
  };

  useEffect(() => { setLoading(true); refresh(); }, [username]);

  const joinUnit = async (unitId: string) => {
    if (!username) return;
    await supabase.from('user_progress').insert({ user_id: username, unit_id: unitId });
    setJoinedUnitIds((prev) => new Set(prev).add(unitId));
  };

  return { joinedUnitIds, loading, refresh, joinUnit };
}

export function useSolvedChallenges() {
  const { profile } = useAuth();
  const username = profile?.username;
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    if (!username) return;
    supabase.from('solved_challenges').select('challenge_id').eq('user_id', username).then(({ data }) => {
      setSolvedIds(new Set((data ?? []).map((r) => r.challenge_id)));
      setLoading(false);
    });
  };

  useEffect(() => { setLoading(true); refresh(); }, [username]);

  const solveChallenge = async (challengeId: string, xpAwarded: number) => {
    if (!username) return;
    await supabase.from('solved_challenges').insert({ user_id: username, challenge_id: challengeId, xp_awarded: xpAwarded });
    setSolvedIds((prev) => new Set(prev).add(challengeId));
  };

  return { solvedIds, loading, refresh, solveChallenge };
}

export interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  solved_count: number;
  rank: number;
}

export interface LeaderboardSeries {
  user_id: string;
  total_xp: number;
  solved_count: number;
  rank: number;
  points: { date: string; cumulative: number }[];
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [series, setSeries] = useState<LeaderboardSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    supabase.from('solved_challenges').select('user_id, xp_awarded, solved_at').order('solved_at', { ascending: true }).then(({ data }) => {
      const byUser = new Map<string, { xp: number; solved: number; points: { date: string; cumulative: number }[] }>();
      for (const row of data ?? []) {
        const uid = row.user_id ?? 'anon';
        const existing = byUser.get(uid) ?? { xp: 0, solved: 0, points: [] };
        existing.xp += row.xp_awarded ?? 0;
        existing.solved += 1;
        existing.points.push({ date: row.solved_at ?? '', cumulative: existing.xp });
        byUser.set(uid, existing);
      }
      const sorted = Array.from(byUser.entries())
        .map(([user_id, v]) => ({ user_id, total_xp: v.xp, solved_count: v.solved, points: v.points }))
        .sort((a, b) => b.total_xp - a.total_xp);
      setEntries(sorted.map((e, i) => ({ user_id: e.user_id, total_xp: e.total_xp, solved_count: e.solved_count, rank: i + 1 })));
      setSeries(sorted.map((e, i) => ({ user_id: e.user_id, total_xp: e.total_xp, solved_count: e.solved_count, rank: i + 1, points: e.points })));
      setLoading(false);
    });
  };

  useEffect(() => { refresh(); }, []);
  return { entries, series, loading, refresh };
}