import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parser
app.use(express.json({ limit: '5mb' }));

// ====== PROGRESS API ======
const PROGRESS_DIR = path.join(__dirname, 'data', 'progress');
if (!fs.existsSync(PROGRESS_DIR)) {
  fs.mkdirSync(PROGRESS_DIR, { recursive: true });
}

// Save progress
app.post('/api/progress/:userId', (req, res) => {
  try {
    const safeId = req.params.userId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeId) return res.status(400).json({ error: 'Invalid userId' });
    const data = { ...req.body, updatedAt: Date.now() };
    fs.writeFileSync(path.join(PROGRESS_DIR, `${safeId}.json`), JSON.stringify(data), 'utf-8');
    res.json({ success: true, updatedAt: data.updatedAt });
  } catch (err) {
    console.error('Save progress error:', err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Load progress
app.get('/api/progress/:userId', (req, res) => {
  try {
    const safeId = req.params.userId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeId) return res.status(400).json({ error: 'Invalid userId' });
    const filePath = path.join(PROGRESS_DIR, `${safeId}.json`);
    if (!fs.existsSync(filePath)) return res.json({ exists: false });
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ exists: true, data });
  } catch (err) {
    console.error('Load progress error:', err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

// Serve static files from dist (built Vite output)
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
}));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚦 PDD Server running on port ${PORT}`);
});
