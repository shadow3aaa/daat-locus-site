import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./style.css";
import { zh, live } from "./i18n.js";
import { mountOrrery } from "./orrery.js";

const root = document.documentElement;
window.__dlReady = true;
const L = () => live[root.lang === "zh-CN" ? "zh-CN" : "en"];
const onLang = [];

/* ---------- theme ---------- */
const themeBtn = document.getElementById("theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const systemLight = window.matchMedia("(prefers-color-scheme: light)");

function storedTheme() {
  try {
    const t = localStorage.getItem("dl-theme");
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function paintTheme(theme) {
  root.dataset.theme = theme;
  if (themeMeta) themeMeta.content = theme === "light" ? "#f4f0e8" : "#0a0909";
  syncThemeLabel();
}

function syncThemeLabel() {
  const light = root.dataset.theme === "light";
  const zhUI = root.lang === "zh-CN";
  themeBtn.setAttribute(
    "aria-label",
    light ? (zhUI ? "切换到深色模式" : "Switch to dark theme") : zhUI ? "切换到浅色模式" : "Switch to light theme",
  );
}

function switchTheme(next, originEl) {
  const apply = () => paintTheme(next);
  if (!document.startViewTransition) {
    apply();
    return;
  }
  const r = originEl.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.classList.add("theme-switching");
  const vt = document.startViewTransition(apply);
  vt.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 620, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
  vt.finished.finally(() => root.classList.remove("theme-switching"));
}

themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  try {
    localStorage.setItem("dl-theme", next);
  } catch {}
  switchTheme(next, themeBtn);
});

systemLight.addEventListener?.("change", (e) => {
  if (!storedTheme()) paintTheme(e.matches ? "light" : "dark");
});

/* ---------- language ---------- */
const en = {};
const textNodes = document.querySelectorAll("[data-i18n]");
const htmlNodes = document.querySelectorAll("[data-i18n-html]");
const altNodes = document.querySelectorAll("[data-i18n-alt]");
textNodes.forEach((el) => (en[el.dataset.i18n] = el.textContent.trim()));
htmlNodes.forEach((el) => (en[el.dataset.i18nHtml] = el.innerHTML.trim()));
altNodes.forEach((el) => (en[el.dataset.i18nAlt] = el.getAttribute("alt")));
const enTitle = document.title;
const enDesc = document.querySelector('meta[name="description"]').content;
const langBtn = document.getElementById("lang-toggle");
const t = (k) => (root.lang === "zh-CN" ? zh[k] : undefined) ?? en[k];

function applyLang(lang) {
  const dict = lang === "zh-CN" ? zh : en;
  const pick = (k) => dict[k] ?? en[k];
  textNodes.forEach((el) => (el.textContent = pick(el.dataset.i18n)));
  htmlNodes.forEach((el) => (el.innerHTML = pick(el.dataset.i18nHtml)));
  altNodes.forEach((el) => el.setAttribute("alt", pick(el.dataset.i18nAlt)));
  root.lang = lang;
  const isZh = lang === "zh-CN";
  document.title = isZh ? "Daat Locus — 一个对话，一群 Actor，你所有的设备" : enTitle;
  document.querySelector('meta[name="description"]').content = isZh
    ? "Daat Locus 是一个开源 AI 助手。在一个对话里提出请求，大一点的任务交给一群叫作 Actor 的 AI 智能体，在你的电脑和手机上同时开工。"
    : enDesc;
  langBtn.textContent = isZh ? "EN" : "中文";
  langBtn.setAttribute("aria-label", isZh ? "Switch to English" : "切换到中文");
  syncThemeLabel();
  onLang.forEach((fn) => fn());
}

langBtn.addEventListener("click", () => {
  const next = root.lang === "zh-CN" ? "en" : "zh-CN";
  const swap = () => applyLang(next);
  if (document.startViewTransition) document.startViewTransition(swap);
  else swap();
  try {
    localStorage.setItem("dl-lang", next);
  } catch {}
});

/* ---------- entrance + scroll reveal ---------- */
// Stagger siblings inside a group so they arrive one after another.
document.querySelectorAll(".reveal-group").forEach((group) => {
  [...group.querySelectorAll(":scope > .reveal")].forEach((el, i) => el.style.setProperty("--d", `${i * 90}ms`));
});

const revealables = document.querySelectorAll(".reveal, .reveal-head");
if (!("IntersectionObserver" in window)) {
  revealables.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
  );
  revealables.forEach((el) => io.observe(el));
}

// Start the hero entrance once fonts are ready (or after a short grace period).
const ready = () => root.classList.add("is-ready");
Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 700))]).then(() =>
  requestAnimationFrame(ready),
);

