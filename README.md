# BuzzBowl

Quiz bowl–style party game: **host** on a big screen, **players** buzz in from their phones. Real-time layer is **Socket.io**; tossups come from the **[QB Reader](https://www.qbreader.org/)** API.

The **web UI** lives under `client/` and is based on the `quiz-party-main` design (Vite + React + Tailwind + shadcn/ui), wired to this repo’s game server.

**Monorepo layout:** root `package.json` (npm workspace name `buzzbowl`), packages `server/` (Node + Socket.io) and `client/` (Vite app), `docs/` for product and engineering notes.

- [Architecture (diagrams)](docs/architecture.md)
- [Backlog / revisit later](docs/BACKLOG.md)
- **[Deploy on Render (step-by-step)](docs/deploy-render.md)** — first production deploy

Clone or rename your local folder however you like (e.g. `BuzzBowl`); npm workspace names are independent of the folder name.

## Develop

```bash
npm install
npm run dev
```

- Web UI: [http://localhost:5173](http://localhost:5173)
- API + WebSocket: [http://localhost:3001](http://localhost:3001)

The Vite app talks to the server URL from `VITE_SERVER_URL` (default `http://localhost:3001`). Override in `client/.env`:

```env
VITE_SERVER_URL=http://localhost:3001
```

The server allows CORS from `CLIENT_ORIGIN` (default `http://localhost:5173` for dev).

## Production (Phase 1 — single host)

One Node process serves **Socket.io + Express + the built SPA** from the same public origin. No separate Vercel step required.

### Requirements

1. **Build:** `npm install` then `npm run build` (builds `client/` then compiles `server/`).
2. **Runtime:** `SERVE_CLIENT=1` so Express serves [`client/dist`](client/dist) and SPA fallback ([`server/src/index.ts`](server/src/index.ts)).
3. **Network:** outbound HTTPS to `https://qbreader.org/api`.
4. **Browser origin:** `CLIENT_ORIGIN` must match the URL users open (scheme + host + port, no trailing slash). If unset, the server tries, in order: `RENDER_EXTERNAL_URL` (Render), `RAILWAY_PUBLIC_DOMAIN` (Railway), `FLY_APP_NAME` (Fly.io default hostname). Local dev falls back to `http://localhost:5173`.
5. **Client socket URL:** With Phase 1, **omit** `VITE_SERVER_URL` in the production build so [`client/src/lib/socket.ts`](client/src/lib/socket.ts) connects to the **same host** as the page. Only set `VITE_SERVER_URL` for split-origin (Phase 2) deploys.

### Run locally like production

```bash
npm run build
set SERVE_CLIENT=1&& set CLIENT_ORIGIN=http://localhost:3001&& npm run start -w server
```

(PowerShell: `$env:SERVE_CLIENT=1; $env:CLIENT_ORIGIN='http://localhost:3001'; npm run start -w server`)

Open `http://localhost:3001` — UI and WebSocket share one origin.

### Render.com

Follow **[docs/deploy-render.md](docs/deploy-render.md)** for a full click-by-click walkthrough (Blueprint vs Web Service, env vars, logs, phones).

Quick reference: [`render.yaml`](render.yaml), build `npm install && npm run build`, start `SERVE_CLIENT=1 npm run start -w server`, health `/health`, leave `CLIENT_ORIGIN` unset on Render until you use a custom domain.

See [`.env.example`](.env.example) for variable reference.

### Caveats (v1)

- **In-memory rooms** — restart or deploy clears active games.
- **Free tiers** — may spin down after idle (first request cold start); fine for playtests, not ideal for always-on tournaments.

## Production build (CI or image)

```bash
npm run build
npm run start -w server
```

With `SERVE_CLIENT=1` and correct `CLIENT_ORIGIN` / platform URL. The host must reach `https://qbreader.org/api`.

## v1 scope (implemented)

- Create room / join with code + nickname (no QR, no PDF questions).
- **Free for all** and **head-to-head team** mode with per-tossup active players.
- Server-timed word reveal; host pause / resume / show full; correct / incorrect / skip.
- Tossup prefetch from QB Reader using host-selected difficulty preset and optional category.

**Routes:** `/` home · `/host` create room · `/lobby/:code` lobby · `/host/game/:code` host play screen · `/join` / `/join/:code` join · `/play/:code` player buzzer.

Host recovery after a browser refresh: reopen `/lobby/:code` on the same device (host secret is in `sessionStorage` under `buzzbowl_`* keys).