export class CursorWebGL {
  constructor(config) {
    this.config = config || {};
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.targetMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    this.onMouseMove = this.onMouseMove.bind(this);
    this.render = this.render.bind(this);
  }

  init() {
    if (!this.config.enabled) return;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'webgl-cursor';
    Object.assign(this.canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '9998'
    });
    
    document.body.appendChild(this.canvas);
    this.gl = this.canvas.getContext('webgl');
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', this.onMouseMove);

    this.setupWebGL();
    this.updateSettings(this.config.fluidSettings);
    requestAnimationFrame(this.render);
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  onMouseMove(e) {
    this.targetMouse.x = e.clientX;
    this.targetMouse.y = window.innerHeight - e.clientY; // WebGL y is inverted
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 1, b: 1 };
  }

  setupWebGL() {
    const gl = this.gl;
    
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform vec3 u_color;
      uniform float u_radius;
      uniform float u_pressure;
      
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec2 mouse = u_mouse / u_resolution.xy;
        
        // Aspect ratio correction
        st.x *= u_resolution.x / u_resolution.y;
        mouse.x *= u_resolution.x / u_resolution.y;
        
        float dist = distance(st, mouse);
        
        // Basic glow
        float glow = u_radius / (dist * dist * 100.0) * u_pressure;
        glow = clamp(glow, 0.0, 1.0);
        
        gl_FragColor = vec4(u_color * glow, glow * 0.5); // Add alpha
      }
    `;
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);
    
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    gl.useProgram(this.program);
    
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0
    ]), gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, "u_resolution"),
      mouse: gl.getUniformLocation(this.program, "u_mouse"),
      color: gl.getUniformLocation(this.program, "u_color"),
      radius: gl.getUniformLocation(this.program, "u_radius"),
      pressure: gl.getUniformLocation(this.program, "u_pressure")
    };
  }

  updateSettings(fluidSettings) {
    if (!this.gl || !this.program || !fluidSettings) return;
    const gl = this.gl;
    
    const rgb = this.hexToRgb(fluidSettings.color || "#00ffcc");
    
    gl.useProgram(this.program);
    gl.uniform3f(this.uniforms.color, rgb.r, rgb.g, rgb.b);
    gl.uniform1f(this.uniforms.pressure, fluidSettings.pressure || 0.8);
    gl.uniform1f(this.uniforms.radius, fluidSettings.radius || 0.2);
  }

  render() {
    if (!this.gl || !this.canvas) return;
    
    // LERP mouse for smooth movement
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.1;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.1;

    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0); // Transparent background
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms.mouse, this.mouse.x, this.mouse.y);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    requestAnimationFrame(this.render);
  }

  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    this.gl = null;
    this.canvas = null;
  }
}