/* ---------- nav: scrolled state, reading progress, clock ---------- */
const nav = document.querySelector(".nav");
const shot = document.getElementById("shot");
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("is-scrolled", scrollY > 24);
    nav.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : "0");
    if (shot) {
      // The product shot tilts back and straightens as it reaches the middle of the screen.
      const r = shot.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.75)));
      shot.style.setProperty("--k", k.toFixed(3));
    }
    ticking = false;
  });
};
onScroll();
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll, { passive: true });

const clockEl = document.getElementById("clock");
const hhmmss = (d = new Date()) => d.toTimeString().slice(0, 8);
const tick = () => (clockEl.textContent = hhmmss());
tick();
setInterval(tick, 1000);

/* ---------- pointer spotlight on tiles and cards ---------- */
document.querySelectorAll(".tile, .equation, .shot__frame, .run").forEach((el) => {
  el.addEventListener(
    "pointermove",
    (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
    { passive: true },
  );
});

/* ---------- copy buttons on code blocks ---------- */
document.querySelectorAll(".term__copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const code = btn.closest(".term").querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = L().copied;
      btn.classList.add("is-done");
      setTimeout(() => {
        btn.textContent = t("copy");
        btn.classList.remove("is-done");
      }, 1600);
    } catch {}
  });
});

/* ---------- live log fed by the orrery ---------- */
const orrery = document.getElementById("orrery");
const logEl = document.getElementById("log");
const flightEl = document.getElementById("hud-flight");
const MAX_LINES = 5;

function logLine(kind, actor, text) {
  const li = document.createElement("li");
  li.className = `log__line log__line--${kind}`;
  const time = document.createElement("time");
  time.textContent = hhmmss();
  const who = document.createElement("b");
  who.textContent = actor;
  const msg = document.createElement("span");
  msg.textContent = text;
  li.append(time, who, msg);
  logEl.append(li);
  while (logEl.children.length > MAX_LINES) logEl.firstElementChild.remove();
}

logLine("back", "Core", L().ready);
orrery.addEventListener("orrery", (e) => {
  const { type, actor, device, live: n } = e.detail;
  const d = L();
  const task = d.tasks[actor] ?? "";
  const text = {
    out: `${d.out} · ${task} · ${device}`,
    gate: `${d.gate} · ${task}`,
    approve: `${d.approve} · ${task}`,
    back: `${d.back} · ${task}`,
  }[type];
  logLine(type, actor, text);
  flightEl.textContent = String(n).padStart(2, "0");
});

/* ---------- session demo: three Actors in parallel ---------- */
const run = document.getElementById("run");
if (run) {
  const CYCLE = 15000;
  const msgs = [...run.querySelectorAll("[data-step]")];
  const msgAt = [200, 1200, 10200];
  const lanes = [...run.querySelectorAll(".lane")].map((el, i) => ({
    el,
    fill: el.querySelector(".lane__fill"),
    state: el.querySelector(".lane__state"),
    start: [2000, 2500, 3000][i],
    dur: [9000, 6200, 5400][i],
    end: [0.85, 1, 1][i],
    shown: "",
  }));
  const ease = (x) => 1 - Math.pow(1 - x, 2.2);
  let t0 = performance.now();
  let raf = 0;
  let lastT = 0;

  const render = (ms) => {
    lastT = ms;
    msgs.forEach((m, i) => m.classList.toggle("is-on", ms >= msgAt[i]));
    const d = L();
    lanes.forEach((lane, i) => {
      const x = Math.min(1, Math.max(0, (ms - lane.start) / lane.dur));
      const p = ease(x) * lane.end;
      lane.fill.style.transform = `scaleX(${p.toFixed(4)})`;
      const steps = d.lanes[i];
      let s;
      if (ms < lane.start) s = d.states.queued;
      else if (x >= 1 && lane.end === 1) s = d.states.done;
      else s = steps[Math.min(steps.length - 1, Math.floor(x * steps.length))];
      if (s !== lane.shown) {
        lane.state.textContent = s;
        lane.shown = s;
      }
      lane.el.classList.toggle("is-active", ms >= lane.start && !(x >= 1 && lane.end === 1));
      lane.el.classList.toggle("is-done", x >= 1 && lane.end === 1);
    });
    run.classList.toggle("is-fading", ms > CYCLE - 700);
  };
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    render((now - t0) % CYCLE);
  };
  render(0);
  onLang.push(() => {
    lanes.forEach((l) => (l.shown = ""));
    render(lastT);
  });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !raf) {
      t0 = performance.now() - lastT;
      raf = requestAnimationFrame(frame);
    } else if (!e.isIntersecting && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }).observe(run);
}

applyLang(root.lang === "zh-CN" ? "zh-CN" : "en");

/* ---------- orrery ---------- */
mountOrrery(orrery);
