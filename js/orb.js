// ORB: THE ETERNAL GUIDE — renderer (spec §5).
// One WebGL fragment shader ray-traces a perfect sphere of black glass with a
// volumetric spiral galaxy, nebulae, stars, asteroids, shooting stars and
// neon-blue lightning INSIDE, and a hot-pink flame halo OUTSIDE the perimeter.
// A single canvas is re-parented into whichever screen slot is active, so ORB
// looks identical everywhere. Canvas2D fallback if WebGL is unavailable.

const VERT = `attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision highp float;
varying vec2 v;
uniform vec2 uRes; uniform float uT; uniform float uSpeak; uniform float uBright; uniform float uLite;
#define R 0.50
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float h11(float n){return fract(sin(n*127.1)*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm2(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n2(p);p=p*2.03+17.1;a*=.5;}return s;}
float fbm3(vec3 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*n3(p);p=p*2.07+11.3;a*=.5;}return s;}
float fbm2s(vec2 p){return .65*n2(p)+.35*n2(p*2.03+17.1);}   // cheap 2-octave version for flame sway
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}

// Cellular (Voronoi) edge distance: small along cell borders -> crackle vein network.
float cellEdge(vec2 x){
  vec2 n=floor(x),f=fract(x); float f1=8.,f2=8.;
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
    vec2 g=vec2(float(i),float(j)); vec2 o=vec2(h21(n+g),h21(n+g+19.7));
    float dd=length(g+o-f); if(dd<f1){f2=f1;f1=dd;}else if(dd<f2)f2=dd; }
  return f2-f1;
}
// One flame tongue column: crisp licking shape that narrows and sways as it rises.
float tongue(float th,float r1,float N,float seed,float t){
  float u=th/6.28318*N; float id=mod(floor(u),N);
  float x=fract(u)-.5;
  x+=1.5*(fbm2s(vec2(r1*2.6-t*1.5,id*1.7+seed))-.5)*min(r1*2.,1.4);
  x+=.25*sin(r1*9.-t*4.+id*2.1)*r1;   // curl near the tips
  float hgt=.3+.7*pow(n2(vec2(id*2.3+seed,t*.6)),1.2);
  float w=.5*pow(max(1.-r1/hgt,0.),.9);
  return smoothstep(w,max(w-.2,0.),abs(x))*step(r1,hgt);
}
// Jagged two-octave displacement along a bolt.
float jag(float s,float seed,float t){
  float k=s*9.; float a=mix(h11(floor(k)+seed*13.)-.5,h11(floor(k)+1.+seed*13.)-.5,fract(k));
  float k2=s*27.+floor(t*9.)*3.1; float b=mix(h11(floor(k2)+seed*7.)-.5,h11(floor(k2)+1.+seed*7.)-.5,fract(k2));
  float k3=s*70.; float c3=mix(h11(floor(k3)+seed*3.)-.5,h11(floor(k3)+1.+seed*3.)-.5,fract(k3));
  return a*.2+b*.07+c3*.025;
}
// One fractal bolt from A to B with three forked branches (each with its own jag). Core returned, glow via out.
float bolt(vec2 q,vec2 A,vec2 B,float seed,float t,out float glow){
  vec2 ab=B-A; float L=length(ab); vec2 dir=ab/L; vec2 nr=vec2(-dir.y,dir.x);
  vec2 w=q-A; float s=dot(w,dir)/L; float y=dot(w,nr);
  glow=0.;
  if(s<-.25||s>1.25||abs(y)>.6*L+.05) return 0.;   // cheap reject far from the bolt
  float ends=smoothstep(-.02,.03,s)*smoothstep(1.02,.95,s);
  float sc=clamp(s,0.,1.);
  float env=sin(sc*3.14159)*.8+.2;
  float off=jag(sc,seed,t)*env*L;
  float d=abs(y-off);
  float c=exp(-d*60.)*ends; float g=exp(-d*20.)*ends;
  for(int j=0;j<3;j++){
    float fj=float(j);
    float bs=.15+.6*h11(seed*3.+fj*5.);
    float side=h11(seed*5.+fj*2.)>.5?1.:-1.;
    float sb=sc-bs; float len=.18+.22*h11(seed+fj*4.);
    float m=smoothstep(-.005,.02,sb)*smoothstep(len,len*.6,sb);
    float bj=jag(sb*1.7,seed+fj*9.,t)*.5*L;
    float db=abs(y-off-side*max(sb,0.)*(.7+.5*h11(seed+fj))*L-bj);
    c+=.8*exp(-db*85.)*m; g+=.5*exp(-db*28.)*m;
  }
  glow=g;
  return c;
}

void main(){
  vec2 p=v*2.-1.;
  p.y-=sin(uT*1.1)*.02;                 // gentle bob
  float d=length(p);
  float px=2.5/uRes.x;
  float t=uT;
  vec3 col=vec3(0.); float alpha=0.;
  vec2 dir=p/max(d,1e-4);

  // ================= FLAMES around the whole perimeter =================
  float rr=d-R;
  float up=.5+.5*dir.y;                            // tallest on top, still present underneath
  float H=R*(.40+.42*up)*(1.+.4*uSpeak)*(1.+.15*sin(t*2.3));   // Ty's orb1 tuning: bigger speak swell + breathing pulse          // flame reach
  if(rr>-.04&&rr<H*1.15){
    float r1=max(rr,0.)/H;
    float sp=1.7+uSpeak*1.5;
    float th=atan(dir.x,dir.y)+3.14159;
    float tg=max(max(tongue(th,r1,26.,0.,t*sp),.9*tongue(th+.11,r1*1.12,39.,5.,t*sp*1.2)),.7*tongue(th+.05,r1*1.5,57.,9.,t*sp*1.4));
    float nz=fbm3(vec3(dir*3.,r1*2.5-t*sp));
    float base=smoothstep(.3,.0,r1+(.5-nz)*.3);
    float edge=clamp(tg*(1.-tg)*4.,0.,1.)*smoothstep(0.,.08,r1);   // bright licking outline of each tongue
    float fl=max(tg*(.45+.5*nz)*(1.-.45*r1),base);                  // translucent crimson body
    float glowF=exp(-r1*3.5)*.35;                                    // soft hot glow binding the tongues together
    float vein=0.;
    if(uLite<.5&&tg+base>.02){ vec2 vc=vec2(th*12.,r1*9.-t*sp*1.1)+(nz-.5)*1.6; float ce=cellEdge(vc); vein=smoothstep(.07,.0,ce)*smoothstep(.05,.35,fl)*(1.-.35*r1); }
    vec3 fc=vec3(.7,0.,.14)*fl*.6+vec3(1.,.06,.3)*edge*.8+vec3(1.,.28,.55)*vein*1.1+vec3(.8,0.,.2)*glowF;
    float fa=clamp((fl*.55+edge*.55+vein*.6+glowF)*(.95+.3*nz+.4*uSpeak),0.,1.)*uBright;
    float cf=smoothstep(1.,.93,max(abs(p.x),abs(p.y)));   // never hard-clip at the canvas edge
    fa*=cf;
    col=fc*1.6*uBright*cf; alpha=min(fa*1.1,1.);
  }
  // sparks drifting up
  if(d>R&&d<R+.42){
    vec2 g=(p+vec2(0.,-t*.08))*30.; vec2 ci=floor(g); float hh=h21(ci);
    if(hh>.955){ float sd=length(fract(g)-.5); float sp2=smoothstep(.14,0.,sd)*(.5+.5*sin(t*4.+hh*50.))*(1.-(d-R)/.42);
      col+=vec3(1.,.35,.7)*sp2; alpha=max(alpha,sp2);}
  }
  float ring=exp(-abs(d-R)*45.);   // soft glow under the rim line (outside)
  col+=vec3(1.,.1,.45)*ring*.8*uBright; alpha=max(alpha,ring*.9);

  // ================= BLACK GLASS SPHERE =================
  float inside=1.-smoothstep(R-px,R+px*.5,d);
  if(inside>0.){
    vec2 q=p/R; float z=sqrt(max(1.-dot(q,q),0.));
    vec3 n=vec3(q,z);
    vec2 qi=q*(1.-.12*(1.-z));                    // lensing
    vec3 ic=vec3(.012,.01,.04);
    // deep space haze
    float hz=fbm2s(qi*2.4+vec2(t*.02,0.));
    ic+=vec3(.2,.03,.34)*smoothstep(.55,.9,hz)*.6+vec3(.01,.01,.05)*hz;
    // stars
    vec2 s1=rot(t*.02)*qi*34.; vec2 c1=floor(s1); float r1=h21(c1);
    vec2 o1=vec2(h21(c1+1.3),h21(c1+5.1))-.5;
    ic+=vec3(.9,.85,1.)*step(.72,r1)*smoothstep(.09,0.,length(fract(s1)-.5-o1*.6))*(.55+.45*sin(t*(1.+r1*4.)+r1*30.))*1.3;
    if(uLite<.5){ vec2 s2=rot(t*.012)*qi*75.+7.; float r2=h21(floor(s2));
      ic+=vec3(.8,.75,1.)*step(.7,r2)*smoothstep(.13,0.,length(fract(s2)-.5))*.55;
      vec2 s3=qi*140.+3.; float r3=h21(floor(s3)); ic+=vec3(.9,.8,1.)*step(.8,r3)*smoothstep(.2,0.,length(fract(s3)-.5))*.3; }

    // ---- tilted spiral galaxy (inclined disk, long axis lower-left -> upper-right) ----
    vec2 g=rot(.45)*qi/1.08; g.y/=.5;                  // inclination
    float r=length(g);
    vec2 gr=rot(t*.16)*g;
    float ang=atan(gr.y,gr.x);
    float lr=log(r+.03);
    float spi=cos(2.*ang-7.5*lr);
    float spi2=cos(4.*ang-15.*lr+1.3);
    float arms=(.05+.95*pow(.5+.5*spi,3.))*(.75+.25*pow(.5+.5*spi2,2.));
    float grain=.35+1.3*n2(gr*38.)*n2(gr*17.+3.);   // star-cloud grain so arms read as clumps of stars, not a smooth ring
    float lane=pow(.5+.5*cos(2.*ang-7.5*lr+1.4),10.)*(.6+.4*n2(gr*5.+7.));   // dark dust lanes on the inner edge of each arm
    float clump=fbm2(gr*6.);
    float dust=smoothstep(.45,.8,fbm2s(gr*9.+3.));
    float disk=exp(-r*.8)*smoothstep(1.05,.55,r);
    float a=arms*disk*grain*(.55+.9*clump)*(1.-.45*dust*smoothstep(.1,.3,r))*(1.-.85*lane*smoothstep(.18,.38,r));
    vec3 armC=mix(vec3(1.,.5,.25),vec3(1.,.12,.5),smoothstep(.15,.5,r));
    armC=mix(armC,mix(vec3(1.,.05,.55),vec3(1.,.35,.8),clump),smoothstep(.25,.55,r));   // hot-pink/magenta arms (orb1)
    armC=mix(armC,vec3(.55,.12,.85),smoothstep(.75,1.,r));
    ic+=armC*a*6.;
    ic+=vec3(.6,.06,.45)*disk*.1;                  // diffuse disk glow
    ic+=vec3(.35,.05,.5)*smoothstep(.45,.85,fbm2s(qi*3.1+vec2(2.,t*.03)))*exp(-r*.6)*.5;   // purple dust clouds
    ic+=vec3(1.,.62,.42)*exp(-r*4.)*1.9;   // peach bulge
    ic+=vec3(1.,.93,.86)*exp(-r*r*32.)*3.4;                // white core (orb1 strength)
    ic+=vec3(1.)*exp(-r*r*400.)*2.;
    vec2 sg=gr*48.; float sh=h21(floor(sg));
    ic+=vec3(1.,.85,.95)*step(.82,sh)*smoothstep(.3,0.,length(fract(sg)-.5))*arms*disk*3.5;

    // ---- neon-blue lightning INSIDE the glass ----
    float nb=uLite>.5?3.:6.;
    vec3 lc=vec3(0.);
    for(int i=0;i<6;i++){
      float fi=float(i); if(fi>=nb) break;
      float per=2.6+h11(fi*2.3)*1.8;
      float k=t/per+fi*.29; float id=floor(k); float ph=fract(k);
      float sd=id*7.13+fi*3.7;
      float on=smoothstep(0.,.03,ph)*smoothstep(1.,.93,ph);   // each bolt is lit ~90% of its cycle, so several show in any frame
      on*=.8+.2*step(.25,h11(floor(t*14.)+fi));   // flicker
      float a1=fi*1.047+h11(sd)*1.2; float a2=a1+2.5+h11(sd+1.)*1.3;   // spread start points round the rim, end across the sphere
      vec2 A=vec2(cos(a1),sin(a1))*.98;
      vec2 B=vec2(cos(a2),sin(a2))*(.55+.4*h11(sd+2.));
      float gl; float c=bolt(qi,A,B,sd,t,gl);
      lc+=on*(c*vec3(.16,.26,1.)*1.8+c*c*vec3(.5,.6,1.)*.6+gl*vec3(.1,.12,1.)*.55+gl*gl*vec3(.5,.08,1.)*.2);
    }
    ic+=lc*(1.+.5*uSpeak)*smoothstep(.985,.84,length(qi))*(.45+.55*smoothstep(.12,.42,length(qi)))*1.35;   // bolts thin out over the bright core

    // ---- glass ----
    vec3 gc=ic*(.55+.45*pow(z,.5))*uBright;
    float fres=pow(1.-z,3.);
    gc+=vec3(.6,.1,.45)*fres*.55;                  // pink flame reflection in the rim
    // crisp curved specular arcs along the rim (upper-left strong, lower-right faint) + hotspot
    vec2 qn=q/max(length(q),1e-4);
    float band=smoothstep(.14,.19,z)*(1.-smoothstep(.22,.28,z));
    float arc=band*pow(max(dot(qn,normalize(vec2(-.62,.78))),0.),5.);
    float arc2=band*pow(max(dot(qn,normalize(vec2(.7,-.7))),0.),9.)*.35;
    float spec=pow(max(dot(n,normalize(vec3(-.45,.6,.66))),0.),380.)*2.4;
    gc+=vec3(1.,.55,.8)*arc*.5+vec3(1.)*spec+vec3(1.,.5,.8)*arc2;
    // sharp curved reflection: a thin crescent hugging the upper-left glass, plus a short inner streak
    float lq=length(q);
    float cr=abs(lq-.93);
    float crM=smoothstep(.7,.95,dot(qn,normalize(vec2(-.5,.86))));
    float cres=exp(-cr*cr*12000.)*crM;
    float cr2=abs(length(q-vec2(.05,-.06))-.86);
    float cres2=exp(-cr2*cr2*20000.)*smoothstep(.8,.97,dot(qn,normalize(vec2(-.72,.69))))*.8;
    gc+=vec3(1.,.95,.98)*(cres*1.5+cres2);
    gc+=vec3(.9,.3,.6)*smoothstep(.86,.94,lq)*smoothstep(1.,.96,lq)*(.1+.18*max(dot(qn,normalize(vec2(-.6,.8))),0.));   // translucent glass lip
    gc+=vec3(1.)*pow(max(dot(n,normalize(vec3(-.3,.45,.84))),0.),30.)*.035;
    col=mix(col,gc,inside);
    alpha=mix(alpha,1.,inside);
  }
  // crisp thin hot-pink rim line where the flames meet the glass (drawn over the glass edge)
  float rimL=exp(-abs(d-R+px*.8)*200.)*uBright;
  col+=vec3(1.,.2,.55)*rimL*2.2; alpha=max(alpha,rimL);
  col=1.-exp(-col*1.3);
  alpha=clamp(alpha,0.,1.);
  gl_FragColor=vec4(min(col,vec3(alpha)),alpha);
}`;

class OrbRenderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'orb-canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'ORB, the Eternal Guide');
    this.speak = 0; this.speakTarget = 0; this.bright = 1; this.flash = 0;
    this.quality = 1; this.fps = 60; this.reduceMotion = false; this.dyn = 1; this.avg = 16; this.nf = 0;
    this.mode = 'none'; this.t0 = performance.now(); this.last = 0; this.running = false;
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
      this.u = { res: gl.getUniformLocation(prog, 'uRes'), t: gl.getUniformLocation(prog, 'uT'), speak: gl.getUniformLocation(prog, 'uSpeak'), bright: gl.getUniformLocation(prog, 'uBright'), lite: gl.getUniformLocation(prog, 'uLite') };
      this.gl = gl; this.mode = 'webgl';
      this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.fallbackAfterLoss(); });
      return true;
    } catch (err) {
      console.warn('ORB WebGL unavailable, using Canvas2D fallback:', err.message);
      this.gl = null; return false;
    }
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
    this.dots = Array.from({ length: 420 }, (_, i) => {
      const arm = i % 2, r = Math.pow(Math.random(), 0.7);
      return { arm, r, off: (Math.random() - 0.5) * 0.5, s: Math.random() };
    });
  }
  setOptions({ quality, fps, reduceMotion }) {
    if (quality) this.quality = { low: 0.55, medium: 0.8, high: 1 }[quality] || 1;
    if (fps) this.fps = fps;
    if (reduceMotion !== undefined) this.reduceMotion = reduceMotion;
    this.lite = this.reduceMotion || this.quality < 0.6;   // lighter shader path
    this.resize();
  }
  mount(el) {
    if (!el) return;
    if (this.canvas.parentNode !== el) el.appendChild(this.canvas);
    this.resize(); this.start();
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
      gl.uniform1f(this.u.t, t + 20); gl.uniform1f(this.u.speak, this.speak); gl.uniform1f(this.u.bright, this.bright); gl.uniform1f(this.u.lite, this.lite ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else this.draw2D(t);
  }
  draw2D(t) {
    const c = this.canvas, g = this.ctx2d, W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2 + Math.sin(t * 1.15) * H * 0.015, R = W * 0.31;
    // halo
    const hs = R * (0.15 + 0.3 * this.speak);
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2, fl = (Math.sin(t * 3 + i * 1.7) + Math.sin(t * 5.3 + i * 0.9)) * 0.25 + 0.6;
      const up = 1 + 0.4 * Math.max(0, -Math.sin(a));
      const len = hs * fl * up;
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      const gr = g.createRadialGradient(x, y, 0, x, y, len);
      gr.addColorStop(0, `rgba(255,30,130,${0.35 + 0.25 * this.speak})`); gr.addColorStop(1, 'rgba(90,0,40,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, len, 0, Math.PI * 2); g.fill();
    }
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#030106'; g.fillRect(0, 0, W, H);
    const neb = g.createRadialGradient(cx - R * 0.3, cy + R * 0.2, 0, cx, cy, R);
    neb.addColorStop(0, 'rgba(90,20,140,0.55)'); neb.addColorStop(1, 'rgba(20,0,30,0)');
    g.fillStyle = neb; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (const d of this.dots) {
      const ang = d.arm * Math.PI + Math.log(d.r + 0.05) * 2.6 + t * 0.18 + d.off;
      const x = cx + Math.cos(ang) * d.r * R * 0.9, y = cy + Math.sin(ang) * d.r * R * 0.45;
      g.fillStyle = d.s > 0.8 ? 'rgba(255,255,255,0.8)' : `rgba(255,${40 + d.s * 80 | 0},170,${0.5 * (1 - d.r)})`;
      g.fillRect(x, y, 1.6 * W / 300, 1.6 * W / 300);
    }
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.25);
    core.addColorStop(0, 'rgba(255,255,255,1)'); core.addColorStop(0.3, 'rgba(255,120,200,0.6)'); core.addColorStop(1, 'rgba(255,0,120,0)');
    g.fillStyle = core; g.fillRect(0, 0, W, H);
    // lightning
    const id = Math.floor(t * 1.5);
    g.strokeStyle = 'rgba(120,190,255,0.9)'; g.lineWidth = W / 300 * 1.4; g.shadowColor = '#3d8bff'; g.shadowBlur = 8;
    g.beginPath();
    const a1 = (Math.sin(id * 12.9) * 0.5 + 0.5) * Math.PI * 2;
    let x = cx + Math.cos(a1) * R * 0.75, y = cy + Math.sin(a1) * R * 0.75;
    g.moveTo(x, y);
    for (let i = 1; i <= 10; i++) { x += (cx - x) / (11 - i) * 1.6 + (Math.random() - 0.5) * R * 0.15; y += (cy - y) / (11 - i) * 1.2 + (Math.random() - 0.5) * R * 0.15; g.lineTo(x, y); }
    if ((t * 1.5) % 1 < 0.5) g.stroke();
    g.shadowBlur = 0; g.globalCompositeOperation = 'source-over';
    const glass = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, R);
    glass.addColorStop(0, 'rgba(0,0,0,0)'); glass.addColorStop(1, 'rgba(0,0,0,0.6)');
    g.fillStyle = glass; g.fillRect(0, 0, W, H);
    const hl = g.createRadialGradient(cx - R * 0.3, cy - R * 0.55, 0, cx - R * 0.3, cy - R * 0.55, R * 0.45);
    hl.addColorStop(0, 'rgba(255,255,255,0.75)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.fillRect(0, 0, W, H);
    g.restore();
  }
}

export const Orb = new OrbRenderer();
