import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class CanvasPlayer {
  constructor(canvasId, preloader) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas with id ${canvasId} not found`);
    
    this.context = this.canvas.getContext('2d');
    this.preloader = preloader;
    this.frames = this.preloader.images;
    this.totalFrames = this.frames.length;
    
    this.state = {
      currentFrame: 0,
      targetFrame: 0
    };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.renderCurrentFrame();
  }

  drawImageContain(img) {
    const canvasRatio = this.canvas.width / this.canvas.height;
    const imgRatio = img.width / img.height;
    let w, h, x, y;

    // Use 'cover' layout to fill screen without black bars
    if (canvasRatio > imgRatio) {
      w = this.canvas.width;
      h = w / imgRatio;
      x = 0;
      y = (this.canvas.height - h) / 2;
    } else {
      h = this.canvas.height;
      w = h * imgRatio;
      x = (this.canvas.width - w) / 2;
      y = 0;
    }
    
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(img, x, y, w, h);
  }

  renderCurrentFrame() {
    const index = Math.round(this.state.currentFrame);
    // Ensure index is within bounds and image is loaded
    if (index >= 0 && index < this.totalFrames && this.frames[index] && this.frames[index].complete) {
      this.drawImageContain(this.frames[index]);
    }
  }

  initScrollTrigger(triggerElementId) {
    ScrollTrigger.create({
      trigger: triggerElementId,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        this.state.targetFrame = self.progress * (this.totalFrames - 1);
      }
    });

    this.renderLoop();
  }

  renderLoop() {
    // Spring physics / easing logic for Apple-like smoothness
    // Eases the current frame towards target frame
    const delta = this.state.targetFrame - this.state.currentFrame;
    
    // Only apply easing and re-render if there's a meaningful change
    if (Math.abs(delta) > 0.001) {
      this.state.currentFrame += delta * 0.15; // Damping factor
      this.renderCurrentFrame();
    }

    requestAnimationFrame(() => this.renderLoop());
  }
}
