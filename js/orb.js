// ORB: THE ETERNAL GUIDE — renderer (spec §5).
// Hybrid renderer built to match Ty's exact ORB reference (design-ref/orb-exact.jpg):
//  - texture layers derived from that reference by da-tools/make_orb_assets.py
//    (img/orb/: sphere interior, keyed flame ring, baked-lightning mask, static still),
//  - animated live in one WebGL fragment shader: the galaxy swirls slowly inside the
//    glass, the flame plumes flow outward with noise distortion + flicker and swell when
//    ORB speaks, the baked lightning flickers and thin procedural bolts strike on top,
//    the glass reflections stay fixed.
// A single canvas is re-parented into whichever screen slot is active, so ORB looks
// identical everywhere. Canvas2D fallback draws the static still.

const VERT = `attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision highp float;
varying vec2 v;
uniform vec2 uRes; uniform float uT; uniform float uSpeak; uniform float uBright; uniform float uLite; uniform float uReady;
uniform sampler2D uInt; uniform sampler2D uFl; uniform sampler2D uBolt;
#define R 0.62
#define E 1.36
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float h11(float n){return fract(sin(n*127.1)*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec2 toUV(vec2 q){return vec2(q.x*.5+.5,.5-q.y*.5);}   // [-1,1] (y up) -> texture uv (y down)

float jag(float s,float seed,float t){
  float k=s*9.; float a=mix(h11(floor(k)+seed*13.)-.5,h11(floor(k)+1.+seed*13.)-.5,fract(k));
  float k2=s*31.+floor(t*12.)*3.1; float b=mix(h11(floor(k2)+seed*7.)-.5,h11(floor(k2)+1.+seed*7.)-.5,fract(k2));
  return a*.18+b*.06;
}
// Thin forked bolt from A to B (reference lightning is thin and sparse).
float bolt(vec2 q,vec2 A,vec2 B,float seed,float t,out float glow){
  vec2 ab=B-A; float L=length(ab); vec2 dir=ab/L; vec2 nr=vec2(-dir.y,dir.x);
  vec2 w=q-A; float s=dot(w,dir)/L; float y=dot(w,nr);
  glow=0.;
  if(s<-.1||s>1.1||abs(y)>.45*L+.04) return 0.;
  float ends=smoothstep(-.02,.03,s)*smoothstep(1.02,.94,s);
  float sc=clamp(s,0.,1.);
  float off=jag(sc,seed,t)*(sin(sc*3.14159)*.8+.2)*L;
  float d=abs(y-off);
  float c=exp(-d*190.)*ends; float g=exp(-d*45.)*ends;
  for(int j=0;j<2;j++){
    float fj=float(j);
    float bs=.2+.55*h11(seed*3.+fj*5.); float side=h11(seed*5.+fj*2.)>.5?1.:-1.;
    float sb=sc-bs; float len=.15+.2*h11(seed+fj*4.);
    float m=smoothstep(-.005,.02,sb)*smoothstep(len,len*.5,sb);
    float db=abs(y-off-side*max(sb,0.)*.8*L-jag(sb*1.8,seed+fj*9.,t)*.4*L);
    c+=.7*exp(-db*230.)*m; g+=.4*exp(-db*55.)*m;
  }
  glow=g; return c;
}

void main(){
  vec2 p=v*2.-1.;
  float t=uT;
  p.y-=sin(t*1.1)*.012;                       // gentle float
  float d=length(p);
  float px=2./uRes.x;
  float ext=R*E;

  // ================= INTERIOR: galaxy + glass from the reference, animated =================
  vec3 ic=vec3(0.);
  float inside=1.-smoothstep(R-px*1.2,R+px*.3,d);
  if(inside>0.){
    vec2 q=p/R; float rq=length(q);
    // slow swirl of the galaxy; zero at the rim so the glass reflections stay fixed
    float sw=(.30*sin(t*.085)+.08*sin(t*.21+1.))*pow(smoothstep(.86,.0,rq),1.3);
    vec2 qs=rot(sw)*q;
    qs*=1.-.025*sin(t*.37)*smoothstep(.55,.0,rq);   // the core breathes a little
    ic=texture2D(uInt,toUV(qs)).rgb;
    // the baked lightning flickers region by region
    float bm=texture2D(uBolt,toUV(qs)).r;
    if(bm>.01){
      float nf=n2(qs*2.6+vec2(floor(t*7.)*1.7,floor(t*7.)*.9));   // regions switch on/off ~7x per second
      float fk=mix(.35,1.3,smoothstep(.35,.55,nf))*(.88+.12*sin(t*31.+qs.x*9.));
      ic=mix(ic,ic*fk,bm);
    }
    // a few star twinkles
    if(uLite<.5){ vec2 sg=qs*46.; vec2 ci=floor(sg); float hh=h21(ci);
      if(hh>.965){ float tw=pow(.5+.5*sin(t*(2.+hh*5.)+hh*60.),6.); ic+=vec3(1.,.85,1.)*tw*smoothstep(.22,0.,length(fract(sg)-.5))*.9; } }
    // thin, sparse procedural bolts striking on top
    float nb=uLite>.5?1.:3.;
    vec3 lc=vec3(0.);
    for(int i=0;i<3;i++){
      float fi=float(i); if(fi>=nb) break;
      float per=1.9+h11(fi*2.3)*1.6;
      float k=t/per+fi*.37; float id=floor(k); float ph=fract(k);
      float sd=id*7.13+fi*3.7;
      float on=step(h11(sd+9.),.6)*smoothstep(0.,.02,ph)*smoothstep(.45,.3,ph);   // lit ~35% of the time, some cycles skipped
      on*=.6+.4*step(.3,h11(floor(t*18.)+fi));
      if(on<=0.) continue;
      float a1=fi*2.1+h11(sd)*1.8; float a2=a1+2.3+h11(sd+1.)*1.4;
      vec2 A=vec2(cos(a1),sin(a1))*.95; vec2 B=vec2(cos(a2),sin(a2))*(.3+.5*h11(sd+2.));
      float gl; float c=bolt(qs,A,B,sd,t,gl);
      lc+=on*(c*vec3(.55,.75,1.)*1.6+gl*vec3(.1,.3,1.)*.55);
    }
    ic+=lc*(1.+.4*uSpeak)*smoothstep(.98,.85,rq);
    // Ty's specular (pow 380 x 2.4), kept as a subtle layer under the reference's own reflections
    float z=sqrt(max(1.-rq*rq,0.));
    ic+=vec3(1.)*pow(max(dot(vec3(q,z),normalize(vec3(-.36,.66,.66))),0.),380.)*2.4*.3;
    ic*=uBright;
  }

  // ================= FLAMES: keyed plume layer, flowing outward =================
  vec3 fc=vec3(0.); float fa=0.;
  if(d>R*.96&&d<1.){
    float th=atan(p.y,p.x);
    float swell=1.+.24*uSpeak+.04*sin(t*2.3);       // plumes swell when ORB speaks, breathe otherwise
    float rr=clamp((d-R)/(ext-R),0.,1.5);
    float w=smoothstep(0.,.3,rr);                     // the base stays attached to the glass
    float nA=n2(vec2(th*4.+t*.25,d*8.-t*1.5));
    float nB=n2(vec2(th*10.-t*.2,d*16.-t*2.3));
    float tw=((nA-.5)*.09+(nB-.5)*.035)*w;            // sideways billow
    float amp=.035;
    vec4 acc=vec4(0.);
    float np=uLite>.5?1.:2.;
    for(int k=0;k<2;k++){
      float fk=float(k); if(fk>=np) break;
      float ph=fract(t*.16+.5*fk);
      float wt=np>1.5?1.-abs(2.*ph-1.):1.;
      float off=np>1.5?ph*amp:0.;
      float ds=R+(d-R)/swell-off*w+(nA-.5)*.018*w;    // sample inward -> features drift outward
      float ths=th+tw+fk*.0;
      vec4 tx=texture2D(uFl,toUV(vec2(cos(ths),sin(ths))*ds/ext));
      acc+=vec4(tx.rgb*tx.a,tx.a)*wt;
    }
    float flick=.97+.22*(n2(vec2(th*5.,t*2.6))-.5)+.12*uSpeak;
    fc=acc.rgb*flick*uBright*(1.+.2*uSpeak); fa=clamp(acc.a*(.95+.1*flick),0.,1.);
    fa*=smoothstep(1.,.94,d); fc*=smoothstep(1.,.94,d);
  }

  vec3 col=fc+ic*inside*(1.-fa);
  float alpha=fa+inside*(1.-fa);
  gl_FragColor=vec4(col,alpha)*uReady;
}`;

