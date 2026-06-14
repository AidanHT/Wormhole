# WORMHOLE

A first-person horror portal-puzzle game. Descend through the twelve chambers of the
**MERIDIAN-9** facility, solve momentum and portal puzzles to keep moving down — and try
not to attract the thing that shares the dark with you.

Built with **TypeScript**, **Three.js**, and **Vite**. Everything — geometry, textures, and
the entire audio score — is generated procedurally at runtime, so there are no asset files to
load: the whole game ships as a single ~700 KB bundle.

## Controls

| Action | Key |
| --- | --- |
| Move | `W` `A` `S` `D` / arrows |
| Look | Mouse |
| Sprint | `Shift` |
| Jump | `Space` |
| Fire amber portal | Left mouse |
| Fire cyan portal | Right mouse |
| Interact (cubes, terminals, breakers) | `E` |
| Reset to last checkpoint | `R` |
| Pause | `P` / `Esc` |

The game uses **pointer lock** (click the canvas to capture the mouse) and **Web Audio**
(audio unlocks on your first click or keypress, per browser autoplay rules). Progress is saved
to `localStorage`, so **Continue** resumes where you left off.

## Requirements

A recent **desktop** browser with **WebGL2** and pointer lock — latest Chrome, Edge, or
Firefox. If WebGL2 is unavailable the game shows a graceful "failed to start" message instead
of a blank screen.

## Develop

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server at http://localhost:5173
npm run build    # type-check (tsc) + production build into dist/
npm run preview  # serve the production build locally
npm test         # run the Vitest unit tests
npm run e2e      # run the Playwright end-to-end tests
```

## Deploy (Vercel)

The repo ships a [`vercel.json`](./vercel.json) that pins the build (`npm run build` →
`dist/`) and sets immutable cache headers for the hashed asset bundle. To publish:

```bash
npm i -g vercel   # or use: npx vercel
vercel login      # one-time, interactive
vercel            # deploy a preview
vercel --prod     # deploy to production
```

Alternatively, push this repo to GitHub/GitLab and **Import Project** in the Vercel
dashboard — it will pick up `vercel.json` automatically. The build output is a static site,
so it can also be hosted on any static host (Netlify, Cloudflare Pages, GitHub Pages, S3,
etc.) — `base: './'` in [`vite.config.ts`](./vite.config.ts) keeps asset paths relative.
