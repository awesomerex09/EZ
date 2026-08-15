import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('../builder-editor/dist'));
app.use('/sequence', express.static('../client-renderer/public/sequence'));

app.get('/api/sequence-info', (req, res) => {
  // In a real scenario, use fs.readdirSync to count files
  res.json({ totalFrames: 3960 });
});

// In-memory mock database
const database = {
  'site-1': {
    mobile: {
      scroll: { speedMultiplier: 1.0 },
      cards: [
        { id: "uuid-001", content: "Mobile Future", opacity: 0.85, position: { top: "20%", left: "10%" }, timing: { startProgress: 0.05, endProgress: 0.25 } },
        { id: "uuid-002", content: "Fluidity", opacity: 0.85, position: { top: "40%", left: "10%" }, timing: { startProgress: 0.35, endProgress: 0.55 } },
        { id: "uuid-003", content: "Instant", opacity: 0.85, position: { top: "60%", left: "10%" }, timing: { startProgress: 0.65, endProgress: 0.85 } }
      ],
      effects: {
        preloader: { enabled: true, customText: "Loading...", bgColor: "#000000" },
        pageTransition: { type: "none", duration: 1.5 },
        cursorHover: { enabled: false, type: "fluid", fluidSettings: { pressure: 0.8, color: "#00ffcc", radius: 0.2 } }
      }
    },
    desktop: {
      scroll: { speedMultiplier: 1.5 },
      cards: [
        { id: "uuid-001", content: "The Future is Here", opacity: 0.85, position: { top: "20%", left: "10%" }, timing: { startProgress: 0.05, endProgress: 0.25 } },
        { id: "uuid-002", content: "Fluid Interruptibility", opacity: 0.85, position: { top: "40%", left: "10%" }, timing: { startProgress: 0.35, endProgress: 0.55 } },
        { id: "uuid-003", content: "Zero Latency", opacity: 0.85, position: { top: "60%", left: "10%" }, timing: { startProgress: 0.65, endProgress: 0.85 } }
      ],
      effects: {
        preloader: { enabled: true, customText: "Loading...", bgColor: "#000000" },
        pageTransition: { type: "splatter", duration: 1.5 },
        cursorHover: { enabled: true, type: "fluid", fluidSettings: { pressure: 0.8, color: "#00ffcc", radius: 0.2 } }
      }
    }
  }
};

app.get('/api/config/:id', (req, res) => {
  const config = database[req.params.id];
  if (!config) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json(config);
});

app.post('/api/config/:id', (req, res) => {
  database[req.params.id] = req.body;
  res.json({ success: true });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Builder Backend listening on port ${PORT}`);
});
