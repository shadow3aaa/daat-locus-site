# Design notes

## What the project actually is (from the source)

- A local-first, Rust-built Agent platform (Apache-2.0) with a Tauri desktop client,
  an Android APK and a browser entry.
- **Core** is the single preset Actor and the only place you talk to. It coordinates;
  every other Actor is created and named by the Actor that needs it, after a
  mythological figure that fits the task, with a model chosen for the task.
- **Actor = Agent core + Apps.** An App is a domain state machine exposing tools and
  is the only tool abstraction. Standard MCP servers install as Apps.
- Each Actor runs one serial stream; Actors advance concurrently.
- **Boundaries:** native sandboxes (AppContainer on Windows, Seatbelt on macOS,
  bubblewrap on Linux) that fail closed. Hitting a boundary triggers an independent
  automatic review (approve/deny only). Denials can be appealed to Core, which asks
  the owner. Uncertain effects are never replayed. Sudo is an explicit, reviewed exception.
- **Devices:** one account Core shared across devices (identity, inbox, conversation),
  end-to-end encrypted channels over a relay you can host on Cloudflare Workers,
  automatic hand-off when a device disappears. A single device works on its own.
- **Hands:** virtual-screen ComputerUse, a shared Agent browser, Web reading, Terminal,
  Files, PhoneUse on Android, conversation import from other AI apps.
- **Models:** OpenAI-compatible, Anthropic-compatible, Ollama Cloud and Codex-compatible
  (ChatGPT subscription) providers.

## Visual concept: "The Orrery"

An orrery is a mechanical model of a system where bodies move on their own orbits
around one centre. That is the shape of Daat Locus: one Core at the centre, devices
as orbits, Actors as named bodies moving on them, messages as light travelling
between them. The centre uses the project's own logo disc.

- Palette taken from the wordmark's warm greys (#211e1e / #f1ecec / #b7b1b1),
  near-black ground, one luminous blue that echoes the product's message bubbles,
  and a warm amber reserved for "boundary / approval" moments.
- Type: an editorial serif for statements, a plain sans for reading, mono for
  labels; the pixel wordmark stays as is.
- Motion is slow and orbital and plays in full on every device; it only pauses
  while the orrery is off-screen or the tab is hidden.

## App replicas

Product screens are static HTML copies of the real WebUI, not invented
interfaces. They follow `DaatLocus/webui`:

- Tokens, radii, spacing and the Noto Sans UI font come from `webui/src/index.css`.
- Avatars use a port of `generated-avatar.tsx` (`src/avatar.js`); the seed
  decides the face, as in the app.
- UI labels ("Delivered", "Read page", "Used browser", the Apps page) use the
  app's own `en-US` / `zh-CN` locale strings.
- Icons are the Lucide icons the app uses, in an inline sprite.
- Screens: the main conversation with an Actor's work record (how it works),
  the Apps page (tools), and a phone conversation where Daat Locus asks for a
  permission (safety). They follow the site's light/dark theme.

Other details: mono labels, a reading-progress line, a faint grid and film
grain. Safety shows a request packet passing through the four gates.
Blue = assigned / running, amber = boundary / review, green = done.

## Narrative

1. Hero — the orrery, one line: one conversation, many Actors, every device.
2. A request in motion — you ask Core, Core names Actors, they work, results return.
3. Anatomy — Actor = core + Apps; MCP as Apps.
4. Boundaries — sandbox, review, appeal, no replay.
5. Devices — one Core across machines; relay; single-device mode.
6. Hands — ComputerUse, browser, web, terminal, phone, import.
7. Models — providers, per-task choice.
8. Get it — platforms, build from source, relay.

The meaning of the name is deliberately not explained on the site; it is not
documented in the project.
