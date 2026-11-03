import { db, hashPassword } from './db.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'data', 'uploads', 'challenge-files');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to format rows
function formatRow(table, row) {
  if (!row) return row;
  const res = { ...row };

  // Never leak password hashes
  if (table === 'profiles') {
    delete res.password;
  }

  // Convert SQLite 0/1 to booleans
  if ('published' in res) res.published = Boolean(res.published);
  if ('completed' in res) res.completed = Boolean(res.completed);

  // Convert JSON fields to objects/arrays
  if (table === 'units') {
    try { res.tags = typeof res.tags === 'string' ? JSON.parse(res.tags) : (res.tags || []); } catch { res.tags = []; }
    try { res.prerequisites = typeof res.prerequisites === 'string' ? JSON.parse(res.prerequisites) : (res.prerequisites || []); } catch { res.prerequisites = []; }
    try { res.objectives = typeof res.objectives === 'string' ? JSON.parse(res.objectives) : (res.objectives || []); } catch { res.objectives = []; }
  } else if (table === 'challenges') {
    try { res.objectives = typeof res.objectives === 'string' ? JSON.parse(res.objectives) : (res.objectives || []); } catch { res.objectives = []; }
  }

  return res;
}

// Populate nested relationships for Supabase-like queries
function populateRelations(table, rows, selectStr = '') {
  if (!Array.isArray(rows)) return rows;

  for (const row of rows) {
    if (table === 'units') {
      if (selectStr.includes('lessons:lessons')) {
        const lessons = db.prepare('SELECT id, title, summary, duration_minutes, lesson_order FROM lessons WHERE unit_id = ? ORDER BY lesson_order ASC').all(row.id);
        row.lessons = lessons.map(l => formatRow('lessons', l));
      }
      if (selectStr.includes('challenges:challenges')) {
        const challenges = db.prepare('SELECT id, title, difficulty, xp_reward, challenge_type, objectives FROM challenges WHERE unit_id = ? ORDER BY created_at ASC').all(row.id);
        row.challenges = challenges.map(c => formatRow('challenges', c));
      }
    } else if (table === 'lessons') {
      if (selectStr.includes('content_blocks:lesson_content_blocks') || selectStr.includes('blocks:lesson_content_blocks')) {
        const blocks = db.prepare('SELECT * FROM lesson_content_blocks WHERE lesson_id = ? ORDER BY block_order ASC').all(row.id);
        const formatted = blocks.map(b => formatRow('lesson_content_blocks', b));
        row.content_blocks = formatted;
        row.blocks = formatted;
      }
      if (selectStr.includes('resources:lesson_resources')) {
        const resources = db.prepare('SELECT * FROM lesson_resources WHERE lesson_id = ? ORDER BY created_at ASC').all(row.id);
        row.resources = resources.map(r => formatRow('lesson_resources', r));
      }
      if (selectStr.includes('unit:units')) {
        const unit = db.prepare('SELECT title FROM units WHERE id = ?').get(row.unit_id);
        row.unit = unit || null;
      }
    } else if (table === 'challenges') {
      if (selectStr.includes('hints:challenge_hints')) {
        const hints = db.prepare('SELECT * FROM challenge_hints WHERE challenge_id = ? ORDER BY hint_order ASC').all(row.id);
        row.hints = hints.map(h => formatRow('challenge_hints', h));
      }
      if (selectStr.includes('files:challenge_files')) {
        const files = db.prepare('SELECT * FROM challenge_files WHERE challenge_id = ? ORDER BY created_at DESC').all(row.id);
        row.files = files.map(f => formatRow('challenge_files', f));
      }
      if (selectStr.includes('unit:units')) {
        const unit = db.prepare('SELECT title FROM units WHERE id = ?').get(row.unit_id);
        row.unit = unit || null;
      }
    } else if (table === 'ctf_paths') {
      if (selectStr.includes('category:ctf_path_categories')) {
        const cat = db.prepare('SELECT * FROM ctf_path_categories WHERE id = ?').get(row.category_id);
        row.category = cat ? formatRow('ctf_path_categories', cat) : null;
      }
      if (selectStr.includes('nodes:ctf_path_nodes')) {
        const nodes = db.prepare('SELECT * FROM ctf_path_nodes WHERE path_id = ? ORDER BY node_order ASC').all(row.id);
        row.nodes = nodes.map(n => {
          const fn = formatRow('ctf_path_nodes', n);
          if (selectStr.includes('challenge:challenges')) {
            const ch = db.prepare('SELECT * FROM challenges WHERE id = ?').get(n.challenge_id);
            fn.challenge = ch ? formatRow('challenges', ch) : null;
          }
          return fn;
        });
      }
    }
  }

  return rows;
}

