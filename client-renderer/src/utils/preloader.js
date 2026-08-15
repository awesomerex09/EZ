export class Preloader {
  /**
   * @param {string} sequencePath - The base path to the images (e.g. '/sequence')
   * @param {number} totalFrames - Total number of frames to load
   * @param {number} padding - Number padding (e.g. 4 for 0001)
   */
  constructor(sequencePath, totalFrames, padding = 4) {
    this.sequencePath = sequencePath;
    this.totalFrames = totalFrames;
    this.padding = padding;
    this.images = [];
  }

  getFramePath(index) {
    // 1-indexed frames (frame_0001.webp)
    const frameNumber = (index + 1).toString().padStart(this.padding, '0');
    return `${this.sequencePath}/frame_${frameNumber}.webp`;
  }

  async preload(onProgress = null) {
    return new Promise((resolve) => {
      let loaded = 0;
      
      if (this.totalFrames === 0) {
        resolve(this.images);
        return;
      }

      for (let i = 0; i < this.totalFrames; i++) {
        const img = new Image();
        const src = this.getFramePath(i);
        
        const onLoadFinish = () => {
          loaded++;
          if (onProgress) onProgress(loaded / this.totalFrames);
          if (loaded === this.totalFrames) {
            resolve(this.images);
          }
        };

        img.onload = onLoadFinish;
        img.onerror = () => {
          console.warn(`Failed to load image: ${src}`);
          onLoadFinish();
        };

        img.src = src;
        this.images.push(img);
      }
    });
  }
}
