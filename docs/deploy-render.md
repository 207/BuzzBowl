# Deploy BuzzBowl on Render (first time)

You already have a Render account via **Log in with GitHub**. This guide walks you through connecting your **BuzzBowl** GitHub repo and starting the app on the public internet.

Render runs a **Web Service**: one URL for both the website and WebSockets (Phase 1).

---

## Before you open Render

1. **Code on GitHub**
  Render pulls from GitHub, not from your laptop. Your project must be pushed to a repo Render can see (e.g. `207/BuzzBowl`).
2. **Which branch?**
  Deploy from `**main`** once your Phase 1 changes are merged, **or** pick branch `**deploy/phase1`** in Render if you are testing that branch first.
3. **Repo access**
  The first time you connect a repo, GitHub may ask you to **authorize Render** (all repos or only selected ones). Choose so that the BuzzBowl repo is included.

---

## Path A — Blueprint (fewest fields to type)

Use this if `[render.yaml](../render.yaml)` is on the branch you deploy.

1. In the [Render Dashboard](https://dashboard.render.com), click **New +** (top right).
2. Choose **Blueprint**.
3. Connect the **same GitHub account** you used for Render login, pick the **BuzzBowl** repository.
4. Render should detect `render.yaml`. Confirm the service **buzzbowl** and click **Apply** (or **Create** / **Deploy** — exact label varies).
5. Wait until the deploy finishes (green **Live** or similar). Open the **URL** Render shows (e.g. `https://buzzbowl-xxxx.onrender.com`).

If Blueprint is not offered or the file is not found, use **Path B** below.

---

## Path B — Web Service (manual fields)

1. **New +** → **Web Service**.
2. **Connect** your GitHub account if asked, then select the **BuzzBowl** repository.
3. Fill in (adjust names if you like):

  | Field              | Value                                      |
  | ------------------ | ------------------------------------------ |
  | **Name**           | `buzzbowl` (or anything)                   |
  | **Region**         | Closest to you                             |
  | **Branch**         | `main` (or `deploy/phase1` for testing)    |
  | **Root directory** | *(leave empty)* — monorepo root is correct |
  | **Runtime**        | `Node`                                     |
  | **Build Command**  | `npm install && npm run build`             |
  | **Start Command**  | `SERVE_CLIENT=1 npm run start -w server`   |
  | **Instance type**  | Free (or Starter if Free is unavailable)   |

4. Open **Advanced** (or **Environment**) and add:

  | Key            | Value                                        |
  | -------------- | -------------------------------------------- |
  | `SERVE_CLIENT` | `1`                                          |
  | `NODE_VERSION` | `22.14.0` *(optional but matches this repo)* |

   **Do not set `CLIENT_ORIGIN` on first deploy** unless you use a custom domain. The server reads `**RENDER_EXTERNAL_URL`** automatically on Render so CORS matches your service URL.
5. **Health Check Path**: `/health`
6. Click **Create Web Service** (or **Deploy**). The first build can take **several minutes** (`npm install` + full build).

---

## While it deploys

- Open the **Logs** tab. You want to see the server start without errors.
- Typical failures:
  - **Build failed** — scroll up in logs for the first red error (often Node version; `NODE_VERSION` env helps).
  - **Wrong branch** — no `render.yaml` or old code; fix branch in service **Settings**.

When logs show something like `BuzzBowl listening on port ...` and the deploy is **Live**, continue.

---

## After it is live

1. Click the `**.onrender.com`** URL Render gives you.
2. You should see the **BuzzBowl** home page (same as local, but on the internet).
3. **Host a game** on your laptop browser; on your **phone** (cellular or Wi‑Fi), open the **same URL**, tap **Join**, enter the room code — everyone must use the **same** `https://...` host so WebSockets work.

**Phones on the same Wi‑Fi as the TV** still use the **public** Render URL, not `localhost`.

---

## If something breaks


| Symptom                              | What to check                                                                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Blank page or 404                    | Logs: did `client/dist` build? `SERVE_CLIENT=1` set?                                                                                         |
| Page loads but “Connecting…” forever | Browser devtools → **Network** → WS failed: wrong origin or mixed `http`/`https`. Don’t set `VITE_SERVER_URL` for Phase 1 same-origin build. |
| CORS errors in console               | Set `**CLIENT_ORIGIN`** in Render to your exact site URL (copy from address bar, no trailing slash), redeploy.                               |
| Service sleeps (free tier)           | First visit after idle can take **30–60s** while it wakes up.                                                                                |


---

## Custom domain (later)

1. Render: **Settings** → **Custom Domains** → add `game.yourdomain.com`.
2. Add the DNS records Render shows (at your DNS host).
3. In Render **Environment**, set `**CLIENT_ORIGIN`** to `https://game.yourdomain.com` (your real HTTPS URL), then **Manual Deploy** so the server picks it up.

---

## Security note

The **host secret** for a room lives in the browser’s **sessionStorage** on whoever opened the lobby. That is fine for friends; do not treat a public URL as private data storage.

---

## Where this fits in the repo

- Server entry: `[server/src/index.ts](../server/src/index.ts)` (`SERVE_CLIENT`, static files, `resolveClientOrigin`).
- Blueprint: `[render.yaml](../render.yaml)`.
- Short summary: root `[README.md](../README.md)` → **Production (Phase 1)**.