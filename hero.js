import * as THREE from 'three';
/* Nexus Studio v8 hero (midnight sapphire N; v8: shaders pre-compiled + warmed before the clock starts, grains shed by a soft fade instead of a hard cut, no DPR change at runtime, slower graceful exit): grains converge into a solid black-chrome "N" (thin stems, heavy diagonal) with platinum chamfers.
   One clock (NX), one light band, one curve. The mesh and the grains share the same group and the
   same unit space, so the grains land exactly on the jewel's silhouette and then dissolve into it. */
const root = document.documentElement;
const stage = document.querySelector('.stage');
const sticky = document.querySelector('.stage-sticky');
const canvas = document.getElementById('grains');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NX = window.NX;
function goStatic() { root.classList.add('static'); }

if (reduce || !NX) goStatic(); else start();

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { goStatic(); return; }
  window.__heroOK = true;
  root.classList.remove('static');
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); goStatic(); }, false);

  const mobile = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  const COUNT = mobile ? 16000 : 40000;
  // v8: DPR is decided once (1.5 cap) and never changed while the N is on screen: a resize mid-assembly was one of the 'flick' sources
  const DPR_MAX = Math.min(devicePixelRatio || 1, 1.5);
  let dpr = DPR_MAX;
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const FOV = 30, Z0 = 10, Z1 = 9.3;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, Z0);

  // ---------- studio environment (soft boxes, no external files) ----------
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), new THREE.MeshBasicMaterial({ color: 0x03060e, side: THREE.BackSide })));
  const box = (w, h, col, k, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...(look || [0, 0, 0])); env.add(m); return m;
  };
  box(16, 3.2, '#f6f7f8', 3.2, [0, 9, 2]);                 // overhead strip
  box(2.2, 12, '#dfeeff', 4.0, [-9, 1, 3]);                // cool key, left
  box(1.4, 12, '#cfe0f5', 2.2, [9, 0, 1]);                 // ice rim, right
  box(22, 9, '#16264a', 0.6, [0, -9, 0]);                  // midnight floor bounce
  box(9, 1.1, '#ffffff', 5.0, [-2.5, 4.2, 9]);             // front strip: gives the face a long polished reflection
  box(14, 6, '#141e33', 0.5, [2, -3, 9]);                  // front deep-navy fill (kept low: the face stays deep)
  box(7, 7, '#1d3a66', 0.9, [1.5, -.5, -9]);              // behind: soft sapphire back light
  box(.7, 14, '#f4f5f6', 3.0, [-2.5, 0, -9]);             // a thin white strip behind, refracted into the body
  box(3, 3, '#ffffff', 5.0, [6, 6, 7]);                    // small hot softbox: glints on the chamfers
  box(12, 1.0, '#f7f7f8', 3.2, [0, 7.5, 7]);              // platinum line on the top chamfers
  box(1.0, 12, '#e6f1ff', 2.6, [-7.5, 0, 7]);             // and on the left chamfers
  box(1.0, 12, '#dbe7f6', 1.4, [7.5, 0, 7]);              // a cooler, softer one on the right
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(env, 0.035).texture;
  scene.environment = envTex;

  // ---------- the jewel ----------
  // N outline in unit space (y up): hairline stems, one heavy diagonal (high-contrast, Didone-like)
  const NP = [[-.34, -.36], [-.34, .36], [-.12, .36], [.265, -.2426], [.265, .36], [.34, .36], [.34, -.36], [.12, -.36], [-.265, .2426], [-.265, -.36]];
  const DEPTH = .1, BT = .022, BS = .014;
  const shape = new THREE.Shape(); NP.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
  const ngeo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelSegments: 1, curveSegments: 1 });
  ngeo.translate(0, 0, -DEPTH / 2);
  const FRONT = DEPTH / 2 + BT;

  const U = {
    uTime: { value: 0 }, uForm: { value: 0 }, uBlow: { value: 0 }, uSolid: { value: 0 },
    uSweep: { value: -9 }, uLight: { value: new THREE.Vector2(-0.3, 0.35) },
    uSize: { value: mobile ? 2.9 : 2.5 }, uDpr: { value: dpr }, uKeep: { value: 1.001 }
  };
  // shared dissolve + inner glow + light band, injected into the physical material
  function jewelize(mat, kind) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uTime: U.uTime, uSolid: U.uSolid, uBlow: U.uBlow, uSweep: U.uSweep });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoc;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoc = (modelMatrix * vec4(position,1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vLoc; uniform float uTime,uSolid,uBlow,uSweep,uScaleInv;
        float hsh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}`)
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 lp = vLoc * uScaleInv;                       // back to unit space
        float nz = hsh(floor(lp.xy*320.0));
        float xn = lp.x + 0.5;
        float vin = uSolid*1.3 - (xn*0.55 + nz*0.45);     // grows left to right, speckled like the grains
        float vout = uBlow*1.7 - (xn*0.55 + nz*0.15);     // peels away exactly where the grains blow off
        if (vin < 0.0 || vout > 0.02) discard;
        float edgeGlow = (1.0 - smoothstep(0.0, 0.08, vin)) + (1.0 - smoothstep(-0.12, 0.02, -vout + 0.02)) * step(0.0005, uBlow);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 V = normalize(vViewPosition);
          float ndv = clamp(dot(normal, V), 0.0, 1.0);
          float band = exp(-pow((dot(lp.xy, vec2(0.788,-0.616)) - uSweep) * 5.5, 2.0));
          vec3 chm = vec3(0.0);
          #ifdef ENVMAP_TYPE_CUBE_UV
            vec3 wN = inverseTransformDirection(normal, viewMatrix);
            float bev = smoothstep(0.08, 0.22, 1.0 - ndv);                       // chamfers only
            float kl = pow(max(dot(wN, normalize(vec3(-0.45, 0.8, 0.45))), 0.0), 12.0)
                     + 0.4 * pow(max(dot(wN, normalize(vec3(0.7, 0.35, 0.6))), 0.0), 16.0);
            chm = vec3(0.90, 0.94, 0.99) * kl * bev * 0.9;                     // crisp platinum catch-lights on the chamfers
          #endif
          float fres = pow(1.0 - ndv, 3.0);
          // satin face: a soft top-left to bottom-right graphite-to-silver falloff (no lines, no facets)
          float face = smoothstep(0.55, 0.92, ndv);
          float grad = smoothstep(-0.5, 0.55, lp.y * 0.85 - lp.x * 0.35);
          vec3 faceCol = mix(vec3(0.0), vec3(0.014, 0.022, 0.040), grad * grad);
          totalEmissiveRadiance += chm + faceCol * face
                                 + vec3(0.26, 0.44, 0.74) * fres * 0.07                  // a restrained sapphire edge light
                                 + vec3(0.86, 0.92, 1.00) * band * (0.025 + fres * 0.6)  // the light sweep, ice-silver
                                 + vec3(0.70, 0.82, 0.98) * edgeGlow * 1.1;
        }`);
      sh.uniforms.uScaleInv = scaleInv;
    };
  }
  const scaleInv = { value: 1 };
  // satin black chrome: a metal body that only shows the studio as long, soft reflections
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#7f8fa8'), metalness: 1.0, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.06,
    envMapIntensity: 1.0, flatShading: true
  });
  jewelize(gemMat, 'gem');
  const gem = new THREE.Mesh(ngeo, gemMat);

  const jewel = new THREE.Group();
  jewel.add(gem);
  scene.add(jewel);

  // ---------- grains: sampled from the same outline and the same depth as the solid N ----------
  const inPoly = (x, y) => { let c = false; for (let i = 0, j = NP.length - 1; i < NP.length; j = i++) { const [xi, yi] = NP[i], [xj, yj] = NP[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
  const edges = NP.map((p, i) => { const q = NP[(i + 1) % NP.length]; return { p, q, len: Math.hypot(q[0] - p[0], q[1] - p[1]) }; });
  const per = edges.reduce((s, e) => s + e.len, 0);
  // outward normal: polygon is clockwise in y-up space
  const area = NP.reduce((s, p, i) => { const q = NP[(i + 1) % NP.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  const sgn = area > 0 ? 1 : -1;

  const aT = new Float32Array(COUNT * 3), aC = new Float32Array(COUNT * 3), aS = new Float32Array(COUNT * 4), aK = new Float32Array(COUNT), aR = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = Math.random();
    let tx, ty, tz, cls;
    if (r < .58) {            // polished face
      cls = 0; do { tx = Math.random() * .7 - .35; ty = Math.random() * .74 - .37; } while (!inPoly(tx, ty));
      tz = FRONT;
    } else {                  // chamfered silhouette, through the thickness
      cls = 1; let d = Math.random() * per, e = edges[0];
      for (const ed of edges) { if (d <= ed.len) { e = ed; break; } d -= ed.len; }
      const u = d / e.len, dx = (e.q[0] - e.p[0]) / e.len, dy = (e.q[1] - e.p[1]) / e.len;
      const nx = dy * sgn, ny = -dx * sgn, off = Math.random() * BS;
      tx = e.p[0] + (e.q[0] - e.p[0]) * u + nx * off; ty = e.p[1] + (e.q[1] - e.p[1]) * u + ny * off;
      tz = FRONT - Math.pow(Math.random(), 1.6) * (DEPTH + BT * 2);
    }
    aT[i * 3] = tx; aT[i * 3 + 1] = ty; aT[i * 3 + 2] = tz;
    const a = Math.random() * Math.PI * 2, rad = 0.6 + Math.pow(Math.random(), 0.6) * 2.2;
    aC[i * 3] = tx - 1.4 + Math.cos(a) * rad; aC[i * 3 + 1] = ty + Math.sin(a) * rad * 0.55; aC[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
    const delay = (tx + 0.5) * 0.42 + Math.random() * 0.22;
    const bright = cls === 0 ? 0.5 + Math.random() * 0.4 : 0.8 + Math.random() * 0.5;
    aS[i * 4] = delay; aS[i * 4 + 1] = 0.6 + Math.random() * 0.9; aS[i * 4 + 2] = bright; aS[i * 4 + 3] = Math.random();
    // silver-blue grains with a share of ice-sapphire: a few on the face and edges, rare pale sparks
    const pe = cls === 0 ? .16 : .12;
    aK[i] = Math.random() < pe ? (Math.random() < .06 ? 1.0 : .7) : 0;
    aR[i] = i / COUNT;                       // rank: adaptive quality fades out the top ranks, never cuts them
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(aT, 3));
  geo.setAttribute('aChaos', new THREE.BufferAttribute(aC, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aS, 4));
  geo.setAttribute('aEm', new THREE.BufferAttribute(aK, 1));
  geo.setAttribute('aRank', new THREE.BufferAttribute(aR, 1));
  let drawN = COUNT; geo.setDrawRange(0, drawN);

  const NOISE = `
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+2.0*C.xxx;vec3 x3=x0-1.0+3.0*C.xxx;
    i=mod(i,289.0);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  vec3 sn3(vec3 x){return vec3(snoise(x),snoise(vec3(x.y-19.1,x.z+33.4,x.x+47.2)),snoise(vec3(x.z+74.2,x.x-124.5,x.y+99.4)));}
  vec3 curl(vec3 p){
    const float e=0.12;vec3 dx=vec3(e,0,0),dy=vec3(0,e,0),dz=vec3(0,0,e);
    vec3 px0=sn3(p-dx),px1=sn3(p+dx),py0=sn3(p-dy),py1=sn3(p+dy),pz0=sn3(p-dz),pz1=sn3(p+dz);
    float x=py1.z-py0.z-pz1.y+pz0.y;float y=pz1.x-pz0.x-px1.z+px0.z;float z=px1.y-px0.y-py1.x+py0.x;
    return normalize(vec3(x,y,z)/(2.0*e)+1e-5);
  }`;


  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: NOISE + `
      attribute vec3 aChaos; attribute vec4 aSeed; attribute float aEm; attribute float aRank;
      uniform float uTime,uForm,uBlow,uSolid,uSweep,uSize,uDpr,uKeep; uniform vec2 uLight;
      varying vec3 vCol; varying float vA; varying float vSpec;
      void main(){
        float f=clamp((uForm*1.75-aSeed.x)/1.0,0.0,1.0);
        float fe=f>=1.0?1.0:1.0-pow(2.0,-10.0*f);
        float xn=position.x+0.5;
        float b=clamp(uBlow*1.7-xn*0.55-aSeed.w*0.15,0.0,1.0);
        vec3 p=mix(aChaos,position,fe);
        float wild=(1.0-fe)+b;
        if(wild>0.002){
          vec3 c=curl(p*1.15+vec3(0.0,0.0,uTime*0.06));
          p+=c*(1.0-fe)*0.55;
          float bb=b*b;
          p+=(c*0.9+vec3(1.35,0.38,0.7))*bb*(1.2+aSeed.w);
        }
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*mv;
        float dof=1.0+(1.0-fe)*abs(p.z)*0.9+b*0.6;
        gl_PointSize=uSize*aSeed.y*uDpr*(10.0/-mv.z)*dof;
        float br=aSeed.z*mix(0.55,1.0,fe);
        float band=exp(-pow((dot(position.xy,vec2(0.788,-0.616))-uSweep)*7.0,2.0));
        float glint=pow(aSeed.w,10.0);
        float l=exp(-dot(position.xy-uLight,position.xy-uLight)*7.0);
        float settle=uSolid*fe*(1.0-b);                 // once the jewel is solid, grains step back
        float k=(br*0.48 + l*0.28*br + (1.0-fe)*0.12)*mix(1.0,0.03,settle) + band*(0.55+glint*5.0)*mix(1.0,0.18,settle);
        vec3 plat=mix(vec3(0.84,0.89,0.97),vec3(0.93,0.95,1.00),aSeed.w);
        vec3 jade=mix(vec3(0.52,0.68,0.92),vec3(0.78,0.88,1.00),step(0.95,aEm));
        vCol=mix(plat,jade,step(0.5,aEm))*k;
        vA=(1.0-smoothstep(0.55,1.0,b))*smoothstep(0.0,0.08,uForm+0.02)/(dof*dof)*(1.0-smoothstep(uKeep-0.06,uKeep,aRank));
        vSpec=band*(0.4+glint*2.0)*mix(1.0,0.25,settle);
      }`,
    fragmentShader: `
      varying vec3 vCol; varying float vA; varying float vSpec;
      void main(){
        vec2 d=gl_PointCoord-0.5; float r=length(d);
        if(r>0.5) discard;
        float body=smoothstep(0.5,0.0,r); body*=body;
        float core=exp(-r*r*60.0);
        float spec=exp(-dot(d-vec2(-0.12,-0.14),d-vec2(-0.12,-0.14))*140.0);
        vec3 c=vCol*(body*0.75+core*0.55)+vec3(0.92,0.96,1.00)*spec*(0.10+vSpec)*vA;
        vec3 o=c*vA;
        gl_FragColor=vec4(o,clamp(max(o.r,max(o.g,o.b)),0.0,1.0));   // v7: alpha follows light, so faint grains never darken the page
      }`,
    premultipliedAlpha: true
  });
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = 2;
  jewel.add(pts);

  // ---------- sizing ----------
  let W = 0, H = 0, emPx = 300;
  const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  function resize() {
    W = innerWidth; H = sticky.clientHeight || innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    emPx = mobile || W < 760 ? Math.min(W * 0.66, H * 0.4) : Math.min(H * 0.56, W * 0.38, 540);
    const s = emPx / H * 2 * Z0 * tanH;
    jewel.scale.setScalar(s); scaleInv.value = 1 / s;
    setVar('--emsz', emPx.toFixed(1) + 'px');
  }
  const last = {};
  const setTf = (el, v) => { if (el.__tf !== v) { el.__tf = v; el.style.transform = v; } };
  function setVar(k, v) { if (last[k] !== v) { last[k] = v; sticky.style.setProperty(k, v); } }
  resize(); addEventListener('resize', resize, { passive: true });

  // ---------- input ----------
  const m = { x: 0, y: 0, tx: 0, ty: 0 };
  if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => { m.tx = e.clientX / W * 2 - 1; m.ty = e.clientY / H * 2 - 1; }, { passive: true });

  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  // v8: compile every program and upload the environment map before the clock starts. Before, the jewel's physical
  // shader compiled the first time it became visible (~3s in, mid-assembly): a long frame, then a jump = the "flick".
  gem.visible = true; U.uForm.value = 0; U.uSolid.value = 0;
  try { renderer.compile(scene, camera); } catch (e) {}
  renderer.render(scene, camera);
  NX.restart();

  // pause completely when the stage is off screen
  let inView = true;
  new IntersectionObserver(es => { inView = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(stage);

  // adaptive quality: watch real frame time, shed grains first, then resolution
  // v8: shedding grains is a 0.8s fade over a slice of random ranks (no single-frame pop); resolution never changes at runtime
  let ema = 1 / 60, slow = 0, fast = 0, frames = 0, keep = 1.001, keepT = 1.001;
  function adapt(dt) {
    frames++;
    if (frames >= 40) {                                 // ignore warm-up
      ema += (dt - ema) * 0.05;
      if (ema > 1 / 50) { slow += dt; fast = 0; } else if (ema < 1 / 57) { fast += dt; slow = 0; } else { slow = fast = 0; }
      if (slow > 0.6) { slow = 0; keepT = Math.max(.45, keepT - .15); }
      else if (fast > 4 && keepT < 1) { fast = 0; keepT = Math.min(1.001, keepT + .1); }
    }
    if (keep !== keepT) {
      const st = dt / 0.8 * .15;                       // .15 of the grains per 0.8s
      keep = keep < keepT ? Math.min(keepT, keep + st) : Math.max(keepT, keep - st);
      U.uKeep.value = keep;
      const n = Math.min(COUNT, Math.ceil((keep + .002) * COUNT));
      if (n !== drawN) { drawN = n; geo.setDrawRange(0, drawN); }
    }
  }
  window.__hero = { get count() { return drawN; }, get dpr() { return dpr; }, get ema() { return ema; }, get keep() { return keep; }, frames: [] };

  const sky = document.querySelector('.sky'), planet = document.querySelector('.planet');
  let r = null, pSm = 0;
  NX.read(() => { r = inView ? stage.getBoundingClientRect() : null; });
  NX.on((now, dt, t) => {
    if (!r) return;
    adapt(dt);
    const pScroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - H)));
    pSm += (pScroll - pSm) * (1 - Math.exp(-dt * 7.5));
    const p = pSm;
    if (r.bottom < -50) return;

    const km = 1 - Math.exp(-dt * 2.2); m.x += (m.tx - m.x) * km; m.y += (m.ty - m.y) * km;
    const z = Z0 + (Z1 - Z0) * easeIO(Math.min(1, t / 26)) - p * 0.6;
    camera.position.set(m.x * 0.18, -m.y * 0.12, z); camera.lookAt(0, 0, 0);
    // a slow, weighty turn once formed: the facets catch the soft boxes
    const idle = sm(4.5, 7, t);
    jewel.rotation.y = m.x * 0.16 + Math.sin(t * 0.21) * 0.10 * idle;
    jewel.rotation.x = m.y * 0.10 + Math.sin(t * 0.17 + 1.3) * 0.045 * idle;

    // v8: the N leaves slowly, turning a little as it goes; the horizon sinks and the stars drift with the cursor
    jewel.rotation.y += sm(0.0, 0.8, p) * 0.5;
    jewel.position.y = sm(0.0, 0.8, p) * 0.06;
    if (planet) setTf(planet, `translate3d(${(m.x * -10).toFixed(1)}px,${(p * 90 + m.y * -4).toFixed(1)}px,0)`);
    if (sky) setTf(sky, `translate3d(${(m.x * -18).toFixed(1)}px,${(m.y * -12 - p * 60).toFixed(1)}px,0)`);
    const form = Math.min(1, Math.max(0, (t - 0.35) / 4.4));
    U.uTime.value = t; U.uForm.value = form;
    U.uSolid.value = sm(3.0, 5.4, t);
    U.uBlow.value = sm(0.0, 0.8, p);                 // v8: was 0 → .55 of the pin; now 0 → .8, eased
    const D = NX.bandAt(t, W, innerHeight);
    const S = emPx * Z0 / z, Dc = (W / 2) * 0.788 + (r.top + H / 2 > 0 ? H / 2 : 0) * 0.616;
    U.uSweep.value = D == null ? -9 : (D - Dc) / S;
    U.uLight.value.set(m.x * 0.5 - 0.15, -m.y * 0.5 + 0.2);
    gem.visible = U.uSolid.value > 0.001 && U.uBlow.value < 0.999;   // program + env map were warmed before t=0, so first use costs nothing

    setVar('--solid', (sm(3.3, 5.6, t) * (1 - sm(0.03, 0.5, p))).toFixed(3));
    setVar('--intro', (sm(4.8, 6.2, t) * (1 - sm(0.0, 0.24, p))).toFixed(3));
    setVar('--hp', sm(0.42, 0.76, p).toFixed(3));
    setVar('--hs', (sm(0.42, 0.98, p) * 1.3).toFixed(3));
    setVar('--lp', sm(0.58, 0.86, p).toFixed(3));
    NX.heroP = p;
    renderer.render(scene, camera);
  });
}
