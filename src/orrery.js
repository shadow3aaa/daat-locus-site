// The orrery: Core at the centre, devices as tilted orbits, Actors as bodies.
// Rendered as SVG and animated with requestAnimationFrame; paused when hidden,
// static when the user prefers reduced motion.

const NS = "http://www.w3.org/2000/svg";
const TILT = 0.34; // ellipse ry / rx
const ROT = (-12 * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);

const GLYPH =
  "M52.88,31.88 Q53.30,31.45 54.00,31.45 Q54.70,31.45 55.12,31.88 Q55.55,32.30 55.59,40.55 Q55.64,48.80 55.92,49.12 Q56.20,49.45 57.75,49.45 Q59.30,49.45 59.53,49.22 Q59.77,48.98 60.05,47.02 Q60.33,45.05 61.03,43.55 Q61.73,42.05 62.91,40.69 Q64.08,39.33 65.53,38.58 Q66.98,37.83 67.59,38.11 Q68.20,38.39 68.53,38.95 Q68.86,39.52 68.77,39.84 Q68.67,40.17 66.70,41.91 Q64.73,43.64 64.03,45.23 Q63.33,46.83 63.19,48.00 Q63.05,49.17 63.28,52.45 Q63.52,55.73 64.17,57.14 Q64.83,58.55 66.80,60.28 Q68.77,62.02 68.77,62.39 Q68.77,62.77 68.44,63.28 Q68.11,63.80 67.41,64.03 Q66.70,64.27 65.30,63.42 Q63.89,62.58 62.72,61.12 Q61.55,59.67 60.52,56.48 Q59.48,53.30 57.89,53.16 Q56.30,53.02 55.97,53.77 Q55.64,54.52 55.64,61.17 Q55.64,67.83 56.34,68.81 Q57.05,69.80 57.23,71.16 Q57.42,72.52 57.09,73.41 Q56.77,74.30 55.83,74.77 Q54.89,75.23 53.30,75.00 Q51.70,74.77 51.14,73.73 Q50.58,72.70 50.77,71.20 Q50.95,69.70 51.66,68.77 Q52.36,67.83 52.36,61.17 Q52.36,54.52 52.03,53.77 Q51.70,53.02 50.11,53.16 Q48.52,53.30 47.53,56.34 Q46.55,59.39 45.33,60.98 Q44.11,62.58 42.61,63.42 Q41.11,64.27 40.50,64.03 Q39.89,63.80 39.52,63.14 Q39.14,62.48 41.20,60.42 Q43.27,58.36 43.97,56.67 Q44.67,54.98 44.81,53.81 Q44.95,52.64 44.86,50.02 Q44.77,47.39 44.11,45.70 Q43.45,44.02 41.39,42.09 Q39.33,40.17 39.28,39.70 Q39.23,39.23 39.66,38.72 Q40.08,38.20 40.73,38.02 Q41.39,37.83 42.70,38.62 Q44.02,39.42 45.28,41.02 Q46.55,42.61 47.16,44.11 Q47.77,45.61 48.00,47.30 Q48.23,48.98 48.47,49.22 Q48.70,49.45 50.25,49.45 Q51.80,49.45 52.08,49.12 Q52.36,48.80 52.41,40.55 Q52.45,32.30 52.88,31.88 Z";

const ORBITS = [
  { r: 170, label: "laptop · Windows" },
  { r: 262, label: "studio · macOS" },
  { r: 354, label: "server · Linux" },
  { r: 446, label: "phone · Android" },
];

const ACTORS = [
  { name: "Hermes", orbit: 0, phase: 0.6, speed: 0.11 },
  { name: "Metis", orbit: 0, phase: 3.7, speed: 0.11 },
  { name: "Demeter", orbit: 1, phase: 1.9, speed: 0.075 },
  { name: "Athena", orbit: 1, phase: 4.8, speed: 0.075 },
  { name: "Hephaestus", orbit: 2, phase: 0.2, speed: 0.052 },
  { name: "Iris", orbit: 2, phase: 2.5, speed: 0.052 },
  { name: "Mnemosyne", orbit: 2, phase: 4.6, speed: 0.052 },
  { name: "Argus", orbit: 3, phase: 1.2, speed: 0.038 },
  { name: "Thoth", orbit: 3, phase: 3.9, speed: 0.038 },
];

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

