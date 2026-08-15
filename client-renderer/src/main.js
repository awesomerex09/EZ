import './styles/global.css';
import { Preloader } from './utils/preloader';
import { CanvasPlayer } from './components/CanvasPlayer';
import { HudOverlay } from './components/HudOverlay';
import { SplatterTransition } from './effects/transition';
import { WebGLFluidCursor } from './effects/cursor';

const TOTAL_FRAMES = 3960; 
let currentConfig = null;
let currentDevice = 'desktop';
let canvasPlayerInstance = null;
let hudOverlayInstance = null;
let preloaderInstance = null;

async function fetchConfig() {
  try {
    const res = await fetch('http://localhost:3003/api/config/site-1');
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch config from backend, using fallback.", err);
    return {
      desktop: {
        scroll: { speedMultiplier: 1.5 },
        cards: [
          { id: "panel-1", title: "Fallback Mode", text: "Please start the builder-backend.", start: "10%", end: "30%", duration: "10%" }
        ],
        effects: { cursorHover: false, pageTransition: "none" }
      },
      mobile: {
        scroll: { speedMultiplier: 1.0 },
        cards: [
          { id: "panel-1", title: "Fallback Mode", text: "Please start the builder-backend.", start: "10%", end: "30%", duration: "10%" }
        ],
        effects: { cursorHover: false, pageTransition: "none" }
      }
    };
  }
}

function generateCardsDOM(cardsConfig) {
  const container = document.getElementById('panels-container');
  container.innerHTML = ''; // Clear previous

  cardsConfig.forEach((card, index) => {
    const el = document.createElement('div');
    el.className = 'hud-panel glass-panel p-8 md:p-12 max-w-2xl text-center absolute pointer-events-auto';
    el.id = card.id;
    
    // Inject parameters as data attributes for GSAP to read
    el.dataset.start = `${card.timing.startProgress * 100}%`;
    el.dataset.end = `${card.timing.endProgress * 100}%`;

    // Apply styles
    el.style.top = card.position.top;
    el.style.left = card.position.left;
    el.style.opacity = '0'; // For GSAP

    el.innerHTML = `
      <h2 class="text-3xl md:text-5xl font-semibold mb-4 tracking-tight">${card.content}</h2>
    `;
    container.appendChild(el);
  });
}

function handleResizeAndMatchMedia() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const newDevice = isMobile ? 'mobile' : 'desktop';
  
  if (newDevice !== currentDevice) {
    currentDevice = newDevice;
    applyConfig(currentConfig[currentDevice]);
  }
}

function applyConfig(deviceConfig) {
  generateCardsDOM(deviceConfig.cards);
  
  // Clean up previous GSAP triggers if they exist
  if (hudOverlayInstance) {
    hudOverlayInstance.destroy(); // Needs to be implemented in HudOverlay
  }

  // Initialize UI Overlay with the new DOM elements
  hudOverlayInstance = new HudOverlay();
  hudOverlayInstance.initScrollTrigger('#track-container');
  
  // Re-adjust track height based on speed multiplier if needed
  const track = document.getElementById('track-container');
  track.style.height = `${500 * deviceConfig.scroll.speedMultiplier}vh`;

  // Apply Effects
  if (deviceConfig.effects.cursorHover) {
    WebGLFluidCursor.init();
  } else {
    WebGLFluidCursor.destroy();
  }

  if (deviceConfig.effects.pageTransition === "splatter") {
    SplatterTransition.init();
  }
}

async function init() {
  currentConfig = await fetchConfig();
  currentDevice = window.matchMedia("(max-width: 768px)").matches ? 'mobile' : 'desktop';

  const progressBar = document.getElementById('progress-bar');
  const loader = document.getElementById('loader');
  
  preloaderInstance = new Preloader('/sequence', TOTAL_FRAMES, 4);

  await preloaderInstance.preload((progress) => {
    if (progressBar) progressBar.style.width = `${progress * 100}%`;
  });

  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.remove();
      initExperience(currentConfig[currentDevice]);
    }, 500);
  } else {
    initExperience(currentConfig[currentDevice]);
  }
  
  window.addEventListener('resize', handleResizeAndMatchMedia);
}

function initExperience(deviceConfig) {
  canvasPlayerInstance = new CanvasPlayer('scroll-canvas', preloaderInstance);
  canvasPlayerInstance.initScrollTrigger('#track-container');
  
  applyConfig(deviceConfig);
}

window.addEventListener('DOMContentLoaded', init);
