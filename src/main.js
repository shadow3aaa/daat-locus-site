import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./style.css";
import { zh } from "./i18n.js";
import { mountOrrery } from "./orrery.js";

const root = document.documentElement;
root.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- language ---------- */
const en = {};
const textNodes = document.querySelectorAll("[data-i18n]");
const htmlNodes = document.querySelectorAll("[data-i18n-html]");
const altNodes = document.querySelectorAll("[data-i18n-alt]");
textNodes.forEach((el) => (en[el.dataset.i18n] = el.textContent.trim()));
htmlNodes.forEach((el) => (en[el.dataset.i18nHtml] = el.innerHTML.trim()));
altNodes.forEach((el) => (en[el.dataset.i18nAlt] = el.getAttribute("alt")));
const enTitle = document.title;

const toggle = document.getElementById("lang-toggle");

function applyLang(lang) {
  const dict = lang === "zh-CN" ? zh : en;
  const pick = (k) => dict[k] ?? en[k];
  textNodes.forEach((el) => (el.textContent = pick(el.dataset.i18n)));
  htmlNodes.forEach((el) => (el.innerHTML = pick(el.dataset.i18nHtml)));
  altNodes.forEach((el) => el.setAttribute("alt", pick(el.dataset.i18nAlt)));
  root.lang = lang;
  document.title = lang === "zh-CN" ? "Daat Locus — 一个对话，许多 Actor，每一台设备" : enTitle;
  toggle.textContent = lang === "zh-CN" ? "EN" : "中文";
  toggle.setAttribute("aria-label", lang === "zh-CN" ? "Switch to English" : "切换到中文");
}

applyLang(root.lang === "zh-CN" ? "zh-CN" : "en");
toggle.addEventListener("click", () => {
  const next = root.lang === "zh-CN" ? "en" : "zh-CN";
  applyLang(next);
  try {
    localStorage.setItem("dl-lang", next);
  } catch {}
});

/* ---------- reveal on scroll ---------- */
const revealables = document.querySelectorAll(".reveal");
if (reduceMotion.matches || !("IntersectionObserver" in window)) {
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
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  revealables.forEach((el) => io.observe(el));
}

/* ---------- nav state ---------- */
const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- orrery ---------- */
mountOrrery(document.getElementById("orrery"), reduceMotion);
