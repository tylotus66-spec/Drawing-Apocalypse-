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
uniform vec2 uRes; uniform float uT; uniform float uSpeak; uniform float uBright;
#define R 0.62
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
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1,0,0,0,c,s,0,-s,c);}
mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0,-s,c,0,0,0,1);}

// distance from p to segment ab
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}

vec3 lightning(vec2 q,float t){
  vec3 c=vec3(0.);
  for(int i=0;i<3;i++){
    float fi=float(i);
    float rate=1.3+fi*.45;
    float id=floor(t*rate+fi*.37);
    float ph=fract(t*rate+fi*.37);
    float on=step(.25,h11(id*3.1+fi))*smoothstep(0.,.08,ph)*smoothstep(1.,.55,ph);
    on*=.65+.35*sin(t*73.+fi*9.);
    float a1=h11(id+fi*7.3)*6.2832, a2=a1+2.1+h11(id*1.7+fi)*2.2;
    vec2 A=vec2(cos(a1),sin(a1))*(.35+.5*h11(id*2.3+fi));
    vec2 B=vec2(cos(a2),sin(a2))*(.35+.5*h11(id*5.1+fi));
    vec2 ab=B-A; float L=length(ab); vec2 dir=ab/L; vec2 nrm=vec2(-dir.y,dir.x);
    vec2 w=q-A; float s=dot(w,dir)/L; float y=dot(w,nrm);
    if(s<-.02||s>1.02) continue;
    float env=sin(clamp(s,0.,1.)*3.14159);
    float off=(fbm2(vec2(s*7.+id*13.,t*6.+fi))-.5)*.32*env;
    off+=(n2(vec2(s*31.,t*20.+fi*5.))-.5)*.05*env;
    float d=abs(y-off);
    float br=(fbm2(vec2(s*5.+id*3.,fi*4.+3.))-.5)*.5*env; // a branch
    float d2=abs(y-off-br*smoothstep(.3,.9,s))+.004;
    float core=exp(-d*260.)+.35*exp(-d2*300.)*step(.5,h11(id+9.))
    ;float glow=exp(-d*28.)*.45;
    c+=on*(core*vec3(.75,.9,1.)+glow*vec3(.1,.45,1.));
  }
  return c;
}

