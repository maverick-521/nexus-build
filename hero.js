import * as THREE from 'three';

const root = document.documentElement;
const stage = document.querySelector('.stage');
const sticky = document.querySelector('.stage-sticky');
const canvas = document.getElementById('grains');
const emWrap = document.querySelector('.emblem-wrap');
const emblem = document.querySelector('.emblem');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function goStatic() { root.classList.add('static'); }

if (reduce) goStatic(); else start();

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { goStatic(); return; }
  window.__heroOK = true;
  root.classList.remove('static');

  const mobile = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  const COUNT = mobile ? 16000 : 60000;
  const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const FOV = 30;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const Z0 = 10, Z1 = 9.2;
  camera.position.set(0, 0, Z0);

  // ---- sample the emblem (same geometry as the CSS emblem) ----
  const R = 512, cv = document.createElement('canvas'); cv.width = cv.height = R;
  const g = cv.getContext('2d');
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  g.fillStyle = '#0000ff'; rr(0, 0, R, R, R * 0.27); g.fill();            // face
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = '#ff0000'; g.lineWidth = R * 0.016; rr(R * .008, R * .008, R * .984, R * .984, R * .265); g.stroke(); // outer rim
  g.lineWidth = R * 0.012; rr(R * .08, R * .08, R * .84, R * .84, R * .84 * .22); g.stroke();                         // chamfer
  g.strokeStyle = '#00ff00'; g.lineWidth = R * 0.11; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(R * .33, R * .70); g.lineTo(R * .33, R * .30); g.lineTo(R * .67, R * .70); g.lineTo(R * .67, R * .30); g.stroke();
  const px = g.getImageData(0, 0, R, R).data;

  const aT = new Float32Array(COUNT * 3), aC = new Float32Array(COUNT * 3), aS = new Float32Array(COUNT * 4), aK = new Float32Array(COUNT);
  let i = 0, guard = 0;
  while (i < COUNT && guard++ < COUNT * 80) {
    const x = Math.random() * R, y = Math.random() * R;
    const o = ((y | 0) * R + (x | 0)) * 4;
    const rC = px[o], gC = px[o + 1], bC = px[o + 2];
    let cls = -1, p = 0;
    if (gC > 128) { cls = 2; p = 1.0; } else if (rC > 128) { cls = 1; p = 0.95; } else if (bC > 128) { cls = 0; p = 0.085; }
    if (cls < 0 || Math.random() > p) continue;
    const tx = x / R - 0.5, ty = 0.5 - y / R;
    const tz = cls === 0 ? 0 : 0.012;
    aT.set([tx, ty, tz], i * 3);
    // chaos: a wide, swirling cloud drifting in from the left
    const a = Math.random() * Math.PI * 2, rad = 0.6 + Math.pow(Math.random(), 0.6) * 2.2;
    aC.set([tx - 1.4 + Math.cos(a) * rad, ty + Math.sin(a) * rad * 0.55, (Math.random() - 0.5) * 2.4], i * 3);
    const delay = (tx + 0.5) * 0.42 + Math.random() * 0.22;
    const bright = cls === 0 ? 0.35 + Math.random() * 0.4 : cls === 1 ? 0.75 + Math.random() * 0.5 : 0.55 + Math.random() * 0.55;
    aS.set([delay, 0.6 + Math.random() * 0.9, bright, Math.random()], i * 4);
    aK[i] = Math.random() < 0.012 ? 1 : 0; // a few emerald grains
    i++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(aT, 3));
  geo.setAttribute('aChaos', new THREE.BufferAttribute(aC, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aS, 4));
  geo.setAttribute('aEm', new THREE.BufferAttribute(aK, 1));
  geo.setDrawRange(0, i);

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

  const uniforms = {
    uTime: { value: 0 }, uForm: { value: 0 }, uBlow: { value: 0 }, uSolid: { value: 0 },
    uSweep: { value: -2 }, uLight: { value: new THREE.Vector2(-0.3, 0.35) }, uScale: { value: 3 },
    uSize: { value: mobile ? 2.2 : 1.85 }, uDpr: { value: dpr }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: NOISE + `
      attribute vec3 aChaos; attribute vec4 aSeed; attribute float aEm;
      uniform float uTime,uForm,uBlow,uSolid,uSweep,uScale,uSize,uDpr; uniform vec2 uLight;
      varying vec3 vCol; varying float vA; varying float vSpec;
      void main(){
        float f=clamp((uForm*1.75-aSeed.x)/1.0,0.0,1.0);
        float fe=f>=1.0?1.0:1.0-pow(2.0,-10.0*f);            // expo-out: the site's one curve
        float xn=position.x+0.5;
        float b=clamp(uBlow*1.7-xn*0.55-aSeed.w*0.15,0.0,1.0);
        vec3 p=mix(aChaos,position,fe);
        float wild=(1.0-fe)+b;
        if(wild>0.002){
          vec3 c=curl(p*1.15+vec3(0.0,0.0,uTime*0.06));
          p+=c*(1.0-fe)*0.55;
          float bb=b*b;
          p+=(c*0.9+vec3(1.35,0.38,0.7))*bb*(1.2+aSeed.w);
        } else {
          p.xy+=0.0016*vec2(sin(uTime*1.3+aSeed.w*40.0),cos(uTime*1.1+aSeed.w*31.0));
        }
        vec3 wp=p*uScale;
        vec4 mv=modelViewMatrix*vec4(wp,1.0);
        gl_Position=projectionMatrix*mv;
        float dof=1.0+(1.0-fe)*abs(p.z)*0.9+b*0.6;            // grains in flight drift out of focus
        gl_PointSize=uSize*aSeed.y*uDpr*(10.0/-mv.z)*dof;
        // metallic shading
        float br=aSeed.z*mix(0.55,1.0,fe);
        float band=exp(-pow((dot(position.xy,vec2(0.788,-0.616))-uSweep)*7.0,2.0));   // the same 128deg light as the page
        float glint=pow(aSeed.w,10.0);
        float l=exp(-dot(position.xy-uLight,position.xy-uLight)*7.0);
        float k=br*0.30 + band*(0.55+glint*5.0) + l*0.22*br + (1.0-fe)*0.08;
        k*=mix(1.0,0.32,uSolid*fe*(1.0-b));
        vec3 base=mix(vec3(0.86,0.865,0.90),vec3(0.92,0.90,0.86),aSeed.w);
        vCol=mix(base,vec3(0.30,0.60,0.50),aEm)*k;
        vA=(1.0-smoothstep(0.55,1.0,b))*smoothstep(0.0,0.08,uForm+0.02)/(dof*dof);
        vSpec=band*(0.4+glint*2.0);
      }`,
    fragmentShader: `
      varying vec3 vCol; varying float vA; varying float vSpec;
      void main(){
        vec2 d=gl_PointCoord-0.5; float r=length(d);
        if(r>0.5) discard;
        float body=smoothstep(0.5,0.0,r); body*=body;                       // soft round grain
        float core=exp(-r*r*60.0);                                          // crisp centre
        float spec=exp(-dot(d-vec2(-0.12,-0.14),d-vec2(-0.12,-0.14))*140.0); // tiny lit facet toward the light
        vec3 c=vCol*(body*0.75+core*0.55)+vec3(1.0,0.99,0.97)*spec*(0.10+vSpec)*vA;
        gl_FragColor=vec4(c*vA,1.0);
      }`
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // ---- sizing: keep the CSS emblem exactly over the particle emblem ----
  let W = 0, H = 0, emPx = 300;
  function resize() {
    W = innerWidth; H = sticky.clientHeight || innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    emPx = mobile || W < 760 ? Math.min(W * 0.62, H * 0.36) : Math.min(H * 0.5, W * 0.36, 500);
  }
  resize(); addEventListener('resize', resize);
  const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  // ---- input ----
  const m = { x: 0, y: 0, tx: 0, ty: 0 };
  if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => { m.tx = e.clientX / W * 2 - 1; m.ty = e.clientY / H * 2 - 1; }, { passive: true });

  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const NX = window.NX; if (NX) NX.restart();
  let t0 = NX ? NX.t0 : performance.now(), visible = true, pScroll = 0, pSm = 0, lastNow = 0;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestAnimationFrame(loop); });

  function loop(now) {
    if (!visible) return;
    requestAnimationFrame(loop);
    const t = (now - (NX ? NX.t0 : t0)) / 1000;
    const dt = Math.min(0.05, lastNow ? (now - lastNow) / 1000 : 1 / 60); lastNow = now;
    const r = stage.getBoundingClientRect();
    pScroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - H)));
    pSm += (pScroll - pSm) * (1 - Math.exp(-dt * 7.5));              // frame-rate independent
    const p = pSm;
    if (r.bottom < -50) return; // stage offscreen

    const km = 1 - Math.exp(-dt * 2.2); m.x += (m.tx - m.x) * km; m.y += (m.ty - m.y) * km;
    // slow majestic dolly
    const z = Z0 + (Z1 - Z0) * easeIO(Math.min(1, t / 26)) - p * 0.6;
    camera.position.set(m.x * 0.18, -m.y * 0.12, z); camera.lookAt(0, 0, 0);
    // world size so the grains land exactly on the CSS emblem (which is scaled by Z0/z)
    uniforms.uScale.value = emPx / H * 2 * Z0 * tanH;
    pts.rotation.y = m.x * 0.1; pts.rotation.x = m.y * 0.08;

    const form = Math.min(1, Math.max(0, (t - 0.35) / 4.4));
    uniforms.uTime.value = t; uniforms.uForm.value = form;
    const solid = sm(3.3, 5.2, t) * (1 - sm(0.03, 0.22, p));
    uniforms.uSolid.value = sm(3.3, 5.2, t);
    uniforms.uBlow.value = sm(0.02, 0.5, p);
    // the page's global light band, mapped into emblem space (same direction, same cadence)
    const D = NX ? NX.bandAt(t, W, innerHeight) : null;
    const S = emPx * Z0 / z, Dc = (W / 2) * 0.788 + (r.top + H / 2 > 0 ? H / 2 : 0) * 0.616;
    uniforms.uSweep.value = D == null ? -9 : (D - Dc) / S;
    const lx = m.x * 0.5 - 0.15, ly = -m.y * 0.5 + 0.2;
    uniforms.uLight.value.set(lx, ly);

    // CSS hand-off
    sticky.style.setProperty('--em', (emPx).toFixed(1) + 'px');
    emWrap.style.transform = `scale(${(Z0 / z).toFixed(4)})`;
    sticky.style.setProperty('--solid', solid.toFixed(3));
    sticky.style.setProperty('--intro', (sm(4.6, 6.0, t) * (1 - sm(0.0, 0.07, p))).toFixed(3));
    sticky.style.setProperty('--hp', sm(0.2, 0.5, p).toFixed(3));
    sticky.style.setProperty('--hs', (0.0 + sm(0.2, 0.8, p) * 1.3).toFixed(3));
    sticky.style.setProperty('--lp', sm(0.42, 0.62, p).toFixed(3));
    emblem.style.setProperty('--ry', (m.x * 6).toFixed(2) + 'deg');
    emblem.style.setProperty('--rx', (-m.y * 5).toFixed(2) + 'deg');

    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}
