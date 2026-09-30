# Selfward website

A static, single-page marketing site for Selfward, in the Forge (dark) theme. It's plain HTML, CSS and JS with no build step and no dependencies. The only external request is the Inter font from Google Fonts.

## Preview

```bash
python3 -m http.server 8080 -d website
```

Then open http://localhost:8080.

## Files

- `index.html`: every section of the page, in scroll order.
- `styles.css`: design tokens, copied from `src/theme/tokens.ts`.
- `main.js`: the scroll scenes, the card rail and modal, and the map hotspots.
- `assets/`: the favicon and app icon, copied from `/assets`.

## How the scroll scenes work

Each pinned scene is a tall `<section data-scroll>` with a `position: sticky` child. `main.js` turns scroll position into a 0–1 progress value for each scene, then does one of these:
- sets transforms directly (the hero)
- toggles classes (the statement words, formula, tower)
- sets `data-step` (the phone story)

CSS handles all the transitions. With `prefers-reduced-motion`, animations are turned off and every scene shows its end state.

## Before launch

- Point the "Join the TestFlight beta" buttons (`href="#beta"`) at your public TestFlight link or a sign-up form.
- The phone screens are HTML mockups. You can swap them for simulator screenshots later if you want.

## Deploy

The folder is fully static. To deploy:
- **Vercel or Netlify:** set the project root to `website/`.
- **GitHub Pages:** publish this folder.
