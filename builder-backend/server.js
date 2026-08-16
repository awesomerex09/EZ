import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve the Builder Editor (React app) at port 3003 root
app.use(express.static(path.join(__dirname, '../builder-editor/dist')));

// Serve the Client Renderer (GSAP scrollytelling) at /preview
app.use('/preview', express.static(path.join(__dirname, '../client-renderer/dist')));

// Serve sequence frames
app.use('/sequence', express.static(path.join(__dirname, '../client-renderer/public/sequence')));

// Serve background assets from builder-backend/background/
app.use('/background', express.static(path.join(__dirname, 'background')));

// ── API ────────────────────────────────────────────────────────

app.get('/api/sequence-info', (req, res) => {
  try {
    const seqPath = path.join(__dirname, '../client-renderer/public/sequence');
    const files = fs.readdirSync(seqPath).filter((f) => f.endsWith('.webp'));
    res.json({ totalFrames: files.length });
  } catch (_) {
    res.json({ totalFrames: 0 });
  }
});

// In-memory config store (persists per-process)
const database = {
  'site-1': {
    mobile: {
      scroll: { speedMultiplier: 1.0 },
      cards: [
        { id: 'uuid-001', content: 'Mobile Future', opacity: 0.85, position: { top: '20%', left: '10%' }, timing: { startProgress: 0.05, endProgress: 0.25 } },
        { id: 'uuid-002', content: 'Fluidity', opacity: 0.85, position: { top: '40%', left: '10%' }, timing: { startProgress: 0.35, endProgress: 0.55 } },
        { id: 'uuid-003', content: 'Instant', opacity: 0.85, position: { top: '60%', left: '10%' }, timing: { startProgress: 0.65, endProgress: 0.85 } },
      ],
      effects: {
        preloader: { enabled: false },
        pageTransition: { type: 'none', duration: 1.5 },
        cursorHover: { enabled: false, type: 'fluid', fluidSettings: { pressure: 0.8, color: '#00ffcc', radius: 0.2 } },
      },
    },
    desktop: {
      scroll: { speedMultiplier: 1.5 },
      cards: [
        { id: 'uuid-001', content: 'The Future is Here', opacity: 0.85, position: { top: '20%', left: '10%' }, timing: { startProgress: 0.05, endProgress: 0.25 } },
        { id: 'uuid-002', content: 'Fluid Interruptibility', opacity: 0.85, position: { top: '40%', left: '10%' }, timing: { startProgress: 0.35, endProgress: 0.55 } },
        { id: 'uuid-003', content: 'Zero Latency', opacity: 0.85, position: { top: '60%', left: '10%' }, timing: { startProgress: 0.65, endProgress: 0.85 } },
      ],
      effects: {
        preloader: { enabled: false },
        pageTransition: { type: 'splatter', duration: 1.5 },
        cursorHover: { enabled: true, type: 'fluid', fluidSettings: { pressure: 0.8, color: '#00ffcc', radius: 0.2 } },
      },
    },
  },
};

app.get('/api/config/:id', (req, res) => {
  const config = database[req.params.id];
  if (!config) return res.status(404).json({ error: 'Config not found' });
  res.json(config);
});

app.post('/api/config/:id', (req, res) => {
  database[req.params.id] = req.body;
  res.json({ success: true });
});

// SPA fallback for the builder editor
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/sequence') || req.path.startsWith('/background') || req.path.startsWith('/preview')) return next();
  res.sendFile(path.join(__dirname, '../builder-editor/dist/index.html'));
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`\n✅  EZ Builder running on http://localhost:${PORT}`);
  console.log(`   Editor:   http://localhost:${PORT}/`);
  console.log(`   Preview:  http://localhost:${PORT}/preview`);
  console.log(`   API:      http://localhost:${PORT}/api/config/site-1\n`);
});
