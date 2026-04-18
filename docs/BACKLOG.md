# BuzzBowl — backlog / revisit later

Not scheduled work; capture decisions and follow-ups so nothing gets lost.

---

## Deploy

- **Phase 1 (single host):** see root `[README.md](../README.md)` — `render.yaml` blueprint, `SERVE_CLIENT=1`, optional `CLIENT_ORIGIN`, omit `VITE_SERVER_URL` for same-origin.
- **Phase 2+:** split UI vs API — set `VITE_SERVER_URL` at client build time and point `CLIENT_ORIGIN` at the static host.

---

## Question sources

- **OpenTDB (general trivia):** implemented on the server (`server/src/opentdb.ts`, `server/src/questionFetch.ts`) but **not exposed** in the host UI yet; `updateSettings` currently forces `questionSource: "qbreader"` until we’re ready to ship it.
- **Room creation option (future):** turn OpenTDB back on in the client + relax the server guard, or add **Jeopardy-style** (e.g. [JService](http://jservice.io/)) and map clues into the same tossup / reveal / buzz flow (or a simplified clue card if wording differs).
- Legal / attribution for third-party trivia sources.

---

## Answer privacy (in progress)

**Goal:** avoid showing the full answer line on the **main** screen while steals are still possible; judge without leaking to the room.

**Shipped (v1 slice):**

- Rotating **judge** per question (`readerPlayerId` in game state — wire name unchanged); judge’s phone gets the answer line for the whole question; **host / main** does not until the break screen (`lastRoundAnswer` after each question).
- Judge **cannot buzz** on their question. Per-socket `game_state` so the answer is not broadcast to the room.
- **Judge device** runs question controls (pause/resume reveal, show full, correct/incorrect, skip, next question); HostLive is display-first so the TV/laptop need not be clicked.
- **Pre-round countdown** (~3s) before the first question and before each “next question” after a break; **no countdown** when continuing straight to **game over / results**.
- **FFA:** vote-to-skip counts only non-judge players; judge does not vote (force skip on device).

**Still open / later:**

1. Optional host override UI on the main screen without leaking the answer.
2. Optional dedicated “TV display” route if the host laptop is mirrored and must stay blank.
3. Richer judge rotation rules if roster changes mid-game.

**Original design notes:**

1. Rotating **judge** per round (or per question), chosen by the app.
2. **That player’s phone** shows the answer (and judging UI, if we move judging off the TV).
3. **Main screen:** can show the answer **only at end of round** (after judging / steals resolved) so the room isn’t cheating mid-clue.

### Free-for-all

- Cycle players in order; each round **one** player is judge (cannot buzz that round).
- Everyone else buzzes as today; judge sees answer on device.

### Team mode

- Same idea, but **alternate which team** supplies the judge each round (Team A → Team B → A …), still one designated judge per round.

### Engineering follow-ups

- ~~Server state: `readerPlayerId`, eligibility rules (who may buzz)~~ **Done** (per-socket `game_state` for answer line).
- Split UI: “main display” route vs “judge phone” vs “regular player buzz” — **partial** (HostLive + PlayGame only; no separate cast URL yet).
- ~~Update `docs/architecture.md`~~ **Done** for an earlier slice; refresh when OpenTDB + countdown ship publicly.

---

## UI / polish

- ~~**Home hero:** BuzzBowl title / badge visually centered (`Index.tsx`).~~ **Done**
- ~~**Pre-round countdown** (get ready before first question and after each break); skip countdown when advancing to **results** only.~~ **Done**
- ~~**Break / countdown UX:** top 3 scores on break; one fixed blurb per pre-round countdown (stable for that timer).~~ **Done**
- ~~**Quizbowl:** category emoji + label on play + host live while `questionSource === "qbreader"`.~~ **Done**
- ~~**Help dialog:** trimmed verbose sections (between/end, skip vote explainer, answer timer explainer, scoring footer).~~ **Done**
- ~~**Countdown display:** cap answer timer / next-question digits to host settings so UI doesn’t flash “11” for 10s, etc.~~ **Done**
- Audit other screens for alignment on large TVs.

---

## Player identity / display

- ~~Optional **selfie at join** (with nickname): capture from device camera, crop/compress, store **session-scoped** only for v1 (no accounts until later).~~ **Done** (`JoinGame` / `Lobby` host path + `compressSelfieFile`, `avatarDataUrl` on server.)
- **Big screen:** show the photo next to the player name in the roster / scoreboard everywhere the host expects a “TV” roster (some views still emoji-first); optional host tool to clear a bad image per player.
- Permissions UX (camera denied → fall back to emoji), and host ability to clear a bad image per player if needed.

---

## Docs / repo hygiene

- **Architecture:** `docs/architecture.md` (Mermaid) — **exists**; keep in sync after OpenTDB is enabled, countdown, and judge/remote flows stabilize.
- **README:** refresh “current vs planned” when major features ship (links to `architecture.md` / `BACKLOG.md` are already in the root README).
- ~~**Optional:** remove `quiz-party-main/` snapshot from repo~~ **Done** (attribution in README if needed).

---

## Reference

- Product intent: `BuzzBowl-Product-Design-v0.2.md`
- Locked v1 defaults (update when backlog items ship): `v1-decisions.md`

