# BuzzBowl

Quiz bowl–style party game: **host** on a big screen, **players** buzz in from their phones. Real-time layer is **Socket.io**; tossups come from the **[QB Reader](https://www.qbreader.org/)** API.

The **web UI** lives under `client/` and is based on the `quiz-party-main` design (Vite + React + Tailwind + shadcn/ui), wired to this repo’s game server.

**Monorepo layout:** `package.json` at the repo root (workspace **`buzzbowl`**), packages **`server/`** (Node + Socket.io) and **`client/`** (Vite app), **`docs/`** for product notes.

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

The server allows CORS from `CLIENT_ORIGIN` (default `http://localhost:5173`).

## Production build

```bash
npm run build
npm run start -w server
```

Run the server with access to the internet so it can reach `https://qbreader.org/api`.

## v1 scope (implemented)

- Create room / join with code + nickname (no QR, no PDF questions).
- **Free for all** and **head-to-head team** mode with per-tossup active players.
- Server-timed word reveal; host pause / resume / show full; correct / incorrect / skip.
- Tossup prefetch from QB Reader using host-selected difficulty preset and optional category.

**Routes:** `/` home · `/host` create room · `/lobby/:code` lobby · `/host/game/:code` host play screen · `/join` / `/join/:code` join · `/play/:code` player buzzer.

Host recovery after a browser refresh: reopen `/lobby/:code` on the same device (host secret is in `sessionStorage` under `buzzbowl_*` keys).
