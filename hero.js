import * as THREE from 'three';
/* v12g: the disc, its shade, the glow and the ring now share one plane (z=0) inside the same group, so they stay exactly concentric
   at any tilt, parallax or DPR; the disc edge is an antialiased circle at the ring's centre line (the hairline covers it), its shading is
   concentric, and the offset page shadow is gone. The page-grain cut-out follows the canvas rect and sits just inside the ring, fading in
   with the disc. The face is one continuous polished-steel gradient (soft bands, no horizon step, no hot line); only the bevel stays crisp.
   Formation is one motion: the metal fades in underneath (a smooth diagonal reveal, top-left to bottom-right) while grains are still
   landing, and each grain dissolves exactly as the metal under it appears; both finish by ~5.8s, the first glint follows at ~6.0s.
   v12f: the settled mark is 100% clean and mirror-polished. Every grain that lands on the badge (face, chamfers, ring) crossfades out
   completely once the mark is formed (4.6–7.0s) and only returns as the mark peels away on scroll; the residual shimmer now lives
   in a sparse ring of dust off the badge. The brushed-noise texture is gone: the face is a smooth, gradient-only polished steel
   (near-white sky bands, a razor horizon reflection that shifts as the badge turns, cooler steel-blue below) with a crisp bright
   bevel. After forming, a narrow specular glint crosses it like sun on a blade (flaring where it crosses an edge), repeating
   softly every 8s. The page grain overlay is masked out over the badge (hero.js sets --gmask), and the canvas runs at full DPR (cap 3).
   v12e: timing only: a quicker gathering (mark formed by ~5.9s, was 8.6s), first sheen at 6.6s, and a slower vanish:
   loose grains fade over ~7.2s (was ~3.6s), the shimmer eases to its residual over ~19s (was ~9.4s), and scroll dispersal trails the scroll for a longer drift.
   v12d (Swell master mark): a slower, eased grain gathering (about 8.5s) that never just vanishes: a fine shimmer lingers on and around the mark,
   then settles to a permanent residual texture. The mark reads as brushed platinum with one light direction (top left),
   a soft contact shadow and inner shade on the disc, a calmer ring, a slower and softer sheen and ring light (8s apart),
   and a DPR of up to 2 so every edge is pixel-crisp.
   v12c: the ring is a crisp, luminous light edge (a bright Frost core with a tight Ice falloff of a few px, a brighter top-left arc
   and a slow light travelling round it); the wide fuzzy ring glow is gone. The mark is larger and its face near-white Frost.
   v12b: the settled mark is now a bright Frost / platinum face with a slim diagonal sheen every 6s, a soft Ice glow,
   a brighter Frost ring, a slightly lifted disc, and the mark 7% larger in the circle.
   v12d: the emblem is the original Swell mark (an N whose diagonal is a swelling S, joined to full-height hairline stems)
   set inside a hairline circle; grains form both the mark and the ring, and are ~20% brighter than v11.
   Nexus Studio v8 hero (midnight sapphire N; v8: shaders pre-compiled + warmed before the clock starts, grains shed by a soft fade instead of a hard cut, no DPR change at runtime, slower graceful exit): grains converge into a solid black-chrome "N" (thin stems, heavy diagonal) with platinum chamfers.
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
  const DPR_MAX = Math.min(devicePixelRatio || 1, 3);   // v12f: full device pixel ratio (cap 3) for a vector-crisp mark
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
  // Swell mark in unit space (y up, CCW): full-height hairline stems joined by the S-swelling diagonal, 0.60 tall before MK, inside a ring of radius RING
  const POLYS = [[[-0.195,0.1177],[-0.1868,0.1017],[-0.1783,0.0873],[-0.1691,0.0737],[-0.1579,0.0591],[-0.146,0.0454],[-0.1334,0.0326],[-0.1202,0.0205],[-0.1052,0.0081],[-0.0928,-0.0013],[-0.0787,-0.0111],[-0.0469,-0.031],[-0.0152,-0.0486],[0.0524,-0.0839],[0.0826,-0.1013],[0.0969,-0.1106],[0.1094,-0.1198],[0.1214,-0.1296],[0.1318,-0.1393],[0.146,-0.155],[0.1581,-0.1716],[0.1683,-0.1888],[0.1772,-0.2084],[0.1846,-0.2302],[0.1899,-0.2523],[0.1935,-0.2764],[0.195,-0.3],[0.225,-0.3],[0.225,0.3],[0.195,0.3],[0.195,-0.1177],[0.1868,-0.1017],[0.1783,-0.0873],[0.1691,-0.0737],[0.1579,-0.0591],[0.146,-0.0454],[0.1334,-0.0326],[0.1202,-0.0205],[0.1051,-0.0081],[0.0928,0.0013],[0.0787,0.0111],[0.0469,0.031],[0.0152,0.0486],[-0.0524,0.0839],[-0.0826,0.1013],[-0.0969,0.1107],[-0.1094,0.1198],[-0.1214,0.1296],[-0.1318,0.1393],[-0.146,0.155],[-0.1581,0.1716],[-0.1683,0.1888],[-0.1772,0.2084],[-0.1846,0.2302],[-0.1899,0.2523],[-0.1935,0.2764],[-0.195,0.3],[-0.225,0.3],[-0.225,-0.3],[-0.195,-0.3]]];
  const RING = .46, RING_T = .0026, MK = 1.1;   // v12c: mark .66 tall, bolder in the circle   // ring radius, ring tube, mark scale (v12b: .60 tall, larger in the circle)
  const DEPTH = .035, BT = .008, BS = .004;   // v12b: a slimmer slab, so the bright face dominates
  POLYS.forEach(P => P.forEach(v => { v[0] *= MK; v[1] *= MK; }));
  const shapes = POLYS.map(P => { const sh = new THREE.Shape(); P.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath(); return sh; });
  const ngeo = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelSegments: 1, curveSegments: 1 });
  ngeo.translate(0, 0, -DEPTH / 2);
  const FRONT = DEPTH / 2 + BT;

  const U = {
    uTime: { value: 0 }, uForm: { value: 0 }, uBlow: { value: 0 }, uSolid: { value: 0 },
    uSweep: { value: -9 }, uLight: { value: new THREE.Vector2(-0.3, 0.35) },
    uSize: { value: mobile ? 2.9 : 2.5 }, uDpr: { value: dpr }, uKeep: { value: 1.001 }, uLinger: { value: 1 }, uFade: { value: 0 }, uClean: { value: 0 }, uTilt: { value: 0 }, uRev: { value: 0 }
  };

  // v12g: one reveal field for metal and grains: a soft diagonal front, top-left first (grains arrive left to right)
  const REVEAL = `float revAt(vec2 q, float t){ float g = (q.x + 0.5) * 0.62 + (0.42 - q.y) * 0.26; return smoothstep(g - 0.02, g + 0.34, t); }`;
  // shared dissolve + inner glow + light band, injected into the physical material
  function jewelize(mat, kind) {
    mat.defines = Object.assign(mat.defines || {}, kind === 'gem' ? { IS_GEM: '' } : { IS_RING: '' });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uTime: U.uTime, uSolid: U.uSolid, uBlow: U.uBlow, uSweep: U.uSweep, uTilt: U.uTilt, uRev: U.uRev });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoc;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoc = position;   // v12g: object (unit) space, fixed to the mark');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vLoc; uniform float uTime,uSolid,uBlow,uSweep,uScaleInv,uTilt,uRev;
        float hsh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
        ` + REVEAL)
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 lp = vLoc;                                   // unit space
        float nz = hsh(floor(lp.xy*320.0));
        float xn = lp.x + 0.5;
        float rv = revAt(lp.xy, uRev);                    // v12g: a smooth fade-in under the arriving grains (no speckled discard)
        float vout = uBlow*1.7 - (xn*0.55 + nz*0.15);     // peels away exactly where the grains blow off
        if (rv < 0.002 || vout > 0.02) discard;
        float edgeGlow = rv * (1.0 - rv) * 0.9 + (1.0 - smoothstep(-0.12, 0.02, -vout + 0.02)) * step(0.0005, uBlow);`)
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
          float face = smoothstep(0.55, 0.92, ndv);
          // v12f: a narrow specular glint, like sunlight catching a blade: a razor core with a faint halo, first pass at 7.2s, then softer every 8s
          float sd = dot(lp.xy, vec2(0.80, -0.60));
          float st = uTime - 6.0;   // v12g: right after the reveal completes
          float sp = st > 0.0 ? -0.62 + mod(st, 8.0) * 0.95 : -9.0;
          float amp = (st < 8.0 ? 1.0 : 0.6) * smoothstep(0.85, 1.0, uSolid);
          float gx = sd - sp;
          float gcore = exp(-pow(gx * 70.0, 2.0));
          float sheen = (1.0 * gcore + 0.30 * exp(-pow(gx * 16.0, 2.0))) * amp;
          float shadeG = 1.0 - 0.22 * exp(-pow(gx * 9.0, 2.0)) * amp;   // the face dips a touch either side of the glint, so the light line reads razor-sharp even on the bright bands
          vec3 wN2 = inverseTransformDirection(normal, viewMatrix);
          #ifdef IS_GEM
            // v12g: mirror-polished steel as one continuous gradient: soft highlight bands, no horizon step, no hot line
            vec2 q = lp.xy;
            float hy = q.y + q.x * 0.30 - 0.045 + uTilt;              // the reflection still drifts as the badge turns
            vec3 steel = mix(vec3(0.46, 0.58, 0.80), vec3(0.15, 0.22, 0.37), smoothstep(-0.38, -0.05, hy));   // steel-blue low, deepening toward the middle
            steel += vec3(0.20, 0.27, 0.40) * exp(-pow((hy + 0.23) / 0.07, 2.0));                           // a soft floor-bounce band
            steel = mix(steel, vec3(1.05, 1.12, 1.24), smoothstep(-0.07, 0.07, hy));                        // a smooth rise into the bright sky (no step)
            steel += vec3(0.85, 0.85, 0.82) * exp(-pow((hy - 0.12) / 0.065, 2.0));                          // the brightest band, soft-edged
            steel = mix(steel, vec3(1.10, 1.18, 1.32), smoothstep(0.24, 0.40, hy));                         // the top rolls off a touch
            // crisp bevel: near-white where it faces the key light (top left), cool steel where it turns away
            float kb = dot(normalize(wN2.xy + vec2(1e-4)), normalize(vec2(-0.55, 0.83)));
            vec3 bevC = mix(vec3(0.30, 0.40, 0.58), vec3(2.6, 2.65, 2.75), smoothstep(-0.35, 0.65, kb));
            totalEmissiveRadiance += steel * shadeG * face
                                   + bevC * (1.0 - face) + chm * 0.8
                                   + vec3(1.0, 1.02, 1.05) * sheen * (4.2 * face + 7.0 * (1.0 - face))   // flares where it crosses an edge
                                   + vec3(0.86, 0.92, 1.00) * band * (0.04 + fres * 0.4)
                                   + vec3(0.70, 0.82, 0.98) * edgeGlow * 1.1;
          #else
            // v12b: the ring is a crisp Frost hairline
            // v12c: a lit fibre edge: a bright Frost core, brighter round the top left, with a slow light travelling round it
            float ang = atan(lp.y, lp.x);
            float arc = 0.62 + 0.38 * pow(0.5 + 0.5 * cos(ang - 2.2), 2.0);
            float tr = 2.2 - uTime * 0.26;   // v12d: slower, one lap in ~24s
            float trav = 0.6 * exp(-pow(atan(sin(ang - tr), cos(ang - tr)) * 2.6, 2.0)) * smoothstep(0.85, 1.0, uSolid);
            totalEmissiveRadiance += vec3(0.88, 0.94, 1.03) * (0.95 * arc + 0.8 * trav) + chm + vec3(1.0) * gcore * amp * 3.0
                                   + vec3(0.86, 0.92, 1.00) * band * 0.3 + vec3(0.70, 0.82, 0.98) * edgeGlow * 1.1;
          #endif
        }`)
        .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        gl_FragColor.a *= rv;`);
      sh.uniforms.uScaleInv = scaleInv;
    };
  }
  const scaleInv = { value: 1 };
  // satin black chrome: a metal body that only shows the studio as long, soft reflections
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#9aa8bd'), metalness: 1.0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04,
    envMapIntensity: 0.22, flatShading: true   // v12f: the emissive steel gradient carries the look; env adds only a faint live reflection
  });
  gemMat.transparent = true; jewelize(gemMat, 'gem');
  const gem = new THREE.Mesh(ngeo, gemMat);

  // the ring: a hairline of brushed platinum, dissolving with the mark
  const ringMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#c9d5e6'), metalness: 1.0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.9 });
  ringMat.transparent = true; jewelize(ringMat, 'ring');
  const ring = new THREE.Mesh(new THREE.TorusGeometry(RING, RING_T, 10, 420), ringMat);
  // the disc: a quiet midnight fill behind the mark, so the emblem reads as a badge against the stars
  const discMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vP; uniform float uSolid,uBlow;
      void main(){
        float r = length(vP) / ${RING.toFixed(3)};
        vec3 c = mix(vec3(0.070,0.125,0.245), vec3(0.026,0.046,0.100),   // v12b: lifted a touch
           smoothstep(0.0, 1.05, length(vP - vec2(0.0, 0.10)) / ${RING.toFixed(3)}));
        float rim = smoothstep(0.93, 1.0, r) * 0.35;   // v12c: a tighter inner lift
        c *= 1.0 - smoothstep(0.62, 0.99, r) * 0.36;   // v12g: a concentric inner shade (no offset)
        c += vec3(0.33,0.50,0.70) * rim * 0.32 * (0.55 + 0.45 * smoothstep(-0.2, 0.6, vP.y / ${RING.toFixed(3)}));
        float lr = length(vP), fw = max(fwidth(lr), 1e-5);
        float a = smoothstep(0.0, 1.0, uSolid) * (1.0 - smoothstep(-0.1, 0.25, uBlow*1.7 - (vP.x+0.5)*0.55));
        a *= 1.0 - smoothstep(${RING.toFixed(3)} - fw, ${RING.toFixed(3)}, lr);   // v12g: an exact, antialiased edge on the ring's centre line
        gl_FragColor = vec4(c * a, a);
      }`,
    premultipliedAlpha: true
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(RING + .006, 256), discMat);
  disc.position.z = 0; disc.renderOrder = -2;   // v12g: in the ring's own plane, so no parallax can separate them
  // v12c: the ring's light edge: a tight Ice / Sapphire falloff of a few px either side of the core (no wide haze)
  const rimMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vP; uniform float uTime,uSolid,uBlow;
      void main(){
        float d = length(vP) - ${RING.toFixed(3)};
        float w = d > 0.0 ? 0.0042 : 0.0034;                         // a touch tighter on the inside
        float e = exp(-abs(d) / w) + 0.10 * exp(-abs(d) / 0.012);     // tight bloom + a whisper of air
        float ang = atan(vP.y, vP.x);
        float arc = 0.55 + 0.45 * pow(0.5 + 0.5 * cos(ang - 2.2), 2.0);
        float tr = 2.2 - uTime * 0.26;   // v12d: slower, one lap in ~24s
        float trav = 0.6 * exp(-pow(atan(sin(ang - tr), cos(ang - tr)) * 2.6, 2.0)) * smoothstep(0.85, 1.0, uSolid);
        vec3 c = mix(vec3(0.30, 0.52, 1.00), vec3(0.62, 0.80, 1.00), exp(-abs(d) / 0.004)) * e * (0.62 * arc + 0.7 * trav);   // v12d: calmer, elegant rather than neon
        c *= smoothstep(0.3, 1.0, uSolid) * (1.0 - smoothstep(-0.1, 0.25, uBlow*1.7 - (vP.x+0.5)*0.55));
        gl_FragColor = vec4(c, clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0));
      }`,
    premultipliedAlpha: true
  });
  const rim = new THREE.Mesh(new THREE.RingGeometry(RING - .05, RING + .06, 512, 1), rimMat);
  rim.position.z = RING_T * .5; rim.renderOrder = 1;
  // v12b: soft Ice / Sapphire glow for presence: the mark (red) and the ring (green), blurred once into a canvas texture
  const GL = 1.3, gc = document.createElement('canvas'); gc.width = gc.height = 512;   // a pre-blurred mask, so 512 is plenty
  { const x = gc.getContext('2d'), k = 512 / GL, T = v => [256 + v[0] * k, 256 - v[1] * k];
    x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.globalCompositeOperation = 'lighter';
    x.filter = 'blur(14px)'; x.fillStyle = '#ff0000';
    POLYS.forEach(P => { x.beginPath(); P.forEach((v, i) => { const [a, b] = T(v); i ? x.lineTo(a, b) : x.moveTo(a, b); }); x.closePath(); x.fill(); });
  }   // v12c: the ring no longer has a blurred glow
  const glowTex = new THREE.CanvasTexture(gc);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uG: { value: glowTex } }, U), transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vU; varying vec2 vP; void main(){ vU = uv; vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vU; varying vec2 vP; uniform sampler2D uG; uniform float uSolid,uBlow;
      void main(){
        vec4 t = texture2D(uG, vU);
        vec3 c = vec3(0.42, 0.62, 1.00) * t.r * 0.06;   // v12f: a whisper, so the edges read sharp
        c *= smoothstep(0.3, 1.0, uSolid) * (1.0 - smoothstep(-0.1, 0.25, uBlow*1.7 - (vP.x+0.5)*0.55));
        gl_FragColor = vec4(c, clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0));
      }`,
    premultipliedAlpha: true
  });
  const shadeMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uG: { value: glowTex } }, U), transparent: true, depthWrite: false, depthTest: true,
    vertexShader: `varying vec2 vU; varying vec2 vP; void main(){ vU = uv; vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vU; varying vec2 vP; uniform sampler2D uG; uniform float uSolid,uBlow;
      void main(){
        float R = ${RING.toFixed(3)};
        float ms = texture2D(uG, vU + vec2(-0.006, 0.008)).r * 0.30 * (1.0 - smoothstep(R - 0.04, R - 0.01, length(vP)));   // v12g: a soft, subtle contact shadow, inside the disc only
        float a = ms * smoothstep(0.3, 1.0, uSolid) * (1.0 - smoothstep(-0.1, 0.25, uBlow*1.7 - (vP.x+0.5)*0.55));
        gl_FragColor = vec4(0.0, 0.0, 0.0, a);
      }`
  });
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(GL, GL), shadeMat);
  shade.position.z = 0; shade.renderOrder = -1;   // v12g: same plane as disc and ring
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(GL, GL), glowMat);
  glow.position.z = 0; glow.renderOrder = 0;
  const jewel = new THREE.Group();
  jewel.add(disc); jewel.add(shade); jewel.add(glow); jewel.add(gem); jewel.add(ring); jewel.add(rim);
  scene.add(jewel);

  // ---------- grains: sampled from the same outline and the same depth as the solid N ----------
  const inOne = (NP, x, y) => { let c = false; for (let i = 0, j = NP.length - 1; i < NP.length; j = i++) { const [xi, yi] = NP[i], [xj, yj] = NP[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
  const inPoly = (x, y) => POLYS.some(P => inOne(P, x, y));
  const edges = POLYS.flatMap(NP => NP.map((p, i) => { const q = NP[(i + 1) % NP.length]; return { p, q, len: Math.hypot(q[0] - p[0], q[1] - p[1]) }; }));
  const per = edges.reduce((s, e) => s + e.len, 0);
  const sgn = 1;                             // every outline is counter-clockwise in y-up space

  const aT = new Float32Array(COUNT * 3), aC = new Float32Array(COUNT * 3), aS = new Float32Array(COUNT * 4), aK = new Float32Array(COUNT), aR = new Float32Array(COUNT), aF = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = Math.random();
    let tx, ty, tz, cls;
    if (i < COUNT * 0.07) {   // v12f: dust that settles off the badge, carrying the residual shimmer around it (never on the face)
      cls = 3; const th = Math.random() * Math.PI * 2, rr = RING * (1.14 + Math.pow(Math.random(), 0.7) * 1.1);
      tx = Math.cos(th) * rr; ty = Math.sin(th) * rr * 0.86; tz = (Math.random() - .5) * 0.3;
    } else if (r < .5) {             // polished face
      cls = 0; do { tx = (Math.random() * .45 - .225) * MK; ty = (Math.random() * .6 - .3) * MK; } while (!inPoly(tx, ty));
      tz = FRONT;
    } else if (r > .87) {     // the ring
      cls = 2; const th = Math.random() * Math.PI * 2, rr = RING + (Math.random() - .5) * RING_T * 2.2;
      tx = Math.cos(th) * rr; ty = Math.sin(th) * rr; tz = (Math.random() - .5) * RING_T * 2;
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
    const bright = cls === 3 ? 0.45 + Math.random() * 0.4 : cls === 0 ? 0.5 + Math.random() * 0.4 : cls === 2 ? 0.7 + Math.random() * 0.45 : 0.8 + Math.random() * 0.5;
    aS[i * 4] = delay; aS[i * 4 + 1] = 0.6 + Math.random() * 0.9; aS[i * 4 + 2] = bright; aS[i * 4 + 3] = Math.random();
    // silver-blue grains with a share of ice-sapphire: a few on the face and edges, rare pale sparks
    const pe = cls === 0 ? .16 : .12;
    aK[i] = Math.random() < pe ? (Math.random() < .06 ? 1.0 : .7) : 0;
    aF[i] = cls === 0 ? 1 : cls === 3 ? 2 : 0;   // 1 face, 2 off-badge dust               // v12d: face grains rest quieter so the platinum face stays clean
    aR[i] = i / COUNT;                       // rank: adaptive quality fades out the top ranks, never cuts them
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(aT, 3));
  geo.setAttribute('aChaos', new THREE.BufferAttribute(aC, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aS, 4));
  geo.setAttribute('aEm', new THREE.BufferAttribute(aK, 1));
  geo.setAttribute('aRank', new THREE.BufferAttribute(aR, 1));
  geo.setAttribute('aFace', new THREE.BufferAttribute(aF, 1));
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
    vertexShader: NOISE + REVEAL + `
      attribute vec3 aChaos; attribute vec4 aSeed; attribute float aEm; attribute float aRank; attribute float aFace;
      uniform float uTime,uForm,uBlow,uSolid,uSweep,uSize,uDpr,uKeep,uLinger,uFade,uClean,uRev; uniform vec2 uLight;
      varying vec3 vCol; varying float vA; varying float vSpec;
      void main(){
        float f=clamp((uForm*1.75-aSeed.x)/1.0,0.0,1.0);
        float fe=f>=1.0?1.0:1.0-pow(1.0-f,3.0)*(1.0-f*0.4);   // v12d: a softer, longer ease-out (no snap)
        float xn=position.x+0.5;
        float b=clamp(uBlow*1.7-xn*0.55-aSeed.w*0.15,0.0,1.0);
        vec3 p=mix(aChaos,position,fe);
        float wild=(1.0-fe)+b;
        if(wild>0.002){
          vec3 c=curl(p*1.15+vec3(0.0,0.0,uTime*0.06));
          p+=c*(1.0-fe)*0.55;
          float bb=b*b;
          p+=(c*0.9+vec3(1.35,0.38,0.7))*bb*(0.75+aSeed.w*0.6);   // v12e: a gentler, longer drift (was 1.2+seed)
        }
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*mv;
        float dof=1.0+(1.0-fe)*abs(p.z)*0.9+b*0.6;
        gl_PointSize=uSize*aSeed.y*uDpr*(10.0/-mv.z)*dof;
        float br=aSeed.z*mix(0.55,1.0,fe);
        float band=exp(-pow((dot(position.xy,vec2(0.788,-0.616))-uSweep)*7.0,2.0));
        float glint=pow(aSeed.w,10.0);
        float l=exp(-dot(position.xy-uLight,position.xy-uLight)*7.0);
        float settle=uFade*fe*(1.0-b);                  // v12e: grains step back on their own, slower clock (2x the v12d fade)
        float tw=0.55+0.45*sin(uTime*(0.9+aSeed.y*1.4)+aSeed.w*60.0);   // v12d: a slow shimmer
        float dust=step(1.5,aFace), fc=step(0.5,aFace)*(1.0-dust);
        float rest=(0.16+0.30*uLinger)*tw*mix(1.0,0.5,fc)*mix(1.0,1.5,dust);   // a fine layer lingers (lighter on the face), then stays as a residual texture
        float k=((br*0.48 + l*0.28*br + (1.0-fe)*0.12)*mix(1.0,rest,settle) + band*(0.55+glint*5.0)*mix(1.0,0.08,settle))*1.2;   // v12: grains ~20% brighter
        vec3 plat=mix(vec3(0.84,0.89,0.97),vec3(0.93,0.95,1.00),aSeed.w);
        vec3 jade=mix(vec3(0.52,0.68,0.92),vec3(0.78,0.88,1.00),step(0.95,aEm));
        vCol=mix(plat,jade,step(0.5,aEm))*k;
        vA=(1.0-smoothstep(0.35,1.0,b))*smoothstep(0.0,0.08,uForm+0.02)/(dof*dof)*(1.0-smoothstep(uKeep-0.06,uKeep,aRank));
        float rg=revAt(position.xy,uRev)*(0.35+0.65*fe);   // v12g: each grain dissolves as the metal under it appears (a grain still in flight waits)
        vA*=1.0-max(rg,uClean)*(1.0-dust)*(1.0-smoothstep(0.0,0.12,b));   // v12f: every grain on the badge crossfades out completely; it returns only as the mark peels away
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
    emPx = mobile || W < 760 ? Math.min(W * 0.7, H * 0.42) : Math.min(H * 0.59, W * 0.4, 580);   // v12c: a bit larger
    const s = emPx / H * 2 * Z0 * tanH;
    jewel.scale.setScalar(s); scaleInv.value = 1 / s;
    setVar('--emsz', emPx.toFixed(1) + 'px');
  }
  const last = {};
  const setTf = (el, v) => { if (el.__tf !== v) { el.__tf = v; el.style.transform = v; } };
  function setRootVar(k, v) { if (last[k] !== v) { last[k] = v; root.style.setProperty(k, v); } }
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
  let r = null, pSm = 0, bSm = 0;
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
    const idle = sm(5.2, 7.8, t);   // v12e (v12d 7.5–11)
    jewel.rotation.y = m.x * 0.16 + Math.sin(t * 0.21) * 0.10 * idle;
    jewel.rotation.x = m.y * 0.10 + Math.sin(t * 0.17 + 1.3) * 0.045 * idle;

    // v8: the N leaves slowly, turning a little as it goes; the horizon sinks and the stars drift with the cursor
    jewel.rotation.y += sm(0.0, 0.8, p) * 0.5;
    jewel.position.y = .056 + sm(0.0, 0.8, p) * 0.06;   // v12c: a little higher for the larger badge   // v12: lifted a touch so the ring clears the intro
    if (planet) setTf(planet, `translate3d(${(m.x * -10).toFixed(1)}px,${(p * 90 + m.y * -4).toFixed(1)}px,0)`);
    if (sky) setTf(sky, `translate3d(${(m.x * -18).toFixed(1)}px,${(m.y * -12 - p * 60).toFixed(1)}px,0)`);
    const form = Math.min(1, Math.max(0, (t - 0.35) / 5.0));   // v12e: quicker gathering (v12d 7.4s, v12c 4.4s)
    U.uTime.value = t; U.uForm.value = form;
    U.uSolid.value = sm(3.4, 5.9, t);   // v12e: mark formed by ~5.9s (v12d 8.6s)
    U.uFade.value = sm(3.6, 10.8, t);
    U.uRev.value = Math.min(1.0, Math.max(0, (t - 3.3) / 2.5)) * 1.12;   // v12g: the metal reveal runs 3.3–5.8s, under the arriving grains
    U.uClean.value = sm(5.6, 6.0, t);   // v12g: a safety net only; the reveal already cleared the badge
    U.uTilt.value = jewel.rotation.y * 0.22 - jewel.rotation.x * 0.18;   // the horizon reflection drifts as it turns   // v12e: loose grains fade over ~7.2s (v12d ~3.6s)
    U.uLinger.value = 1 - sm(6.0, 25.0, t);          // v12e: the shimmer eases down to a residual over ~19s (v12d ~9.4s)
    bSm += (sm(0.0, 1.0, p) - bSm) * (1 - Math.exp(-dt * 1.8));   // v12e: scroll dispersal trails the scroll, ~2x slower drift and fade
    U.uBlow.value = bSm > 0.9995 ? 1 : bSm;
    const D = NX.bandAt(t, W, innerHeight);
    const S = emPx * Z0 / z, Dc = (W / 2) * 0.788 + (r.top + H / 2 > 0 ? H / 2 : 0) * 0.616;
    U.uSweep.value = D == null ? -9 : (D - Dc) / S;
    U.uLight.value.set(m.x * 0.5 - 0.15, -m.y * 0.5 + 0.2);
    gem.visible = U.uSolid.value > 0.001 && U.uBlow.value < 0.999;   // program + env map were warmed before t=0, so first use costs nothing

    setVar('--solid', (sm(3.6, 6.1, t) * (1 - sm(0.03, 0.5, p))).toFixed(3));
    setVar('--intro', (sm(5.5, 7.0, t) * (1 - sm(0.0, 0.24, p))).toFixed(3));
    setVar('--hp', sm(0.42, 0.76, p).toFixed(3));
    setVar('--hs', (sm(0.42, 0.98, p) * 1.3).toFixed(3));
    setVar('--lp', sm(0.58, 0.86, p).toFixed(3));
    NX.heroP = p;
    // v12f: keep the page grain off the badge: project its centre and ring, then cut a hole in the fixed grain overlay
    if (U.uBlow.value < 0.98 && U.uSolid.value > 0.001) {
      jewel.updateMatrixWorld(); camera.updateMatrixWorld();
      const c0 = new THREE.Vector3(0, 0, 0).applyMatrix4(jewel.matrixWorld).project(camera);
      const c1 = new THREE.Vector3(RING, 0, 0).applyMatrix4(jewel.matrixWorld).project(camera);
      const c2 = new THREE.Vector3(0, RING, 0).applyMatrix4(jewel.matrixWorld).project(camera);
      const cr = renderer.domElement.getBoundingClientRect();   // v12g: follow the canvas itself
      const cx = cr.left + (c0.x + 1) * cr.width / 2, cy = cr.top + (1 - c0.y) * cr.height / 2;
      const rad = Math.min(Math.hypot((c1.x - c0.x) * cr.width / 2, (c1.y - c0.y) * cr.height / 2), Math.hypot((c2.x - c0.x) * cr.width / 2, (c2.y - c0.y) * cr.height / 2)) - 1.5;   // just inside the ring: the hairline hides the edge
      const ga = (1 - sm(0.0, 1.0, U.uSolid.value)).toFixed(3);   // the cut-out fades in with the disc
      setRootVar('--gmask', `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, rgba(0,0,0,${ga}) ${(rad - 1.5).toFixed(1)}px, #000 ${rad.toFixed(1)}px)`);
    } else setRootVar('--gmask', 'none');
    renderer.render(scene, camera);
  });
}
