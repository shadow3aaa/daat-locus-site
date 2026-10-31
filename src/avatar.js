// Port of GeneratedAvatar from the Daat Locus WebUI (webui/src/components/generated-avatar.tsx).
// The seed decides the face, exactly as in the app.

function randomFrom(seed) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return (count) => {
    state = Math.imul(state ^ (state >>> 16), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    state ^= state >>> 16;
    return (state >>> 0) % count;
  };
}

const palettes = [
  ["#dfece5", "#87bba2", "#304d42"],
  ["#e1eaf3", "#8eb4d3", "#304c66"],
  ["#f5e7da", "#deb08b", "#654936"],
  ["#ebe4f0", "#b8a0ce", "#51415f"],
  ["#f4e0e3", "#d99ca9", "#653f4a"],
  ["#eeeccd", "#c0bf79", "#535330"],
];

export function avatarSvg(seed) {
  const pick = randomFrom(seed);
  const [bg, shell, ink] = palettes[pick(palettes.length)];
  const shape = pick(3),
    antenna = pick(3),
    eyes = pick(4),
    mouth = pick(3);
  const tilt = pick(9) - 4;
  const ant =
    antenna === 0
      ? `<path d="M32 20V11"/><circle cx="32" cy="9" r="3.5" fill="${shell}"/>`
      : antenna === 1
        ? `<path d="M22 20L17 12M42 20L47 12"/><circle cx="16" cy="10" r="3" fill="${shell}"/><circle cx="48" cy="10" r="3" fill="${shell}"/>`
        : `<path d="M25 20V12Q32 5 39 12V20" fill="${shell}"/>`;
  const eye =
    eyes === 0
      ? `<circle cx="26" cy="33" r="2.5" fill="${ink}" stroke="none"/><circle cx="38" cy="33" r="2.5" fill="${ink}" stroke="none"/>`
      : eyes === 1
        ? `<path d="M23 33Q26 28 29 33M35 33Q38 28 41 33" fill="none"/>`
        : eyes === 2
          ? `<circle cx="26" cy="33" r="2.5" fill="${ink}" stroke="none"/><path d="M35 33H41"/>`
          : `<path d="M24 30V34M40 30V34"/><circle cx="32" cy="32" r="6" fill="none" stroke-width="1.5" opacity=".35"/>`;
  const mo =
    mouth === 0
      ? `<path d="M28 40Q32 44 36 40" fill="none"/>`
      : mouth === 1
        ? `<path d="M29 40H35"/>`
        : `<ellipse cx="32" cy="40" rx="2" ry="2.5" fill="${ink}" stroke="none"/>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" fill="${bg}"/><g transform="rotate(${tilt} 32 34)" stroke="${ink}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ant}<rect x="8" y="29" width="9" height="14" rx="4" fill="${shell}"/><rect x="47" y="29" width="9" height="14" rx="4" fill="${shell}"/><rect x="14" y="18" width="36" height="34" rx="${shape === 0 ? 12 : shape === 1 ? 7 : 17}" fill="${shell}"/><rect x="19" y="25" width="26" height="21" rx="9" fill="${bg}" stroke="none"/>${eye}${mo}</g></svg>`;
}

export function paintAvatars(root = document) {
  root.querySelectorAll("[data-avatar]").forEach((el) => {
    el.innerHTML = avatarSvg(el.dataset.avatar);
  });
}
