import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource-variable/noto-sans/wght.css";
import "./style.css";
import { zh, ui } from "./i18n.js";
import { paintAvatars } from "./avatar.js";
import { mountOrrery } from "./orrery.js";

const root = document.documentElement;
window.__dlReady = true;
const L = () => ui[root.lang === "zh-CN" ? "zh-CN" : "en"];

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
const nav = document.querySelector(".nav");
// Stagger siblings inside a group so they arrive one after another.
document.querySelectorAll(".reveal-group").forEach((group) => {
  [...group.querySelectorAll(":scope > .reveal")].forEach((el, i) => el.style.setProperty("--d", `${i * 90}ms`));
});

// Two-way reveal: elements animate in when they enter the reading band and
// animate out in the direction they leave, every time.
const revealables = document.querySelectorAll(".reveal, .reveal-head");
if (!("IntersectionObserver" in window)) {
  revealables.forEach((el) => el.classList.add("is-in"));
} else {
  const thresholds = [];
  for (let i = 0; i <= 10; i++) thresholds.push(i / 100);
  for (let i = 3; i <= 20; i++) thresholds.push(i / 20);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target;
        const h = e.boundingClientRect.height || 1;
        const seen = e.isIntersecting ? e.intersectionRect.height : 0;
        const isIn = el.classList.contains("is-in");
        // Hysteresis: enter late, leave late, so the boundary never flickers.
        if (!isIn && seen >= Math.min(120, h * 0.2)) {
          el.classList.remove("is-out-up");
          el.classList.add("is-in");
        } else if ((isIn || !e.isIntersecting) && seen < Math.min(48, h * 0.08)) {
          const r = e.rootBounds;
          const above = r ? e.boundingClientRect.top + h / 2 < r.top + r.height / 2 : false;
          el.classList.remove("is-in");
          el.classList.toggle("is-out-up", above);
        }
      }
    },
    { rootMargin: "-15% 0px -10% 0px", threshold: thresholds },
  );
  // The footer wordmark ends the page, so it can never reach the reading band; use the full viewport.
  const edge = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle("is-in", e.isIntersecting)), {
    threshold: 0.3,
  });
  revealables.forEach((el) => (el.classList.contains("footer__giant") ? edge : io).observe(el));

  // A jump (anchor link, Home key) skips elements without the observer seeing them leave.
  // Once scrolling settles, point every hidden element at the side it now sits on.
  let settle = 0;
  addEventListener(
    "scroll",
    () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        for (const el of revealables) {
          if (el.classList.contains("is-in")) continue;
          el.classList.toggle("is-out-up", el.getBoundingClientRect().bottom < innerHeight / 2);
        }
      }, 140);
    },
    { passive: true },
  );
}

// The hero eases away as you scroll past it and comes back when you return.
const scrub = [
  { el: document.querySelector(".hero__text"), lift: 90, y: 0 },
  { el: document.querySelector(".orrery"), lift: 40, y: 0, inner: document.getElementById("orrery") },
];
function scrubHero() {
  const line = nav.offsetHeight;
  for (const s of scrub) {
    if (!s.el) continue;
    const r = s.el.getBoundingClientRect();
    const top = r.top - s.y; // position without our own offset
    const p = Math.min(1, Math.max(0, (line - top) / (r.height * 0.85)));
    s.y = -p * s.lift;
    s.el.style.transform = p ? `translate3d(0, ${s.y.toFixed(1)}px, 0)` : "";
    s.el.style.opacity = p ? (1 - p * 0.9).toFixed(3) : "";
    if (s.inner) s.inner.style.transform = p ? `scale(${(1 - p * 0.08).toFixed(4)})` : "";
  }
}

// Start the hero entrance once fonts are ready (or after a short grace period).
const ready = () => root.classList.add("is-ready");
Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 700))]).then(() =>
  requestAnimationFrame(ready),
);

/* ---------- nav: scrolled state and reading progress ---------- */
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("is-scrolled", scrollY > 24);
    nav.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : "0");
    scrubHero();
    ticking = false;
  });
};
onScroll();
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll, { passive: true });
/* ---------- pointer spotlight on tiles and cards ---------- */
document.querySelectorAll(".tile").forEach((el) => {
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

/* ---------- app replicas ---------- */
paintAvatars();

applyLang(root.lang === "zh-CN" ? "zh-CN" : "en");

/* ---------- orrery ---------- */
mountOrrery(document.getElementById("orrery"));