// Request dispatcher
export async function handleApiRequest(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // Handle static storage downloads: /storage/v1/object/public/challenge-files/:filename
  if (pathname.startsWith('/storage/v1/object/public/challenge-files/')) {
    const filename = decodeURIComponent(pathname.replace('/storage/v1/object/public/challenge-files/', ''));
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }
  }

  // Handle /api routes
  if (!pathname.startsWith('/api/')) return false;

  // Read JSON body if present
  let body = {};
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    body = await readJsonBody(req);
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. GET /api/auth/session
    if (pathname === '/api/auth/session') {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/, '').trim();
      let user = null;

      if (token) {
        user = db.prepare('SELECT id, username, email, role, created_at FROM profiles WHERE id = ? OR username = ?').get(token, token);
      }

      if (user) {
        res.writeHead(200);
        res.end(JSON.stringify({
          session: {
            access_token: user.id,
            user: {
              id: user.id,
              email: user.email,
              user_metadata: { username: user.username },
            },
          },
          profile: user,
        }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ session: null, profile: null }));
      }
      return;
    }

    // 2. POST /api/auth/signup
    if (pathname === '/api/auth/signup') {
      const { email, password, username } = body;
      const cleanUsername = (username || email.split('@')[0] || 'user').trim();

      const existing = db.prepare('SELECT id FROM profiles WHERE username = ? OR email = ?').get(cleanUsername, email);
      if (existing) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: { message: 'Username or email already taken' } }));
        return;
      }

      const totalProfiles = db.prepare('SELECT COUNT(*) as count FROM profiles').get().count;
      const role = totalProfiles === 0 ? 'admin' : 'user';
      const id = crypto.randomUUID();

      db.prepare(`
        INSERT INTO profiles (id, username, email, password, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, cleanUsername, email, hashPassword(password), role);

      const user = { id, username: cleanUsername, email, role };
      res.writeHead(200);
      res.end(JSON.stringify({
        data: {
          user: {
            id,
            email,
            user_metadata: { username: cleanUsername },
          },
          session: {
            access_token: id,
            user: { id, email, user_metadata: { username: cleanUsername } },
          },
        },
        error: null,
      }));
      return;
    }

    // 3. POST /api/auth/signin
    if (pathname === '/api/auth/signin') {
      const { email, password } = body;
      const hashed = hashPassword(password);
      const user = db.prepare('SELECT * FROM profiles WHERE (email = ? OR username = ?) AND password = ?').get(email, email, hashed);

      if (!user) {
        res.writeHead(400);
        res.end(JSON.stringify({ data: { user: null, session: null }, error: { message: 'Invalid email or password' } }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        data: {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { username: user.username },
          },
          session: {
            access_token: user.id,
            user: {
              id: user.id,
              email: user.email,
              user_metadata: { username: user.username },
            },
          },
        },
        error: null,
      }));
      return;
    }

    // 4. POST /api/auth/signout
    if (pathname === '/api/auth/signout') {
      res.writeHead(200);
      res.end(JSON.stringify({ error: null }));
      return;
    }

    // 5. POST /api/query
    if (pathname === '/api/query') {
      const { table, select = '*', eq = {}, order, single = false, maybeSingle = false, count } = body;

      // Count exact check
      if (count === 'exact') {
        let sql = `SELECT COUNT(*) as total FROM ${table}`;
        const params = [];
        const whereClauses = [];

        for (const [k, v] of Object.entries(eq)) {
          whereClauses.push(`${k} = ?`);
          params.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
        }

        if (whereClauses.length > 0) {
          sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        const total = db.prepare(sql).get(...params).total;
        res.writeHead(200);
        res.end(JSON.stringify({ count: total, data: [] }));
        return;
      }

      let sql = `SELECT * FROM ${table}`;
      const params = [];
      const whereClauses = [];

      for (const [k, v] of Object.entries(eq)) {
        whereClauses.push(`${k} = ?`);
        params.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
      }

      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      if (order && order.column) {
        const dir = order.ascending === false ? 'DESC' : 'ASC';
        sql += ` ORDER BY ${order.column} ${dir}`;
      }

      const rows = db.prepare(sql).all(...params);
      let formattedRows = rows.map(r => formatRow(table, r));
      formattedRows = populateRelations(table, formattedRows, select);

      if (single) {
        if (formattedRows.length === 0) {
          res.writeHead(404);
          res.end(JSON.stringify({ data: null, error: { message: 'Row not found' } }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({ data: formattedRows[0], error: null }));
        }
        return;
      }

      if (maybeSingle) {
        res.writeHead(200);
        res.end(JSON.stringify({ data: formattedRows.length > 0 ? formattedRows[0] : null, error: null }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ data: formattedRows, error: null }));
      return;
    }

    // 6. POST /api/insert
    if (pathname === '/api/insert') {
      const { table, data, select = false, single = false } = body;
      const items = Array.isArray(data) ? data : [data];
      const insertedRows = [];

      for (const item of items) {
        const row = { ...item };
        if (!row.id) row.id = crypto.randomUUID();

        // Serialize fields
        for (const [k, v] of Object.entries(row)) {
          if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
            row[k] = JSON.stringify(v);
          } else if (typeof v === 'boolean') {
            row[k] = v ? 1 : 0;
          }
        }

        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(', ');
        const values = Object.values(row);

        try {
          db.prepare(`
            INSERT INTO ${table} (${cols.join(', ')})
            VALUES (${placeholders})
          `).run(...values);
        } catch (e) {
          if (e.message && e.message.includes('UNIQUE constraint failed')) {
            // If duplicate, ignore and fetch existing if possible
          } else {
            throw e;
          }
        }

        let fetched = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(row.id);
        if (!fetched && row.user_id && row.unit_id) {
          fetched = db.prepare(`SELECT * FROM ${table} WHERE user_id = ? AND unit_id = ?`).get(row.user_id, row.unit_id);
        } else if (!fetched && row.user_id && row.challenge_id) {
          fetched = db.prepare(`SELECT * FROM ${table} WHERE user_id = ? AND challenge_id = ?`).get(row.user_id, row.challenge_id);
        }
        insertedRows.push(formatRow(table, fetched || row));
      }

      const result = single ? (insertedRows[0] || null) : (Array.isArray(data) ? insertedRows : insertedRows[0]);
      res.writeHead(200);
      res.end(JSON.stringify({ data: result, error: null }));
      return;
    }

    // 7. POST /api/update
    if (pathname === '/api/update') {
      const { table, data, eq = {} } = body;
      const updateData = { ...data };

      // Serialize
      for (const [k, v] of Object.entries(updateData)) {
        if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
          updateData[k] = JSON.stringify(v);
        } else if (typeof v === 'boolean') {
          updateData[k] = v ? 1 : 0;
        }
      }

      if ('updated_at' in db.prepare(`PRAGMA table_info(${table})`).all().reduce((acc, c) => ({ ...acc, [c.name]: true }), {})) {
        updateData.updated_at = new Date().toISOString();
      }

      const setCols = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
      const setVals = Object.values(updateData);

      const whereClauses = [];
      const whereVals = [];
      for (const [k, v] of Object.entries(eq)) {
        whereClauses.push(`${k} = ?`);
        whereVals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
      }

      const sql = `UPDATE ${table} SET ${setCols} WHERE ${whereClauses.join(' AND ')}`;
      db.prepare(sql).run(...setVals, ...whereVals);

      res.writeHead(200);
      res.end(JSON.stringify({ data: null, error: null }));
      return;
    }

    // 8. POST /api/delete
    if (pathname === '/api/delete') {
      const { table, eq = {} } = body;
      const whereClauses = [];
      const whereVals = [];

      for (const [k, v] of Object.entries(eq)) {
        whereClauses.push(`${k} = ?`);
        whereVals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
      }

      const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`;
      db.prepare(sql).run(...whereVals);

      res.writeHead(200);
      res.end(JSON.stringify({ data: null, error: null }));
      return;
    }

    // 9. POST /api/rpc
    if (pathname === '/api/rpc') {
      const { fn, params = {} } = body;

      if (fn === 'get_public_stats') {
        const units = db.prepare('SELECT COUNT(*) as c FROM units WHERE published = 1').get().c;
        const lessons = db.prepare('SELECT COUNT(*) as c FROM lessons').get().c;
        const challenges = db.prepare('SELECT COUNT(*) as c FROM challenges').get().c;
        const xp = db.prepare('SELECT COALESCE(SUM(xp_reward), 0) as s FROM challenges').get().s;

        res.writeHead(200);
        res.end(JSON.stringify({
          data: {
            units,
            lessons,
            challenges,
            xp_available: xp,
          },
          error: null,
        }));
        return;
      }

      if (fn === 'join_ctf_path') {
        const pathId = params.p_path_id;
        const user = params.user_id || 'netrunner';

        db.prepare(`
          INSERT INTO ctf_path_progress (id, user_id, path_id, current_node_order, completed)
          VALUES (?, ?, ?, 0, 0)
          ON CONFLICT(user_id, path_id) DO NOTHING
        `).run(crypto.randomUUID(), user, pathId);

        res.writeHead(200);
        res.end(JSON.stringify({ data: null, error: null }));
        return;
      }

      if (fn === 'advance_ctf_node') {
        const pathId = params.p_path_id;
        const completedNodeOrder = Number(params.p_completed_node_order) || 0;
        const user = params.user_id || 'netrunner';

        const maxRow = db.prepare('SELECT MAX(node_order) as max_order FROM ctf_path_nodes WHERE path_id = ?').get(pathId);
        const maxOrder = maxRow ? (maxRow.max_order || 0) : 0;

        let nextOrder = completedNodeOrder + 1;
        let completed = false;

        if (completedNodeOrder >= maxOrder) {
          completed = true;
          nextOrder = maxOrder;
        }

        db.prepare(`
          INSERT INTO ctf_path_progress (id, user_id, path_id, current_node_order, completed, completed_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, path_id) DO UPDATE SET
            current_node_order = excluded.current_node_order,
            completed = excluded.completed,
            completed_at = excluded.completed_at
        `).run(
          crypto.randomUUID(),
          user,
          pathId,
          nextOrder,
          completed ? 1 : 0,
          completed ? new Date().toISOString() : null
        );

        res.writeHead(200);
        res.end(JSON.stringify({
          data: {
            next_node_order: nextOrder,
            path_completed: completed,
          },
          error: null,
        }));
        return;
      }

      res.writeHead(400);
      res.end(JSON.stringify({ error: { message: `Unknown RPC function: ${fn}` } }));
      return;
    }

    // 10. POST /api/storage/upload
    if (pathname === '/api/storage/upload') {
      const { filename, fileContentBase64 } = body;
      const targetPath = path.join(uploadsDir, filename);

      fs.writeFileSync(targetPath, Buffer.from(fileContentBase64, 'base64'));

      res.writeHead(200);
      res.end(JSON.stringify({ data: { path: filename }, error: null }));
      return;
    }

    // 11. POST /api/storage/remove
    if (pathname === '/api/storage/remove') {
      const { paths = [] } = body;
      for (const p of paths) {
        const filePath = path.join(uploadsDir, p);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch {}
        }
      }
      res.writeHead(200);
      res.end(JSON.stringify({ data: {}, error: null }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (err) {
    console.error('[API Error]:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: { message: err.message || 'Internal server error' } }));
  }

  return true;
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}
