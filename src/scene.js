// The hero plate: a real ceramic plate built in 3D (well, raised rim, rounded lip,
// foot ring underneath) with the café's own top-down photograph draped over it.
// A glossy glaze layer catches studio reflections that slide as the plate turns
// and as the cursor moves the key light.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const lerp = (a, b, t) => a + (b - a) * t;
const R = 1.9;

// Plate cross-section (radius 0..1 → height), top surface and underside.
const PROFILES = {
  bowl: { well: 0.5, wallTo: 0.6, wallH: 0.075, rimH: 0.2, lip: 0.035 }, // wide-rim pasta plate
  flat: { well: 0.66, wallTo: 0.76, wallH: 0.04, rimH: 0.11, lip: 0.03 }, // dinner plate
};

function topProfile(p) {
  const pts = [];
  const N = 260; // dense, so the food relief has crisp edges
  for (let i = 0; i <= N; i++) {
    const r = (i / N) * 0.985;
    let h;
    if (r <= p.well) h = 0;
    else if (r <= p.wallTo) {
      const t = (r - p.well) / (p.wallTo - p.well);
      h = p.wallH * (t * t * (3 - 2 * t));
    } else {
      const t = (r - p.wallTo) / (0.985 - p.wallTo);
      h = p.wallH + (p.rimH - p.wallH) * Math.pow(t, 1.35);
    }
    pts.push(new THREE.Vector2(Math.max(r * R, 0.0001), h * R));
  }
  return pts.reverse(); // outer → inner so the lathe's front faces point up, at the camera
}

function underProfile(p) {
  // from the lip, round over the edge, down the underside to the foot ring and the base
  const pts = [];
  const top = p.rimH * R;
  const lipR = 0.985 * R;
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    pts.push(new THREE.Vector2(lipR + Math.sin(a) * p.lip * R * 0.5, top - (1 - Math.cos(a)) * p.lip * R * 0.5));
  }
  const edgeBottom = top - p.lip * R;
  const foot = p.well * R * 0.9;
  const base = -0.05 * R;
  const N = 40;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const r = lerp(lipR, foot + 0.03 * R, t);
    pts.push(new THREE.Vector2(r, lerp(edgeBottom, base + 0.01 * R, Math.pow(t, 0.7))));
  }
  pts.push(new THREE.Vector2(foot, base));
  pts.push(new THREE.Vector2(foot - 0.03 * R, base));
  pts.push(new THREE.Vector2(foot - 0.05 * R, base + 0.025 * R));
  pts.push(new THREE.Vector2(0.0001, base + 0.025 * R));
  return pts.reverse(); // so the underside's front faces point down and out
}

function lathe(points, planarUV, segments = 180) {
  const g = new THREE.LatheGeometry(points, segments);
  if (planarUV) {
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2 * R), 0.5 - pos.getZ(i) / (2 * R));
  }
  g.rotateX(Math.PI / 2); // height axis → towards camera
  g.computeVertexNormals();
  return g;
}

