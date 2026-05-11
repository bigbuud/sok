import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = process.env.STATE_FILE || '/data/state.json';

// Zorg dat de data-map bestaat
const dataDir = path.dirname(STATE_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.use(express.json({ limit: '1mb' }));

// Statische React-app serveren
app.use(express.static(path.join(__dirname, 'dist')));

// GET /api/state — geef opgeslagen staat terug
app.get('/api/state', (req, res) => {
  try {
    if (!fs.existsSync(STATE_FILE)) return res.json(null);
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch {
    res.json(null);
  }
});

// POST /api/state — sla staat op
app.post('/api/state', (req, res) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (err) {
    console.error('Schrijffout:', err);
    res.status(500).json({ ok: false });
  }
});

// Alle andere routes → React app (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Rekenmeester draait op poort ${PORT}`);
  console.log(`Data opgeslagen in: ${STATE_FILE}`);
});
