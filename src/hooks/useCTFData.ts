import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { CTFPath, CTFPathNode, CTFPathProgress, CTFPathCategory, Challenge } from '@/types';

// --- CATEGORY HOOKS ---

// Hook: Fetch all CTF path categories (sorted by display_order)
export function useCTFCategories() {
  const [categories, setCategories] = useState<CTFPathCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ctf_path_categories')
      .select('*')
      .order('created_at', { ascending: true }); // CHANGED: Oldest first now

    if (!error && data) setCategories(data as CTFPathCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, refresh: fetchCategories };
}

// --- PATH HOOKS ---

// Hook: Fetch all published CTF paths (with category info)
export function useCTFPaths() {
  const [paths, setPaths] = useState<CTFPath[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaths = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ctf_paths')
      .select('*, category:ctf_path_categories(*), nodes:ctf_path_nodes(id)') // CHANGED: Fetch nodes to get count
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (!error && data) setPaths(data as CTFPath[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  return { paths, loading, refresh: fetchPaths };
}

// Hook: Fetch all CTF paths (admin view - includes drafts)
export function useAllCTFPathsAdmin() {
  const [paths, setPaths] = useState<CTFPath[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaths = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ctf_paths')
      .select('*, category:ctf_path_categories(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPaths(data as CTFPath[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  return { paths, loading, refresh: fetchPaths };
}

// Hook: Fetch a single CTF path with its nodes and challenge data
export function useCTFPath(pathId: string | undefined) {
  const [path, setPath] = useState<CTFPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pathId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    supabase
      .from('ctf_paths')
      .select(`
        *,
        category:ctf_path_categories(*),
        nodes:ctf_path_nodes(
          *,
          challenge:challenges(*)
        )
      `)
      .eq('id', pathId)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        if (data) {
          const pathData = data as any;
          // Sort nodes by node_order
          const sortedNodes = (pathData.nodes ?? []).sort(
            (a: CTFPathNode, b: CTFPathNode) => a.node_order - b.node_order
          );
          
          setPath({
            ...pathData,
            nodes: sortedNodes,
          } as CTFPath);
        }
        setLoading(false);
      });
  }, [pathId]);

  return { path, loading, error };
}

// --- PROGRESS HOOKS ---

// Hook: Fetch user's progress across all CTF paths
export function useCTFPathProgress() {
  const { profile } = useAuth();
  const [progressMap, setProgressMap] = useState<Map<string, CTFPathProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!profile?.username) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('ctf_path_progress')
      .select('*')
      .eq('user_id', profile.username);

    if (!error && data) {
      const map = new Map<string, CTFPathProgress>();
      (data as CTFPathProgress[]).forEach((p) => {
        map.set(p.path_id, p);
      });
      setProgressMap(map);
    }
    setLoading(false);
  }, [profile?.username]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progressMap, loading, refresh: fetchProgress };
}

// Hook: Join a CTF path (create progress record)
export function useJoinCTFPath() {
  const { profile } = useAuth();
  const [joining, setJoining] = useState(false);

  const joinPath = useCallback(async (pathId: string) => {
    if (!profile?.username) return;

    setJoining(true);
    const { error } = await supabase.rpc('join_ctf_path', {
      p_path_id: pathId,
    });

    setJoining(false);
    return !error;
  }, [profile?.username]);

  return { joinPath, joining };
}

// Hook: Advance to next node in a CTF path
export function useAdvanceCTFNode() {
  const { profile } = useAuth();
  const [advancing, setAdvancing] = useState(false);

  const advanceNode = useCallback(async (pathId: string, completedNodeOrder: number) => {
    if (!profile?.username) return null;

    setAdvancing(true);
    const { data, error } = await supabase.rpc('advance_ctf_node', {
      p_path_id: pathId,
      p_completed_node_order: completedNodeOrder,
    });

    setAdvancing(false);

    if (error) {
      console.error('Failed to advance node:', error);
      return null;
    }

    return data as { next_node_order: number; path_completed: boolean };
  }, [profile?.username]);

  return { advanceNode, advancing };
}

// --- HELPER HOOKS ---

// Hook: Fetch a single challenge with hints and files (for CTF node view)
export function useCTFNodeChallenge(challengeId: string | undefined) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!challengeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('challenges')
      .select('*, hints:challenge_hints(*), files:challenge_files(*)')
      .eq('id', challengeId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const c = data as Challenge;
          c.hints = (c.hints ?? []).sort((a, b) => a.hint_order - b.hint_order);
          c.files = data.files ?? [];
          setChallenge(c);
        }
        setLoading(false);
      });
  }, [challengeId]);

  return { challenge, loading };
}

// Hook: Get total XP for a CTF path (sum of all challenge XP rewards)
export function useCTFPathTotalXP(nodes: CTFPathNode[] | undefined) {
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    if (!nodes || nodes.length === 0) {
      setTotalXP(0);
      return;
    }

    const total = nodes.reduce((sum, node) => {
      return sum + (node.challenge?.xp_reward ?? 0);
    }, 0);

    setTotalXP(total);
  }, [nodes]);

  return totalXP;
}