void main(){
  vec2 p=v*2.-1.;
  p.y-=sin(uT*1.15)*.03;               // gentle bobbing
  p.x-=sin(uT*.6)*.008;
  float d=length(p);
  float px=2.5/uRes.x;
  float t=uT;
  vec3 col=vec3(0.); float alpha=0.;

  // ---------- exterior flame halo (outside the glass only) ----------
  float hs=mix(.09,.22,uSpeak)*(1.+.1*sin(t*2.3));
  vec2 dir=p/max(d,1e-4);
  hs*=1.+.45*max(dir.y,0.);            // flames lean upward
  float e=(d-R)/hs;
  float rr=d-R;
  if(rr>-.03&&rr<hs*2.2){
    float nf=fbm3(vec3(dir*3.4,rr*8.-t*(1.8+uSpeak*1.6)));
    float nf2=n3(vec3(dir*10.,rr*16.-t*(3.2+uSpeak*2.)));
    float ht=hs*(.35+1.25*nf*nf+.55*nf2);
    float f=1.-smoothstep(0.,ht,max(rr,0.));
    f=pow(f,1.5)*(.7+.3*nf2);
    f+=exp(-max(rr,0.)/(hs*.22))*.18;
    f=clamp(f,0.,1.);
    vec3 hc=mix(vec3(.3,0.,.13),vec3(1.,.1,.5),smoothstep(.1,.8,f));
    hc=mix(hc,vec3(1.,.6,.85),pow(f,5.)*.5);
    float ha=f*(.7+.3*uSpeak)*uBright;
    col=hc*ha*1.25; alpha=ha;
  }
  // subtle cosmic particles around the orb
  if(d>R&&d<R+.35){
    vec2 g=p*38.; vec2 ci=floor(g); float hh=h21(ci);
    if(hh>.965){vec2 o=vec2(h21(ci+3.),h21(ci+7.))-.5; float sd=length(fract(g)-.5-o*.6);
      float tw=.5+.5*sin(t*(2.+hh*5.)+hh*40.);
      float sp=smoothstep(.12,0.,sd)*tw*(1.-(d-R)/.35);
      col+=vec3(1.,.4,.75)*sp*.8; alpha=max(alpha,sp*.8);}
  }

  // ---------- black-glass sphere ----------
  float inside=1.-smoothstep(R-px,R+px*.5,d);
  if(inside>0.){
    vec2 q=p/R; float z=sqrt(max(1.-dot(q,q),0.));
    vec3 n=vec3(q,z);
    vec2 qi=q*(1.-.16*(1.-z));        // glass lensing
    float zi=sqrt(max(1.-dot(qi,qi),0.));
    vec3 ic=vec3(0.);

    // nebula volume (deep purple), sampled along the view ray
    mat3 nr=rotZ(t*.03);
    float neb=0.;
    for(int i=0;i<5;i++){
      float k=(float(i)+.5)/5.;
      vec3 pos=vec3(qi,mix(zi,-zi,k));
      float dn=fbm3(nr*pos*2.3+vec3(0.,0.,t*.04));
      neb+=smoothstep(.42,.85,dn);
    }
    neb/=5.;
    ic+=vec3(.32,.05,.55)*neb*1.1+vec3(.55,.05,.4)*neb*neb*.6;

    // spiral galaxy on a tilted disk through the center
    mat3 M=rotX(1.08+.06*sin(t*.21))*rotZ(.35);
    vec3 o=M*vec3(qi,zi); vec3 rd=M*vec3(0.,0.,-1.);
    float tt=-o.y/rd.y;
    if(tt>0.&&tt<2.*zi){
      vec3 hp=o+rd*tt; vec2 dp=hp.xz;
      float r=length(dp);
      vec2 rp=rot(t*.18)*dp;
      float ang=atan(rp.y,rp.x);
      float sp=cos(2.*ang-5.2*log(r+.035));
      float arms=pow(.5+.5*sp,2.6);
      float clump=fbm2(rp*7.);
      float dust=smoothstep(.35,.75,fbm2(rp*11.+4.));
      float disk=exp(-r*2.3)*smoothstep(.98,.6,r);
      float a=arms*disk*(.55+.9*clump)*(1.-.55*dust);
      vec3 armC=mix(vec3(.85,.0,.5),vec3(1.,.28,.72),clump);
      ic+=armC*a*2.1;
      ic+=vec3(1.,.55,.85)*exp(-r*7.)*.9;              // bulge
      ic+=vec3(1.)*exp(-r*r*240.)*2.6;                 // bright white core
      // star clusters along arms
      vec2 sg=rp*55.; float sh=h21(floor(sg));
      ic+=vec3(1.,.85,.95)*step(.93,sh)*smoothstep(.3,0.,length(fract(sg)-.5))*arms*disk*3.;
    }

    // stars: bright + dim layers (rotate slowly with the sphere)
    vec2 s1=rot(t*.025)*qi*26.; vec2 c1=floor(s1); float r1=h21(c1);
    vec2 o1=vec2(h21(c1+1.3),h21(c1+5.1))-.5;
    float st1=step(.9,r1)*smoothstep(.09,0.,length(fract(s1)-.5-o1*.7))*(.6+.4*sin(t*(1.+r1*4.)+r1*30.));
    vec2 s2=rot(t*.015)*qi*60.+7.; float r2=h21(floor(s2));
    float st2=step(.86,r2)*smoothstep(.12,0.,length(fract(s2)-.5))*.35;
    ic+=vec3(1.,.92,.98)*(st1*1.6+st2);

    // asteroids / debris orbiting inside
    for(int i=0;i<6;i++){
      float fi=float(i);
      float rad=.42+.42*h11(fi*3.7);
      float an=t*(.12+.1*h11(fi*1.9))+fi*1.7;
      vec3 ap=vec3(cos(an)*rad,(h11(fi*8.1)-.5)*.25,sin(an)*rad);
      vec3 wp=ap*M;                       // galaxy -> view space (inverse rotation)
      vec2 c=wp.xy; float sz=(.035+.045*h11(fi*5.3))*(1.+wp.z*.25);
      vec2 dv=qi-c; float dl=length(dv);
      float bump=n2(dv/max(dl,1e-4)*2.+fi*10.)*.45+n2(dv*40.+fi)*.1;
      float edge=sz*(.75+bump);
      if(dl<edge+px*2.){
        float m=1.-smoothstep(edge-px*1.5,edge+px*.5,dl);
        vec2 ld=normalize(-c+1e-4);
        float lit=clamp(dot(dv/max(dl,1e-4),ld)*.5+.5,0.,1.);
        vec3 rock=vec3(.05,.035,.06)+vec3(.9,.25,.6)*pow(lit,3.)*.55*(dl/edge);
        rock*=.7+.6*n2(dv*90.+fi);
        ic=mix(ic,rock,m*.95);
      }
    }

    // shooting stars
    for(int i=0;i<2;i++){
      float fi=float(i);
      float P=3.3+fi*1.9;
      float k=t/P+fi*.43; float id=floor(k); float ph=fract(k);
      float life=ph/.28;
      if(life<1.){
        float a=h11(id*4.1+fi)*6.2832;
        vec2 dir2=vec2(cos(a),sin(a));
        vec2 st=-dir2*.75+vec2(-dir2.y,dir2.x)*(h11(id*2.7+fi)-.5)*1.1;
        vec2 hd=st+dir2*life*1.4;
        vec2 tl=hd-dir2*.32;
        float dd=seg(qi,tl,hd);
        float along=clamp(dot(qi-tl,dir2)/.32,0.,1.);
        float sstr=exp(-dd*420.)*along*along*sin(life*3.14159);
        ic+=vec3(1.,.8,.95)*sstr*2.2;
      }
    }

    // neon-blue lightning, masked so it never touches the glass
    ic+=lightning(qi,t)*smoothstep(.96,.8,length(qi));

    // glass: dark tint deepening toward the edge (no ring, smooth falloff)
    vec3 gc=ic*(.48+.52*pow(z,.6))*uBright;
    gc+=vec3(.02,.005,.03);
    float fres=pow(1.-z,4.);
    gc+=vec3(.35,.08,.32)*fres*.35;                    // faint pink/purple environment reflection
    // reflective curved highlights near the top
    vec3 L1=normalize(vec3(-.38,.62,.68));
    vec3 H=normalize(L1+vec3(0.,0.,1.));
    float spec=pow(max(dot(n,normalize(vec3(-.36,.66,.66))),0.),420.)*1.8;
    float capA=smoothstep(.78,.97,dot(n,normalize(vec3(-.1,.92,.38))));
    float capB=smoothstep(.80,.99,dot(n,normalize(vec3(-.08,.72,.69))));
    float cres=capA*(1.-capB)*.75;
    float soft=pow(max(dot(n,normalize(vec3(-.3,.5,.81))),0.),18.)*.06;
    gc+=vec3(1.)*(spec+cres+soft);
    gc+=vec3(.9,.3,.7)*pow(max(dot(n,normalize(vec3(.3,-.8,.5))),0.),30.)*.08; // pink bounce light below

    col=mix(col,gc,inside);
    alpha=mix(alpha,1.,inside);
  }
  col=1.-exp(-col*1.25);
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
    this.quality = 1; this.fps = 60; this.reduceMotion = false;
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
      this.u = { res: gl.getUniformLocation(prog, 'uRes'), t: gl.getUniformLocation(prog, 'uT'), speak: gl.getUniformLocation(prog, 'uSpeak'), bright: gl.getUniformLocation(prog, 'uBright') };
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * this.quality;
    const w = Math.max(64, Math.round(r.width * dpr)), h = Math.max(64, Math.round(r.height * dpr));
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
    const minDt = 1000 / this.fps - 2;
    if (now - this.last < minDt) return;
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
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
      gl.uniform1f(this.u.t, t + 20); gl.uniform1f(this.u.speak, this.speak); gl.uniform1f(this.u.bright, this.bright);
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
