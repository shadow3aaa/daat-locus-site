// The orrery: the assistant at the centre, devices as tilted orbits, Actors as bodies.
// SVG + requestAnimationFrame, running at the display's refresh rate.
// Paused only while off-screen or in a background tab.

const NS = "http://www.w3.org/2000/svg";
const TILT = 0.34; // ellipse ry / rx
const ROT = (-12 * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);

const GLYPH =
  "M52.88,31.88 Q53.30,31.45 54.00,31.45 Q54.70,31.45 55.12,31.88 Q55.55,32.30 55.59,40.55 Q55.64,48.80 55.92,49.12 Q56.20,49.45 57.75,49.45 Q59.30,49.45 59.53,49.22 Q59.77,48.98 60.05,47.02 Q60.33,45.05 61.03,43.55 Q61.73,42.05 62.91,40.69 Q64.08,39.33 65.53,38.58 Q66.98,37.83 67.59,38.11 Q68.20,38.39 68.53,38.95 Q68.86,39.52 68.77,39.84 Q68.67,40.17 66.70,41.91 Q64.73,43.64 64.03,45.23 Q63.33,46.83 63.19,48.00 Q63.05,49.17 63.28,52.45 Q63.52,55.73 64.17,57.14 Q64.83,58.55 66.80,60.28 Q68.77,62.02 68.77,62.39 Q68.77,62.77 68.44,63.28 Q68.11,63.80 67.41,64.03 Q66.70,64.27 65.30,63.42 Q63.89,62.58 62.72,61.12 Q61.55,59.67 60.52,56.48 Q59.48,53.30 57.89,53.16 Q56.30,53.02 55.97,53.77 Q55.64,54.52 55.64,61.17 Q55.64,67.83 56.34,68.81 Q57.05,69.80 57.23,71.16 Q57.42,72.52 57.09,73.41 Q56.77,74.30 55.83,74.77 Q54.89,75.23 53.30,75.00 Q51.70,74.77 51.14,73.73 Q50.58,72.70 50.77,71.20 Q50.95,69.70 51.66,68.77 Q52.36,67.83 52.36,61.17 Q52.36,54.52 52.03,53.77 Q51.70,53.02 50.11,53.16 Q48.52,53.30 47.53,56.34 Q46.55,59.39 45.33,60.98 Q44.11,62.58 42.61,63.42 Q41.11,64.27 40.50,64.03 Q39.89,63.80 39.52,63.14 Q39.14,62.48 41.20,60.42 Q43.27,58.36 43.97,56.67 Q44.67,54.98 44.81,53.81 Q44.95,52.64 44.86,50.02 Q44.77,47.39 44.11,45.70 Q43.45,44.02 41.39,42.09 Q39.33,40.17 39.28,39.70 Q39.23,39.23 39.66,38.72 Q40.08,38.20 40.73,38.02 Q41.39,37.83 42.70,38.62 Q44.02,39.42 45.28,41.02 Q46.55,42.61 47.16,44.11 Q47.77,45.61 48.00,47.30 Q48.23,48.98 48.47,49.22 Q48.70,49.45 50.25,49.45 Q51.80,49.45 52.08,49.12 Q52.36,48.80 52.41,40.55 Q52.45,32.30 52.88,31.88 Z";

const ORBITS = [
  { r: 170, label: "Windows" },
  { r: 262, label: "macOS" },
  { r: 354, label: "Linux" },
  { r: 446, label: "Android" },
];

const ACTORS = [
  { name: "Hermes", orbit: 0, phase: 0.6, speed: 0.1 },
  { name: "Metis", orbit: 0, phase: 3.7, speed: 0.1 },
  { name: "Demeter", orbit: 1, phase: 1.9, speed: 0.07 },
  { name: "Athena", orbit: 1, phase: 4.8, speed: 0.07 },
  { name: "Hephaestus", orbit: 2, phase: 0.2, speed: 0.05 },
  { name: "Iris", orbit: 2, phase: 2.5, speed: 0.05 },
  { name: "Mnemosyne", orbit: 2, phase: 4.6, speed: 0.05 },
  { name: "Argus", orbit: 3, phase: 1.2, speed: 0.036 },
  { name: "Thoth", orbit: 3, phase: 3.9, speed: 0.036 },
];

const TRAIL = 4;

function el(name, attrs = {}, parent) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

