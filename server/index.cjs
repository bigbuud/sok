const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../dist')));

// ─── Database setup ───────────────────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || '/data/sok.db';
const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    key  TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  )
`);

// ─── API: get state ───────────────────────────────────────────────────────────
app.get('/api/state', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM state WHERE key = ?').get('appstate');
    res.json(row ? JSON.parse(row.value) : null);
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

// ─── API: save state ──────────────────────────────────────────────────────────
app.post('/api/state', (req, res) => {
  try {
    const state = req.body;
    if (!state || !Array.isArray(state.profiles)) {
      return res.status(400).json({ error: 'Invalid state' });
    }
    db.prepare(`
      INSERT OR REPLACE INTO state (key, value, updated_at)
      VALUES (?, ?, strftime('%s','now'))
    `).run('appstate', JSON.stringify(state));
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/state error:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// ─── Fallback: SPA ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🧮 SOK server running on port ${PORT}`));
