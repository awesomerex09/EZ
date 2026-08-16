import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// LRU Cache for loaded frames — keeps last N frames in memory
class LRUCache {
  constructor(maxSize = 64) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    // Move to end (most recently used)
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first key)
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }
}

export class CanvasPlayer {
  constructor(canvasId, sequencePath = '/sequence', totalFrames = 0) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas with id "${canvasId}" not found`);

    this.ctx = this.canvas.getContext('2d');
    this.sequencePath = sequencePath;
    this.totalFrames = totalFrames;

    this.state = {
      currentFrame: 0,
      targetFrame: 0,
      isRendering: false,
    };

    this.frameCache = new LRUCache(64);
    this.inFlight = new Set(); // Tracks frames currently being fetched

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.renderCurrentFrame();
  }

  getFrameUrl(index) {
    const frameNum = (index + 1).toString().padStart(4, '0');
    return `${this.sequencePath}/frame_${frameNum}.webp`;
  }

  // Load a single frame on-demand; resolves when image is ready
  async loadFrame(index) {
    if (index < 0 || index >= this.totalFrames) return null;
    if (this.frameCache.has(index)) return this.frameCache.get(index);
    if (this.inFlight.has(index)) return null; // Already fetching

    this.inFlight.add(index);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.frameCache.set(index, img);
        this.inFlight.delete(index);
        resolve(img);
      };
      img.onerror = () => {
        this.inFlight.delete(index);
        resolve(null);
      };
      img.src = this.getFrameUrl(index);
    });
  }

  // Pre-fetch a small lookahead window around the target frame
  prefetch(targetIndex, radius = 8) {
    for (let i = -radius; i <= radius; i++) {
      const idx = targetIndex + i;
      if (idx >= 0 && idx < this.totalFrames && !this.frameCache.has(idx)) {
        this.loadFrame(idx);
      }
    }
  }

  drawImageCover(img) {
    if (!img) return;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ir = img.width / img.height;
    const cr = cw / ch;

    let w, h, x, y;
    if (cr > ir) {
      w = cw; h = cw / ir; x = 0; y = (ch - h) / 2;
    } else {
      h = ch; w = ch * ir; x = (cw - w) / 2; y = 0;
    }
    this.ctx.clearRect(0, 0, cw, ch);
    this.ctx.drawImage(img, x, y, w, h);
  }

  renderCurrentFrame() {
    const index = Math.round(this.state.currentFrame);
    const img = this.frameCache.get(index);
    if (img) {
      this.drawImageCover(img);
    }
    // Kick off loading if not cached yet
    if (!this.frameCache.has(index) && !this.inFlight.has(index)) {
      this.loadFrame(index).then(() => this.renderCurrentFrame());
    }
  }

  initScrollTrigger(triggerElementId) {
    ScrollTrigger.create({
      trigger: triggerElementId,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        this.state.targetFrame = Math.round(self.progress * (this.totalFrames - 1));
        this.prefetch(this.state.targetFrame);
      }
    });

    this.renderLoop();
  }

  renderLoop() {
    const delta = this.state.targetFrame - this.state.currentFrame;
    if (Math.abs(delta) > 0.5) {
      this.state.currentFrame += delta * 0.2;
      this.renderCurrentFrame();
    }
    requestAnimationFrame(() => this.renderLoop());
  }

  // For editor preview: jump directly to a specific frame index
  async seekTo(frameIndex) {
    const clamped = Math.max(0, Math.min(frameIndex, this.totalFrames - 1));
    this.state.currentFrame = clamped;
    this.state.targetFrame = clamped;
    const img = await this.loadFrame(clamped);
    if (img) this.drawImageCover(img);
    this.prefetch(clamped);
  }
}
