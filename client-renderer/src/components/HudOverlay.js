import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class HudOverlay {
  constructor() {
    this.triggers = [];
  }

  initScrollTrigger(triggerElementId) {
    // Re-query panels since they are dynamically injected
    this.panels = document.querySelectorAll('.hud-panel');
    
    this.panels.forEach((panel) => {
      const start = panel.dataset.start || "10%";
      const end = panel.dataset.end || "30%";

      // Animate In
      const inAnim = gsap.fromTo(panel, 
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1,
          ease: "elastic.out(1, 0.8)",
          scrollTrigger: {
            trigger: triggerElementId,
            start: `top+=${start} top`,
            end: `top+=${end} top`,
            scrub: 0.5,
          }
        }
      );
      this.triggers.push(inAnim.scrollTrigger);
      
      // Animate Out
      const outAnim = gsap.to(panel, {
        y: -50, opacity: 0, scale: 1.05,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: triggerElementId,
          start: `top+=${end} top`,
          end: `top+=${parseFloat(end) + 10}% top`, // Hardcode a 10% exit duration
          scrub: 0.5
        }
      });
      this.triggers.push(outAnim.scrollTrigger);
    });
  }

  destroy() {
    this.triggers.forEach(t => t && t.kill());
    this.triggers = [];
  }
}
