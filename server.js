const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const pool = new Pool({ connectionString: DATABASE_URL });
const SESSION_DAYS = 30;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username VARCHAR(24) UNIQUE NOT NULL,
      name VARCHAR(80) NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      role VARCHAR(16) NOT NULL DEFAULT 'user'
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash CHAR(64) PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
  `);
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'user'");
  const legacyAdmins = (process.env.TCA_ADMIN_USERNAMES || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  if (legacyAdmins.length) {
    await pool.query("UPDATE users SET role='admin' WHERE lower(username)=ANY($1::text[]) AND role='user' AND lower(username) <> 'p11'", [legacyAdmins]);
  }
  // Bootstrap the requested owner account as the only superadmin; never demote it through the UI.
  await pool.query("UPDATE users SET role='superadmin' WHERE lower(username)='p11'");
}

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}
function verifyPassword(password, stored) {
  try {
    const [kind, saltHex, hashHex] = stored.split('$');
    if (kind !== 'scrypt') return false;
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
    const expected = Buffer.from(hashHex, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch { return false; }
}
function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}
function json(res, status, body, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
  res.end(JSON.stringify(body));
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => {
      data += c;
      if (data.length > 65536) { reject(new Error('Payload too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
async function currentUser(req) {
  const token = parseCookies(req).tca_session;
  if (!token) return null;
  const r = await pool.query(
    `SELECT u.id,u.username,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at > NOW()`,
    [tokenHash(token)]
  );
  return r.rows[0] || null;
}

function roleFlags(role) {
  return { role, isAdmin: role === 'admin' || role === 'superadmin', isSuperadmin: role === 'superadmin' };
}
async function requireSuperadmin(req, res) {
  const user = await currentUser(req);
  if (!user) {
    json(res, 401, { error: 'Please sign in again.' });
    return null;
  }
  if (user.role !== 'superadmin') {
    json(res, 403, { error: 'Only the superadmin can manage user roles.' });
    return null;
  }
  return user;
}
async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await pool.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)', [tokenHash(token), userId, expires]);
  return `tca_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
async function handleApi(req, res, pathname) {
  try {
    if (req.method === 'GET' && pathname === '/api/me') {
      const u = await currentUser(req);
      if (!u) return json(res, 401, { error: 'Not signed in' });
      return json(res, 200, { user: { name: u.name, username: u.username, key: u.username, ...roleFlags(u.role) } });
    }
    if (req.method === 'POST' && pathname === '/api/register') {
      const { name = '', username = '', password = '' } = await readJson(req);
      const cleanName = String(name).trim(), cleanUser = String(username).trim().toLowerCase();
      if (!cleanName || cleanName.length > 80) return json(res, 400, { error: 'Enter your first name.' });
      if (!/^[a-z0-9._-]{3,24}$/.test(cleanUser)) return json(res, 400, { error: 'Usernames need 3 to 24 letters, numbers, dots or dashes.' });
      if (String(password).length < 6 || String(password).length > 200) return json(res, 400, { error: 'Your password needs at least 6 characters.' });
      let row;
      try {
        row = (await pool.query(
          'INSERT INTO users(username,name,password_hash) VALUES($1,$2,$3) RETURNING id,username,name,role',
          [cleanUser, cleanName, hashPassword(String(password))]
        )).rows[0];
      } catch (e) {
        if (e.code === '23505') return json(res, 409, { error: 'That username is taken. Try another one.' });
        throw e;
      }
      const cookie = await createSession(res, row.id);
      return json(res, 201, { user: { name: row.name, username: row.username, key: row.username, ...roleFlags(row.role) } }, { 'Set-Cookie': cookie });
    }
    if (req.method === 'POST' && pathname === '/api/login') {
      const { username = '', password = '' } = await readJson(req);
      const cleanUser = String(username).trim().toLowerCase();
      const row = (await pool.query('SELECT id,username,name,password_hash,role FROM users WHERE username=$1', [cleanUser])).rows[0];
      if (!row || !verifyPassword(String(password), row.password_hash)) {
        return json(res, 401, { error: 'Username or password is not right. Check them and try again.' });
      }
      const cookie = await createSession(res, row.id);
      return json(res, 200, { user: { name: row.name, username: row.username, key: row.username, ...roleFlags(row.role) } }, { 'Set-Cookie': cookie });
    }
    if (req.method === 'GET' && pathname === '/api/superadmin/users') {
      const actor = await requireSuperadmin(req, res);
      if (!actor) return;
      const result = await pool.query("SELECT id,username,name,role,created_at FROM users ORDER BY created_at DESC, username ASC");
      return json(res, 200, { users: result.rows });
    }
    if (req.method === 'POST' && pathname === '/api/superadmin/users/role') {
      const actor = await requireSuperadmin(req, res);
      if (!actor) return;
      const { username = '', isAdmin } = await readJson(req);
      const cleanUser = String(username).trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,24}$/.test(cleanUser) || typeof isAdmin !== 'boolean') {
        return json(res, 400, { error: 'Choose a valid user and admin setting.' });
      }
      const target = (await pool.query("SELECT id,username,name,role FROM users WHERE lower(username)=$1", [cleanUser])).rows[0];
      if (!target) return json(res, 404, { error: 'User not found.' });
      if (target.role === 'superadmin') return json(res, 403, { error: 'The superadmin role cannot be changed here.' });
      const nextRole = isAdmin ? 'admin' : 'user';
      const updated = (await pool.query(
        "UPDATE users SET role=$1 WHERE id=$2 AND role <> 'superadmin' RETURNING id,username,name,role",
        [nextRole, target.id]
      )).rows[0];
      if (!updated) return json(res, 409, { error: 'The user role changed; refresh and try again.' });
      return json(res, 200, { user: updated, changedBy: actor.username });
    }
    if (req.method === 'POST' && pathname === '/api/logout') {
      const token = parseCookies(req).tca_session;
      if (token) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [tokenHash(token)]);
      return json(res, 200, { ok: true }, { 'Set-Cookie': 'tca_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
    }
    return json(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('API error', e);
    return json(res, 500, { error: 'Server error. Please try again.' });
  }
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);
  if (pathname === '/health') { res.writeHead(200); return res.end('ok'); }

  let file = path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || st.isDirectory()) file = path.join(ROOT, 'index.html');
    fs.readFile(file, (e, buf) => {
      if (e) { res.writeHead(500); return res.end('Server error'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
  });
});

initDb()
  .then(() => server.listen(PORT, '0.0.0.0', () => console.log('TCA Tactics Trainer on port ' + PORT)))
  .catch(err => { console.error('Database initialization failed', err); process.exit(1); });