// deterministic pseudo-random for the star field
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function mountOrrery(svg, reduceMotion) {
  if (!svg) return;
  const scene = svg.querySelector("#orrery-scene");
  const rot = `rotate(${(ROT * 180) / Math.PI})`;

  // stars
  const stars = el("g", { class: "o-stars" }, scene);
  const rand = rng(11);
  for (let i = 0; i < 70; i++) {
    el("circle", { cx: (rand() * 1040 - 520).toFixed(1), cy: (rand() * 800 - 400).toFixed(1), r: (rand() * 1.1 + 0.3).toFixed(2), opacity: (rand() * 0.5 + 0.15).toFixed(2) }, stars);
  }

  // orbits (back: full ellipse, faint)
  const back = el("g", { class: "o-orbits", transform: rot }, scene);
  for (const o of ORBITS) el("ellipse", { cx: 0, cy: 0, rx: o.r, ry: o.r * TILT }, back);

  // device labels
  const labels = el("g", { class: "o-labels" }, scene);
  ORBITS.forEach((o) => {
    const [x, y] = project(o.r, -0.15);
    const t = el("text", { x: (x - 4).toFixed(1), y: (y - 10).toFixed(1), "text-anchor": "end" }, labels);
    t.textContent = o.label;
  });

  const threads = el("g", { class: "o-threads" }, scene);
  const nodesBack = el("g", { class: "o-nodes" }, scene);

  // core
  const core = el("g", { class: "o-core" }, scene);
  el("circle", { r: 210, fill: "url(#core-glow)" }, core);
  el("circle", { r: 64, class: "o-core__halo" }, core);
  el("circle", { r: 56, class: "o-core__disc" }, core);
  el("path", { d: GLYPH, transform: "scale(1.75) translate(-54 -53.3)", class: "o-core__glyph" }, core);

  // front halves of orbits drawn over the core
  const front = el("g", { class: "o-orbits o-orbits--front", transform: rot }, scene);
  for (const o of ORBITS) {
    const ry = o.r * TILT;
    el("path", { d: `M ${-o.r} 0 A ${o.r} ${ry} 0 0 0 ${o.r} 0` }, front);
  }
  const nodesFront = el("g", { class: "o-nodes" }, scene);
  const pulses = el("g", { class: "o-pulses" }, scene);

  // actors
  const bodies = ACTORS.map((a) => {
    const g = el("g", { class: "o-node" });
    const halo = el("circle", { r: 14, class: "o-node__halo" }, g);
    const dot = el("circle", { r: 6, fill: "url(#node-fill)" }, g);
    const text = el("text", { x: 14, y: 4, class: "o-node__label" }, g);
    text.textContent = a.name;
    return { ...a, g, halo, dot, theta: a.phase, x: 0, y: 0, glow: 0 };
  });

  function place(b) {
    const r = ORBITS[b.orbit].r;
    const [x, y] = project(r, b.theta);
    b.x = x;
    b.y = y;
    const depth = (Math.sin(b.theta) + 1) / 2; // 0 back .. 1 front
    const parent = depth < 0.5 ? nodesBack : nodesFront;
    if (b.g.parentNode !== parent) parent.appendChild(b.g);
    b.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    const s = 0.7 + depth * 0.55;
    b.dot.setAttribute("r", (5.5 * s).toFixed(2));
    b.halo.setAttribute("r", (12 * s + b.glow * 10).toFixed(2));
    b.halo.setAttribute("opacity", (0.1 + b.glow * 0.5).toFixed(3));
    b.g.setAttribute("opacity", (0.45 + depth * 0.55).toFixed(3));
  }

  // pulses: Core -> Actor (blue), Actor -> Core (warm), occasionally held at a boundary (amber)
  const live = [];
  function spawn(now) {
    const b = bodies[Math.floor(Math.random() * bodies.length)];
    const kind = Math.random() < 0.18 ? "gate" : "out";
    const line = el("line", { class: `o-thread o-thread--${kind}` }, threads);
    const dot = el("circle", { r: 3.6, class: `o-pulse o-pulse--${kind}` }, pulses);
    live.push({ b, kind, start: now, dur: kind === "gate" ? 2600 : 1700, line, dot, back: false });
  }

  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function stepPulses(now) {
    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      let t = (now - p.start) / p.dur;
      if (t >= 1) {
        p.b.glow = 1;
        if (!p.back && p.kind !== "return") {
          // the result comes home
          p.back = true;
          p.kind = "return";
          p.start = now + 500 + Math.random() * 900;
          p.dur = 1800;
          p.dot.setAttribute("class", "o-pulse o-pulse--return");
          p.line.setAttribute("class", "o-thread o-thread--return");
          continue;
        }
        p.line.remove();
        p.dot.remove();
        live.splice(i, 1);
        continue;
      }
      if (t < 0) {
        p.dot.setAttribute("opacity", 0);
        continue;
      }
      let k;
      if (p.kind === "gate") {
        // travel, hold for review, continue
        k = t < 0.35 ? ease(t / 0.35) * 0.5 : t < 0.65 ? 0.5 : 0.5 + ease((t - 0.65) / 0.35) * 0.5;
      } else {
        k = ease(t);
      }
      const from = p.kind === "return" ? [p.b.x, p.b.y] : [0, 0];
      const to = p.kind === "return" ? [0, 0] : [p.b.x, p.b.y];
      const x = from[0] + (to[0] - from[0]) * k;
      const y = from[1] + (to[1] - from[1]) * k;
      p.dot.setAttribute("cx", x.toFixed(1));
      p.dot.setAttribute("cy", y.toFixed(1));
      p.dot.setAttribute("opacity", Math.min(1, Math.sin(Math.PI * t) * 1.6).toFixed(3));
      p.line.setAttribute("x1", 0);
      p.line.setAttribute("y1", 0);
      p.line.setAttribute("x2", p.b.x.toFixed(1));
      p.line.setAttribute("y2", p.b.y.toFixed(1));
      p.line.setAttribute("opacity", (Math.sin(Math.PI * t) * 0.55).toFixed(3));
    }
  }

  // static frame
  bodies.forEach(place);
  if (reduceMotion.matches) {
    // a still, composed moment: two threads drawn
    [0, 4].forEach((i) => {
      const b = bodies[i];
      el("line", { class: "o-thread o-thread--out", x1: 0, y1: 0, x2: b.x, y2: b.y, opacity: 0.4 }, threads);
    });
    return;
  }

  let last = performance.now();
  let nextSpawn = last + 400;
  let raf = 0;
  let visible = true;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const b of bodies) {
      b.theta += b.speed * dt;
      b.glow = Math.max(0, b.glow - dt * 0.9);
      place(b);
    }
    if (now >= nextSpawn && live.length < 6) {
      spawn(now);
      nextSpawn = now + 900 + Math.random() * 1100;
    }
    stepPulses(now);
    raf = requestAnimationFrame(frame);
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
    visible ? start() : stop();
  }).observe(svg);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener?.("change", (e) => (e.matches ? stop() : start()));
  start();
}
