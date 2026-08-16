# EZ

EZ is a powerful, open-source visual web builder inspired by Framer and Apple's signature scrollytelling experiences. It empowers creators to build highly immersive, frame-by-frame interactive web experiences with true WYSIWYG (What You See Is What You Get) capabilities.

## 🌟 Key Features

- **True WYSIWYG Editor**: Directly drag, drop, and position typography and elements right onto the canvas. No more guessing how your layout will look in production.
- **Frame-Accurate Scrollytelling**: Instead of loading massive videos, EZ uses WebP image sequences combined with an intelligent on-demand LRU (Least Recently Used) cache to deliver 60fps buttery-smooth scroll animations with zero loading times.
- **Professional Timeline Scrubber**: A robust bottom timeline (similar to Adobe Premiere or After Effects) allows you to scrub through your entire animation frame by frame. Manage typography animations effortlessly across multiple tracks.
- **Dynamic WebGL Effects**: Built-in interactive effects, including fluid cursor interactions and splatter transitions, all customizable in real-time.
- **Responsive by Design**: Toggle between Mobile and Desktop views instantly to craft the perfect experience for every device.

## 🚀 Architecture

EZ consists of two tightly integrated layers:
1. **The Editor (`/builder-editor`)**: A React-based interface featuring a visual timeline, property panels, and a direct WebGL preview canvas.
2. **The Engine (`/client-renderer`)**: A high-performance GSAP and ScrollTrigger powered front-end engine that serves the final user experience.

Both are served from a unified Express backend, ensuring the editor seamlessly syncs data in real-time via REST APIs and WebSockets (postMessage).

## 🛠️ Quick Start

Starting EZ is incredibly simple. You only need to run a single server!

1. Install dependencies across all modules:
   ```bash
   cd builder-backend && npm install
   cd ../builder-editor && npm install
   cd ../client-renderer && npm install
   ```

2. Build the visual assets:
   ```bash
   cd builder-editor && npm run build
   cd ../client-renderer && npm run build
   ```

3. Start the Unified Server:
   ```bash
   cd builder-backend
   npm start
   ```

Now open your browser:
- **Editor**: [http://localhost:3003](http://localhost:3003)
- **Live Preview**: [http://localhost:3003/preview](http://localhost:3003/preview)

## 📁 File Structure

- `builder-backend/`: The Express.js server that acts as the source of truth, saving JSON configurations and serving the editor and preview endpoints.
- `builder-editor/`: The React-based CMS / Builder interface (Vite + Tailwind CSS).
- `client-renderer/`: The front-end Apple-style experience engine (GSAP + WebGL).

## 📝 License
MIT License