// ── food relief ──────────────────────────────────────────────
// Reads the top-down photo, separates the food from the plate by colour, and builds a
// height map (food raised with softly rounded edges, nuts and piped cream bumped up)
// plus a matching normal map, so the dish has real depth and catches the light.
const blurPass = (src, w, r) => {
  const out = new Float32Array(src.length);
  const tmp = new Float32Array(src.length);
  for (let y = 0; y < w; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / (2 * r + 1);
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(w - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < w; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[Math.min(w - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
};
const blur = (src, w, r, passes = 2) => {
  let a = src;
  for (let i = 0; i < passes; i++) a = blurPass(a, w, r);
  return a;
};
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function buildRelief(image, wellR) {
  const W = 512;
  const c = document.createElement('canvas');
  c.width = c.height = W;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(image, 0, 0, W, W);
  const px = g.getImageData(0, 0, W, W).data;
  const C = W / 2;

  // the plate's own colour: median of a ring just outside where food usually sits
  const ring = [[], [], []];
  const rr = C * Math.min(0.6, wellR + 0.04);
  for (let a = 0; a < 720; a++) {
    const x = Math.round(C + Math.cos((a / 720) * Math.PI * 2) * rr);
    const y = Math.round(C + Math.sin((a / 720) * Math.PI * 2) * rr);
    const i = (y * W + x) * 4;
    ring[0].push(px[i]); ring[1].push(px[i + 1]); ring[2].push(px[i + 2]);
  }
  const floor = ring.map((ch) => ch.sort((p, q) => p - q)[ch.length >> 1]);

  const lum = new Float32Array(W * W);
  const raw = new Float32Array(W * W);
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const r = px[i * 4], gg = px[i * 4 + 1], b = px[i * 4 + 2];
      lum[i] = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
      const d = Math.hypot(r - floor[0], gg - floor[1], b - floor[2]);
      const rad = Math.hypot(x - C, y - C) / C;
      raw[i] = smooth(38, 85, d) * (1 - smooth(wellR - 0.03, wellR + 0.03, rad));
    }
  // close small gaps (piped cream on a cake reads like plate colour), then round the edges
  // morphological closing: grow the mask, then shrink it back, so holes inside the food fill
  // in (piped cream, nuts) while the outline stays where it is
  const grown = blur(raw, W, 12, 1).map((v) => (v > 0.12 ? 1 : 0));
  const filled = blur(grown, W, 12, 1).map((v) => (v > 0.88 ? 1 : 0));
  const closed = filled.map((v, i) => Math.max(v, smooth(0.35, 0.6, raw[i])));
  const body = blur(closed, W, 6);
  const lumBlur = blur(lum, W, 5);
  const h = new Float32Array(W * W);
  for (let i = 0; i < h.length; i++) {
    const hp = lum[i] - lumBlur[i]; // fine texture: crumbs, nuts, crackle
    const cream = Math.max(0, lum[i] - 0.82) / 0.18; // bright toppings sit higher
    h[i] = body[i] * (0.92 + Math.max(0, hp) * 0.45 + cream * 0.04 * closed[i]);
  }
  const hs = blur(h, W, 1, 1);
  let max = 0;
  for (const v of hs) max = Math.max(max, v);
  const k = max > 0 ? 1 / max : 0;

  const disp = g.createImageData(W, W);
  const nrm = g.createImageData(W, W);
  const S = 7; // normal strength
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const v = Math.max(0, hs[i] * k);
      disp.data.set([v * 255, v * 255, v * 255, 255], i * 4);
      const l = hs[y * W + Math.max(0, x - 1)] * k, r = hs[y * W + Math.min(W - 1, x + 1)] * k;
      const u = hs[Math.max(0, y - 1) * W + x] * k, d = hs[Math.min(W - 1, y + 1) * W + x] * k;
      let nx = (l - r) * S, ny = (d - u) * S, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nrm.data.set([((nx / len) * 0.5 + 0.5) * 255, ((ny / len) * 0.5 + 0.5) * 255, ((nz / len) * 0.5 + 0.5) * 255, 255], i * 4);
    }
  const toTex = (data) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = W;
    cv.getContext('2d').putImageData(data, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  };
  return { disp: toTex(disp), normal: toTex(nrm) };
}

function radialTexture(stops, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{src:string, rim:string, shape:'bowl'|'flat'}[]} plates  exactly two: front, then the one it flips to
 */
export function createScene(canvas, plates) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // keep the photograph's true colour

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0, 10);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.55;

  const key = new THREE.DirectionalLight(0xfff0e0, 2.6);
  key.position.set(-4, 5, 7);
  scene.add(key);
  const warm = new THREE.PointLight(0xff6d25, 30, 14, 1.6); // brand-orange rim light from behind
  warm.position.set(3.5, -2.5, -1.5);
  scene.add(warm);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const rig = new THREE.Group(); // where it sits on screen
  const tilt = new THREE.Group(); // lean + flip
  const spin = new THREE.Group(); // rotation about the plate's own axis
  rig.add(tilt);
  tilt.add(spin);
  scene.add(rig);

  // glaze: full gloss on the ceramic, softer over the food in the middle
  const glazeMap = radialTexture([[0, '#555'], [0.42, '#666'], [0.62, '#fff'], [1, '#fff']]);

  const topMat = new THREE.MeshPhysicalMaterial({
    color: 0x000000, emissive: 0xffffff, roughness: 1, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.09, clearcoatMap: glazeMap,
    transparent: false, side: THREE.DoubleSide,
  });
  const underMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, transparent: false, side: THREE.DoubleSide,
  });

  const loader = new THREE.TextureLoader();
  const geo = {};
  const meshes = { top: new THREE.Mesh(undefined, topMat), under: new THREE.Mesh(undefined, underMat) };
  spin.add(meshes.top, meshes.under);

  const loaded = plates.map(
    (p) =>
      new Promise((res) =>
        loader.load(p.src, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          t.generateMipmaps = true;
          t.minFilter = THREE.LinearMipmapLinearFilter;
          p.tex = t;
          try {
            const prof = PROFILES[p.shape] || PROFILES.flat;
            p.relief = buildRelief(t.image, prof.well - 0.02);
          } catch (e) {
            p.relief = null; // the plate still shows, just without relief
          }
          res();
        }, undefined, () => res())
      )
  );
  plates.forEach((p) => {
    const prof = PROFILES[p.shape] || PROFILES.flat;
    if (!geo[p.shape]) geo[p.shape] = { top: lathe(topProfile(prof), true, 420), under: lathe(underProfile(prof), false) };
  });

  // warm glow behind the plate
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(255,109,37,0.38)'], [0.4, 'rgba(255,109,37,0.09)'], [1, 'rgba(255,109,37,0)']]),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  halo.material.map.colorSpace = THREE.SRGBColorSpace;
  halo.position.z = -2;
  rig.add(halo);

  // fine dust hanging in the light (seeded, so every visit looks the same)
  const N = innerWidth < 760 ? 120 : 220;
  const pos = new Float32Array(N * 3);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) pos.set([(rnd() - 0.5) * 16, (rnd() - 0.5) * 9, rnd() * -6 + 2], i * 3);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xffc9a3, size: 0.02, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  scene.add(dust);

  // ── state ───────────────────────────────────────────────
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const target = { fx: 0, fy: 0, s: 1, tilt: -0.6, flip: 0, alpha: 1 };
  const cur = { ...target };
  const world = { w: 10, h: 5.4 };
  let spinVel = 0.0028;
  let dragging = false;
  let lastX = 0;
  let running = false;
  let raf = 0;
  let intro = { s: 1, a: 1 };
  let shown = -1;

  const show = (i) => {
    const p = plates[i];
    if (!p || !p.tex) return;
    const g = geo[p.shape] || Object.values(geo)[0];
    meshes.top.geometry = g.top;
    meshes.under.geometry = g.under;
    topMat.emissiveMap = p.tex;
    topMat.displacementMap = p.relief?.disp || null;
    topMat.displacementScale = p.relief ? 0.2 : 0;
    topMat.normalMap = p.relief?.normal || null;
    topMat.clearcoatNormalMap = p.relief?.normal || null;
    topMat.needsUpdate = true;
    underMat.color.set(p.rim || '#f4f2ee');
    shown = i;
  };

  const point = (e) => {
    const t = e.touches ? e.touches[0] : e;
    return t;
  };
  const onMove = (e) => {
    const t = point(e);
    if (!t) return;
    mouse.tx = (t.clientX / innerWidth) * 2 - 1;
    mouse.ty = (t.clientY / innerHeight) * 2 - 1;
    if (dragging) {
      spinVel += (t.clientX - lastX) * 0.0008;
      lastX = t.clientX;
    }
  };
  const onDown = (e) => {
    if (e.target.closest('a,button,input,textarea,select,label,video,.drawer,.menu,.nav')) return;
    dragging = true;
    lastX = point(e).clientX;
  };
  const onUp = () => (dragging = false);
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onDown, { passive: true });
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onUp);

  // phones: gently follow the device tilt when the browser allows it
  const onTilt = (e) => {
    if (e.gamma == null) return;
    mouse.tx = Math.max(-1, Math.min(1, e.gamma / 30));
    mouse.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  };
  addEventListener('deviceorientation', onTilt, { passive: true });

  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    world.h = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    world.w = world.h * camera.aspect;
  };
  resize();
  addEventListener('resize', resize);

  const clock = new THREE.Clock();
  const frame = () => {
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    for (const k in target) cur[k] = lerp(cur[k], target[k], reduced ? 1 : 0.085);

    spinVel += (0.0028 - spinVel) * 0.03;
    if (!reduced) spin.rotation.z -= spinVel;

    // flip: 0 → first plate, 1 → second plate, edge-on at 0.5
    const f = cur.flip;
    const which = f < 0.5 ? 0 : 1;
    if (which !== shown) show(which);
    tilt.rotation.y = (f < 0.5 ? f : f - 1) * Math.PI + mouse.x * 0.24;
    tilt.rotation.x = cur.tilt + mouse.y * 0.14 + Math.sin(t * 0.6) * 0.02;

    rig.position.set(cur.fx * world.w - mouse.x * 0.06, cur.fy * world.h + Math.sin(t * 0.9) * 0.045, 0);
    rig.scale.setScalar(Math.max(0.0001, cur.s * intro.s));

    // the key light follows the cursor, so the glaze highlight glides across the rim
    key.position.set(-4 + mouse.x * 7, 5 - mouse.y * 5, 7);

    const a = cur.alpha * intro.a;
    const fading = a < 0.995;
    if (topMat.transparent !== fading) {
      topMat.transparent = underMat.transparent = fading;
      topMat.needsUpdate = underMat.needsUpdate = true;
    }
    topMat.opacity = underMat.opacity = a;
    rig.visible = a > 0.01;
    halo.material.opacity = a * 0.8;
    dust.rotation.y = t * 0.01 + mouse.x * 0.04;
    dust.material.opacity = 0.45 * a;
    renderer.render(scene, camera);
  };

  const api = {
    ready: Promise.all(loaded).then(() => show(0)),
    world: () => world,
    start() {
      if (running) return;
      running = true;
      frame();
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    setTarget(p) {
      Object.assign(target, p);
    },
    snap() {
      Object.assign(cur, target);
    },
    hide() {
      intro = { s: 0.45, a: 0 };
    },
    // rises out of the dark, turning, as the oven door opens
    intro(gsap) {
      intro = { s: 0.45, a: 0 };
      spin.rotation.z = 2.4;
      gsap.to(intro, { s: 1, duration: 2.4, ease: 'expo.out' });
      gsap.to(intro, { a: 1, duration: 1.2, ease: 'power2.out' });
      gsap.to(spin.rotation, { z: 0, duration: 2.8, ease: 'expo.out' });
    },
    destroy() {
      api.stop();
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
      removeEventListener('deviceorientation', onTilt);
      removeEventListener('resize', resize);
      Object.values(geo).forEach((g) => (g.top.dispose(), g.under.dispose()));
      plates.forEach((p) => p.tex && p.tex.dispose());
      renderer.dispose();
      pmrem.dispose();
    },
  };
  return api;
}
