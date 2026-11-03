// CTFLingo Local SQLite Supabase-compatible Client
import type { Session, User } from '@supabase/supabase-js';

type AuthListener = (event: string, session: Session | null) => void;
const authListeners = new Set<AuthListener>();

function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem('ctflingo_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStoredSession(session: Session | null) {
  try {
    if (session) {
      localStorage.setItem('ctflingo_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('ctflingo_session');
    }
  } catch {}
}

function notifyAuth(event: string, session: Session | null) {
  setStoredSession(session);
  authListeners.forEach((cb) => {
    try { cb(event, session); } catch (e) { console.error(e); }
  });
}

function getAuthHeader(): Record<string, string> {
  const session = getStoredSession();
  if (session?.user?.id) {
    return { Authorization: `Bearer ${session.user.id}` };
  }
  return {};
}

class QueryBuilder<T = any[]> implements PromiseLike<{ data: T | null; error: any; count?: number | null }> {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectCols = '*';
  private countOption?: 'exact';
  private isSingle = false;
  private isMaybeSingle = false;
  private eqConditions: Record<string, any> = {};
  private orderConfig?: { column: string; ascending?: boolean };
  private payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = '*', options?: { count?: 'exact'; head?: boolean }): QueryBuilder<T> {
    this.selectCols = cols;
    if (options?.count) this.countOption = options.count;
    return this;
  }

  eq(col: string, val: any): QueryBuilder<T> {
    this.eqConditions[col] = val;
    return this;
  }

  order(col: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    this.orderConfig = { column: col, ascending: options?.ascending !== false };
    return this;
  }

  single(): QueryBuilder<any> {
    this.isSingle = true;
    return this as unknown as QueryBuilder<any>;
  }

  maybeSingle(): QueryBuilder<any> {
    this.isMaybeSingle = true;
    return this as unknown as QueryBuilder<any>;
  }

  insert(data: any): QueryBuilder<T> {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any): QueryBuilder<T> {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete(): QueryBuilder<T> {
    this.action = 'delete';
    return this;
  }

  async execute(): Promise<{ data: T | null; error: any; count?: number | null }> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      if (this.action === 'select') {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            table: this.table,
            select: this.selectCols,
            eq: this.eqConditions,
            order: this.orderConfig,
            single: this.isSingle,
            maybeSingle: this.isMaybeSingle,
            count: this.countOption,
          }),
        });
        const json = await res.json();
        return json;
      }

      if (this.action === 'insert') {
        const res = await fetch('/api/insert', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            table: this.table,
            data: this.payload,
            select: Boolean(this.selectCols),
            single: this.isSingle,
          }),
        });
        const json = await res.json();
        return json;
      }

      if (this.action === 'update') {
        const res = await fetch('/api/update', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            table: this.table,
            data: this.payload,
            eq: this.eqConditions,
          }),
        });
        const json = await res.json();
        return json;
      }

      if (this.action === 'delete') {
        const res = await fetch('/api/delete', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            table: this.table,
            eq: this.eqConditions,
          }),
        });
        const json = await res.json();
        return json;
      }

      return { data: null, error: new Error('Unknown action') };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  then<TResult1 = { data: T | null; error: any; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  auth: {
    async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
      const stored = getStoredSession();
      if (!stored) {
        return { data: { session: null }, error: null };
      }
      try {
        const res = await fetch('/api/auth/session', {
          headers: getAuthHeader(),
        });
        const json = await res.json();
        if (json.session) {
          setStoredSession(json.session);
          return { data: { session: json.session }, error: null };
        }
      } catch {}
      return { data: { session: stored }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
      authListeners.add(callback);
      const current = getStoredSession();
      if (current) callback('INITIAL', current);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { username?: string } } }) {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            username: options?.data?.username,
          }),
        });
        const json = await res.json();
        if (json.data?.session) {
          notifyAuth('SIGNED_IN', json.data.session);
        }
        return json;
      } catch (err: any) {
        return { data: { user: null, session: null }, error: err };
      }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (json.data?.session) {
          notifyAuth('SIGNED_IN', json.data.session);
        }
        return json;
      } catch (err: any) {
        return { data: { user: null, session: null }, error: err };
      }
    },

    async signOut() {
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: getAuthHeader(),
        });
      } catch {}
      notifyAuth('SIGNED_OUT', null);
      return { error: null };
    },
  },

  from(table: string) {
    return new QueryBuilder(table);
  },

  async rpc(fn: string, params: Record<string, any> = {}) {
    try {
      const session = getStoredSession();
      const res = await fetch('/api/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          fn,
          params: {
            ...params,
            user_id: session?.user?.user_metadata?.username || params.user_id,
          },
        }),
      });
      return await res.json();
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  storage: {
    from(_bucket: string) {
      return {
        async upload(filePath: string, file: File) {
          try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const fileContentBase64 = btoa(binary);

            const res = await fetch('/api/storage/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
              },
              body: JSON.stringify({
                filename: filePath,
                fileContentBase64,
              }),
            });
            return await res.json();
          } catch (err: any) {
            return { data: null, error: err };
          }
        },

        async remove(paths: string[]) {
          try {
            const res = await fetch('/api/storage/remove', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
              },
              body: JSON.stringify({ paths }),
            });
            return await res.json();
          } catch (err: any) {
            return { data: null, error: err };
          }
        },
      };
    },
  },
};