function project(r, theta) {
  const x = r * Math.cos(theta);
  const y = r * TILT * Math.sin(theta);
  return [x * COS - y * SIN, x * SIN + y * COS];
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function mountOrrery(svg) {
  if (!svg) return;
  const scene = svg.querySelector("#orrery-scene");
  const rot = `rotate(${(ROT * 180) / Math.PI})`;

  // far layer: stars (moves a little against the pointer for depth)
  const stars = el("g", { class: "o-stars" }, scene);
  const rand = rng(11);
  const starCount = 72;
  for (let i = 0; i < starCount; i++) {
    el(
      "circle",
      {
        cx: (rand() * 1160 - 580).toFixed(1),
        cy: (rand() * 600 - 300).toFixed(1),
        r: (rand() * 1.1 + 0.35).toFixed(2),
        style: `--o:${(rand() * 0.5 + 0.2).toFixed(2)};--tw:${(3 + rand() * 5).toFixed(1)}s;--td:${(-rand() * 6).toFixed(1)}s`,
      },
      stars,
    );
  }

  const world = el("g", { class: "o-world" }, scene);

  const back = el("g", { class: "o-orbits", transform: rot }, world);
  ORBITS.forEach((o, i) =>
    el("ellipse", { cx: 0, cy: 0, rx: o.r, ry: o.r * TILT, pathLength: 1, style: `--i:${i}` }, back),
  );

  const labels = el("g", { class: "o-labels" }, world);
  ORBITS.forEach((o, i) => {
    const [x, y] = project(o.r, -0.15);
    const t = el("text", { x: (x - 4).toFixed(1), y: (y - 10).toFixed(1), "text-anchor": "end", style: `--i:${i}` }, labels);
    t.textContent = o.label;
  });

  const threads = el("g", { class: "o-threads" }, world);
  const nodesBack = el("g", { class: "o-nodes" }, world);

  const core = el("g", { class: "o-core" }, world);
  el("circle", { r: 220, fill: "url(#core-glow)", class: "o-core__glow" }, core);
  const coreBody = el("g", { class: "o-core__body" }, core);
  el("circle", { r: 66, class: "o-core__halo" }, coreBody);
  el("circle", { r: 56, class: "o-core__disc" }, coreBody);
  el("path", { d: GLYPH, transform: "scale(1.75) translate(-54 -53.3)", class: "o-core__glyph" }, coreBody);
  const coreRing = el("circle", { r: 60, class: "o-core__ring" }, core);

  const front = el("g", { class: "o-orbits o-orbits--front", transform: rot }, world);
  ORBITS.forEach((o, i) => {
    const ry = o.r * TILT;
    el("path", { d: `M ${-o.r} 0 A ${o.r} ${ry} 0 0 0 ${o.r} 0`, pathLength: 1, style: `--i:${i}` }, front);
  });
  const nodesFront = el("g", { class: "o-nodes" }, world);
  const fx = el("g", { class: "o-fx" }, world);

  const bodies = ACTORS.map((a, i) => {
    const g = el("g", { class: "o-node", style: `--i:${i}` });
    const halo = el("circle", { r: 14, class: "o-node__halo" }, g);
    const dot = el("circle", { r: 6, class: "o-node__dot" }, g);
    const text = el("text", { x: 14, y: 4, class: "o-node__label" }, g);
    text.textContent = a.name;
    return { ...a, g, halo, dot, theta: a.phase, x: 0, y: 0, glow: 0, side: null };
  });

  function place(b) {
    const [x, y] = project(ORBITS[b.orbit].r, b.theta);
    b.x = x;
    b.y = y;
    const depth = (Math.sin(b.theta) + 1) / 2; // 0 back .. 1 front
    const side = depth < 0.5 ? nodesBack : nodesFront;
    if (b.side !== side) {
      side.appendChild(b.g);
      b.side = side;
    }
    const s = 0.72 + depth * 0.5;
    b.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    b.dot.setAttribute("r", (5.5 * s).toFixed(2));
    b.halo.setAttribute("r", (11 * s + b.glow * 9).toFixed(2));
    b.halo.setAttribute("opacity", (0.08 + b.glow * 0.45).toFixed(3));
    b.g.style.opacity = (0.5 + depth * 0.5).toFixed(3);
  }

  bodies.forEach(place);

  /* ---------- messages ---------- */
  const live = [];
  const ripples = [];
  const maxLive = 6;

  function spawn(now) {
    const b = bodies[Math.floor(Math.random() * bodies.length)];
    const kind = Math.random() < 0.2 ? "gate" : "out";
    const line = el("line", { class: `o-thread o-thread--${kind}`, x1: 0, y1: 0 }, threads);
    const trail = [];
    for (let i = TRAIL; i >= 1; i--) trail.push(el("circle", { r: (3.4 * (1 - i / (TRAIL + 1))).toFixed(2), class: `o-pulse o-pulse--${kind}` }, fx));
    const head = el("circle", { r: 3.8, class: `o-pulse o-pulse--${kind} o-pulse--head` }, fx);
    live.push({ b, kind, start: now, dur: kind === "gate" ? 2900 : 1900, line, trail, head, back: false });
    coreRing.classList.remove("is-on");
    requestAnimationFrame(() => coreRing.classList.add("is-on"));
  }

  function setKind(p, kind) {
    p.kind = kind;
    p.line.setAttribute("class", `o-thread o-thread--${kind}`);
    p.head.setAttribute("class", `o-pulse o-pulse--${kind} o-pulse--head`);
    p.trail.forEach((c) => c.setAttribute("class", `o-pulse o-pulse--${kind}`));
  }

  function progress(p, t) {
    if (p.kind === "gate") {
      // travel, pause at the boundary for review, then continue
      if (t < 0.34) return easeInOut(t / 0.34) * 0.5;
      if (t < 0.62) return 0.5;
      return 0.5 + easeInOut((t - 0.62) / 0.38) * 0.5;
    }
    return easeInOut(t);
  }

  function ripple(x, y, kind, now) {
    const c = el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 6, class: `o-ripple o-ripple--${kind}` }, fx);
    ripples.push({ c, start: now });
  }

  function stepMessages(now) {
    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      const t = (now - p.start) / p.dur;
      if (t >= 1) {
        if (!p.back) {
          p.b.glow = 1;
          ripple(p.b.x, p.b.y, p.kind, now);
          p.back = true;
          setKind(p, "return");
          p.start = now + 600 + Math.random() * 1000;
          p.dur = 2000;
          continue;
        }
        ripple(0, 0, "return", now);
        p.line.remove();
        p.head.remove();
        p.trail.forEach((c) => c.remove());
        live.splice(i, 1);
        continue;
      }
      const from = p.back ? [p.b.x, p.b.y] : [0, 0];
      const to = p.back ? [0, 0] : [p.b.x, p.b.y];
      p.line.setAttribute("x2", p.b.x.toFixed(1));
      p.line.setAttribute("y2", p.b.y.toFixed(1));
      if (t < 0) {
        p.head.style.opacity = 0;
        p.trail.forEach((c) => (c.style.opacity = 0));
        p.line.style.opacity = 0.12;
        continue;
      }
      const fade = Math.min(1, Math.sin(Math.PI * t) * 1.8);
      const k = progress(p, t);
      const hx = from[0] + (to[0] - from[0]) * k;
      const hy = from[1] + (to[1] - from[1]) * k;
      p.head.setAttribute("cx", hx.toFixed(1));
      p.head.setAttribute("cy", hy.toFixed(1));
      p.head.style.opacity = fade.toFixed(3);
      p.trail.forEach((c, j) => {
        const lag = (TRAIL - j) * 0.022;
        const kk = progress(p, Math.max(0, t - lag));
        c.setAttribute("cx", (from[0] + (to[0] - from[0]) * kk).toFixed(1));
        c.setAttribute("cy", (from[1] + (to[1] - from[1]) * kk).toFixed(1));
        c.style.opacity = (fade * (0.12 + 0.5 * ((j + 1) / TRAIL))).toFixed(3);
      });
      p.line.style.opacity = (0.12 + Math.sin(Math.PI * t) * 0.4).toFixed(3);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      const t = (now - r.start) / 900;
      if (t >= 1) {
        r.c.remove();
        ripples.splice(i, 1);
        continue;
      }
      const e = easeOut(t);
      r.c.setAttribute("r", (6 + e * 26).toFixed(2));
      r.c.style.opacity = ((1 - e) * 0.55).toFixed(3);
    }
  }

  /* ---------- pointer parallax (mouse, pen or touch) ---------- */
  const par = { tx: 0, ty: 0, x: 0, y: 0 };
  const hero = svg.closest(".hero") || svg;
  hero.addEventListener(
    "pointermove",
    (e) => {
      const r = hero.getBoundingClientRect();
      par.tx = ((e.clientX - r.left) / r.width - 0.5) * 18;
      par.ty = ((e.clientY - r.top) / r.height - 0.5) * 12;
    },
    { passive: true },
  );
  const settle = () => {
    par.tx = 0;
    par.ty = 0;
  };
  hero.addEventListener("pointerleave", settle);
  hero.addEventListener("pointercancel", settle);

  /* ---------- loop ---------- */
  let last = performance.now();
  let nextSpawn = last + 1400; // let the entrance settle first
  let raf = 0;
  let visible = true;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    for (const b of bodies) {
      b.theta += b.speed * dt;
      b.glow = Math.max(0, b.glow - dt * 0.8);
      place(b);
    }
    if (now >= nextSpawn && live.length < maxLive) {
      spawn(now);
      nextSpawn = now + 1000 + Math.random() * 1200;
    }
    stepMessages(now);

    if (Math.abs(par.tx - par.x) > 0.01 || Math.abs(par.ty - par.y) > 0.01) {
      par.x += (par.tx - par.x) * 0.06;
      par.y += (par.ty - par.y) * 0.06;
      world.setAttribute("transform", `translate(${par.x.toFixed(2)} ${par.y.toFixed(2)})`);
      stars.setAttribute("transform", `translate(${(-par.x * 0.4).toFixed(2)} ${(-par.y * 0.4).toFixed(2)})`);
    }
  }

  function start() {
    if (raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    svg.classList.toggle("is-paused", !visible);
    visible ? start() : stop();
  }).observe(svg);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
}
