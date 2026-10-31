# daatlocus-site

Source for [daatlocus.shadow3.work](https://daatlocus.shadow3.work), the website of
[Daat Locus](https://github.com/shadow3aaa/DaatLocus).

Plain HTML, CSS and JavaScript built with Vite. Bun is the package manager and script runner.

```sh
bun install
bun run dev      # local dev server
bun run build    # static output in dist/
bun run preview  # serve dist/
```

Pushing to `main` builds the site with GitHub Actions and deploys it to GitHub Pages.
`public/CNAME` holds the custom domain.

- `index.html` — page structure and English copy
- `src/i18n.js` — Simplified Chinese copy
- `src/orrery.js` — the animated hero illustration
- `src/style.css` — styles
- `DESIGN.md` — design notes

The logo and wordmark come from the Daat Locus repository. Apache-2.0.
