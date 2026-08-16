import './styles/global.css';
import { CanvasPlayer } from './components/CanvasPlayer';
import { HudOverlay } from './components/HudOverlay';
import { SplatterTransition } from './effects/transition';
import { CursorWebGL } from './effects/cursor';

let TOTAL_FRAMES = 1;
let currentConfig = null;
let currentDevice = 'desktop';
let canvasPlayerInstance = null;
let hudOverlayInstance = null;
let cursorInstance = null;

async function fetchConfig() {
  try {
    const res = await fetch('http://localhost:3003/api/config/site-1');
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch config from backend, using fallback.', err);
    return {
      desktop: {
        scroll: { speedMultiplier: 1.5 },
        cards: [
          { id: 'panel-1', content: 'Fallback Mode', opacity: 0.85, position: { top: '20%', left: '10%' }, timing: { startProgress: 0.05, endProgress: 0.25 } }
        ],
        effects: { preloader: { enabled: true }, pageTransition: { type: 'none' }, cursorHover: { enabled: false } }
      },
      mobile: {
        scroll: { speedMultiplier: 1.0 },
        cards: [
          { id: 'panel-1', content: 'Fallback Mode', opacity: 0.85, position: { top: '20%', left: '10%' }, timing: { startProgress: 0.05, endProgress: 0.25 } }
        ],
        effects: { preloader: { enabled: true }, pageTransition: { type: 'none' }, cursorHover: { enabled: false } }
      }
    };
  }
}

function generateCardsDOM(cardsConfig) {
  const container = document.getElementById('panels-container');
  if (!container) return;
  container.innerHTML = '';

  cardsConfig.forEach((card) => {
    const el = document.createElement('div');
    el.className = 'hud-panel glass-panel p-8 md:p-12 max-w-2xl text-center absolute pointer-events-auto';
    el.id = card.id;
    el.dataset.start = `${card.timing.startProgress * 100}%`;
    el.dataset.end = `${card.timing.endProgress * 100}%`;
    el.style.top = card.position.top;
    el.style.left = card.position.left;
    el.style.opacity = '0';
    el.innerHTML = `<h2 class="text-3xl md:text-5xl font-semibold mb-4 tracking-tight">${card.content}</h2>`;
    container.appendChild(el);
  });
}

function handleResizeAndMatchMedia() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const newDevice = isMobile ? 'mobile' : 'desktop';
  if (newDevice !== currentDevice) {
    currentDevice = newDevice;
    applyConfig(currentConfig[currentDevice]);
  }
}

function applyConfig(deviceConfig) {
  generateCardsDOM(deviceConfig.cards);

  if (hudOverlayInstance) hudOverlayInstance.destroy();
  hudOverlayInstance = new HudOverlay();
  hudOverlayInstance.initScrollTrigger('#track-container');

  const track = document.getElementById('track-container');
  if (track) track.style.height = `${500 * deviceConfig.scroll.speedMultiplier}vh`;

  // Cursor WebGL
  const cursorConfig = deviceConfig.effects?.cursorHover;
  if (cursorConfig?.enabled) {
    if (!cursorInstance) {
      cursorInstance = new CursorWebGL(cursorConfig);
      cursorInstance.init();
    } else {
      cursorInstance.updateSettings(cursorConfig.fluidSettings);
    }
  } else if (cursorInstance) {
    cursorInstance.destroy();
    cursorInstance = null;
  }

  // Splatter transition
  const transitionConfig = deviceConfig.effects?.pageTransition;
  if (transitionConfig?.type === 'splatter') {
    const splatter = new SplatterTransition(transitionConfig);
    splatter.init();
  }
}

async function init() {
  // Hide loader immediately — no more blocking preload
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';

  currentConfig = await fetchConfig();
  currentDevice = window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';

  // Get actual frame count from backend
  try {
    const seqRes = await fetch('http://localhost:3003/api/sequence-info');
    const seqData = await seqRes.json();
    if (seqData.totalFrames) TOTAL_FRAMES = seqData.totalFrames;
  } catch (err) {
    console.warn('Could not fetch sequence info, defaulting to 1');
  }

  // CanvasPlayer now loads frames on-demand (no preloader wait)
  canvasPlayerInstance = new CanvasPlayer('scroll-canvas', '/sequence', TOTAL_FRAMES);
  canvasPlayerInstance.initScrollTrigger('#track-container');

  applyConfig(currentConfig[currentDevice]);

  window.addEventListener('resize', handleResizeAndMatchMedia);

  // Listen for live config updates from the editor (postMessage)
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'CONFIG_UPDATE' && currentConfig) {
      currentConfig = event.data.config;
      applyConfig(currentConfig[currentDevice]);
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
