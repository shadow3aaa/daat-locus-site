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

/* ---------- nav: scrolled state and reading progress ---------- */
const nav = document.querySelector(".nav");
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("is-scrolled", scrollY > 24);
    nav.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : "0");
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
