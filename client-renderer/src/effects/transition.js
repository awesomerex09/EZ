import { gsap } from 'gsap';

export class SplatterTransition {
  constructor(config) {
    this.config = config;
    this.overlay = null;
  }

  init() {
    if (!this.config || !this.config.enabled || this.config.type !== 'splatter') return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'splatter-overlay';
    
    // Inline CSS for the splatter overlay using CSS radial-gradient to simulate mask
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: '9999',
      pointerEvents: 'none',
      maskImage: 'radial-gradient(circle, transparent var(--progress), black calc(var(--progress) + 5%))',
      WebkitMaskImage: 'radial-gradient(circle, transparent var(--progress), black calc(var(--progress) + 5%))',
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%',
      '--progress': '0%'
    });
    
    document.body.appendChild(this.overlay);

    gsap.to(this.overlay, {
      '--progress': '100%',
      duration: this.config.duration || 1.5,
      ease: 'power3.inOut',
      onComplete: () => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
      }
    });
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