const ASSET = (n) => new URL(`../img/orb/${n}`, import.meta.url).href;
export const ORB_ASSETS = ['orb-interior-1024.webp', 'orb-flames-1024.webp', 'orb-interior-512.webp', 'orb-flames-512.webp', 'orb-bolts-512.webp', 'orb-static-512.webp'];

class OrbRenderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'orb-canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'ORB, the Eternal Guide');
    this.speak = 0; this.speakTarget = 0; this.bright = 1; this.flash = 0;
    this.quality = 1; this.fps = 60; this.reduceMotion = false; this.dyn = 1; this.avg = 16; this.nf = 0;
    this.mode = 'none'; this.t0 = performance.now(); this.last = 0; this.running = false;
    this.ready = 0; this.texSize = 0; this.loading = null;
    this.initGL() || this.init2D();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()));
  }
  initGL() {
    try {
      const gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) return false;
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = { res: gl.getUniformLocation(prog, 'uRes'), t: gl.getUniformLocation(prog, 'uT'), speak: gl.getUniformLocation(prog, 'uSpeak'), bright: gl.getUniformLocation(prog, 'uBright'), lite: gl.getUniformLocation(prog, 'uLite'), ready: gl.getUniformLocation(prog, 'uReady') };
      gl.uniform1i(gl.getUniformLocation(prog, 'uInt'), 0); gl.uniform1i(gl.getUniformLocation(prog, 'uFl'), 1); gl.uniform1i(gl.getUniformLocation(prog, 'uBolt'), 2);
      this.tex = [gl.createTexture(), gl.createTexture(), gl.createTexture()];
      this.gl = gl; this.mode = 'webgl';
      this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.fallbackAfterLoss(); });
      return true;
    } catch (err) {
      console.warn('ORB WebGL unavailable, using Canvas2D fallback:', err.message);
      this.gl = null; return false;
    }
  }
  // Load the reference-derived layers (512 set for lite / small canvases, 1024 otherwise).
  ensureTextures() {
    if (this.mode !== 'webgl') return;
    const size = this.lite ? 512 : 1024;
    if (this.texSize >= size || this.loading === size) return;
    this.loading = size;
    const names = [`orb-interior-${size}.webp`, `orb-flames-${size}.webp`, 'orb-bolts-512.webp'];
    Promise.all(names.map((n) => { const im = new Image(); im.decoding = 'async'; im.src = ASSET(n); return im.decode().then(() => im); }))
      .then((imgs) => {
        if (this.mode !== 'webgl' || this.loading !== size) return;
        const gl = this.gl;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        imgs.forEach((im, i) => {
          gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.tex[i]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        });
        this.texSize = size; this.loading = null;
      })
      .catch((e) => { this.loading = null; console.warn('ORB textures failed to load', e); });
  }
  fallbackAfterLoss() {
    const old = this.canvas, parent = old.parentNode;
    this.canvas = document.createElement('canvas'); this.canvas.className = old.className;
    this.init2D(); this.ro.observe(this.canvas);
    if (parent) parent.replaceChild(this.canvas, old);
    this.resize();
  }
  init2D() {
    this.ctx2d = this.canvas.getContext('2d'); this.mode = '2d';
    this.still = new Image(); this.still.src = ASSET('orb-static-512.webp');
  }
  setOptions({ quality, fps, reduceMotion }) {
    if (quality) this.quality = { low: 0.55, medium: 0.8, high: 1 }[quality] || 1;
    if (fps) this.fps = fps;
    if (reduceMotion !== undefined) this.reduceMotion = reduceMotion;
    this.lite = this.reduceMotion || this.quality < 0.6;   // lighter shader path + 512 textures
    this.resize(); this.ensureTextures();
  }
  mount(el) {
    if (!el) return;
    if (this.canvas.parentNode !== el) el.appendChild(this.canvas);
    this.resize(); this.ensureTextures(); this.start();
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * this.quality * this.dyn;   // DPR capped at 2, scaled down if frames run slow
    const cap = this.lite ? 480 : 720;                                                  // and at most 720 px per side
    const w = Math.min(cap, Math.max(64, Math.round(r.width * dpr))), h = Math.min(cap, Math.max(64, Math.round(r.height * dpr)));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
  }
  setSpeaking(on) { this.speakTarget = on ? 1 : 0; }
  pulse() { this.flash = 1; }
  start() { if (this.running) return; this.running = true; requestAnimationFrame((t) => this.frame(t)); }
  stop() { this.running = false; }
  frame(now) {
    if (!this.running) return;
    requestAnimationFrame((t) => this.frame(t));
    if (!this.canvas.isConnected || !this.canvas.offsetParent) return;
    const minDt = 1000 / (this.reduceMotion ? Math.min(30, this.fps) : this.fps) - 2;
    if (now - this.last < minDt) return;
    const raw = now - this.last; const dt = Math.min(0.1, raw / 1000); this.last = now;
    // adaptive resolution: if frames keep arriving much slower than the target, render fewer pixels
    if (raw < 500) { this.avg = this.avg * 0.95 + raw * 0.05; if (++this.nf > 90 && this.avg > minDt * 1.7 && this.dyn > 0.4) { this.dyn = Math.max(0.4, this.dyn * 0.8); this.nf = 0; this.resize(); } }
    this.speak += (this.speakTarget - this.speak) * Math.min(1, dt * 4);
    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.bright = 1 + 0.12 * this.speak + 0.25 * this.flash;
    const t = ((now - this.t0) / 1000) * (this.reduceMotion ? 0.35 : 1);
    this.draw(t);
  }
  draw(t) {
    if (this.mode === 'webgl') {
      const gl = this.gl, c = this.canvas;
      gl.viewport(0, 0, c.width, c.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(this.u.res, c.width, c.height);
      if (this.texSize) this.ready = Math.min(1, this.ready + 0.08);
      gl.uniform1f(this.u.ready, this.ready);
      gl.uniform1f(this.u.t, t + 20); gl.uniform1f(this.u.speak, this.speak); gl.uniform1f(this.u.bright, this.bright); gl.uniform1f(this.u.lite, this.lite ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else this.draw2D(t);
  }
  draw2D(t) {
    const c = this.canvas, g = this.ctx2d, W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    if (!this.still.complete || !this.still.naturalWidth) return;
    // the still spans E sphere radii; the sphere radius on this canvas is R * W / 2 (R = 0.62, E = 1.36)
    const s = 0.62 * 1.36 * W * (1 + 0.015 * Math.sin(t * 1.3) + 0.04 * this.speak);
    g.globalAlpha = 0.92 + 0.08 * Math.sin(t * 2.3);
    g.drawImage(this.still, (W - s) / 2, (H - s) / 2 - Math.sin(t * 1.1) * H * 0.006, s, s);
    g.globalAlpha = 1;
  }
}

export const Orb = new OrbRenderer();
