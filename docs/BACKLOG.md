# BuzzBowl — backlog / revisit later

Not scheduled work; capture decisions and follow-ups so nothing gets lost.

---

## Deploy

- **Phase 1 (single host):** see root [`README.md`](../README.md) — `render.yaml` blueprint, `SERVE_CLIENT=1`, optional `CLIENT_ORIGIN`, omit `VITE_SERVER_URL` for same-origin.
- **Phase 2+:** split UI vs API — set `VITE_SERVER_URL` at client build time and point `CLIENT_ORIGIN` at the static host.

---

## Question sources

- **Room creation option:** “Quiz bowl (QB Reader)” vs **“Jeopardy-style”** (e.g. [JService](http://jservice.io/) or similar API).
- Map Jeopardy clues to the same tossup / reveal / buzz flow (or a simplified clue card if wording differs).
- Legal / attribution for third-party trivia sources.

---

## Answer privacy (in progress)

**Goal:** avoid showing the full answer line on the **main** screen while steals are still possible; judge without leaking to the room.

**Shipped (v1 slice):**

- Rotating **reader** per tossup (`readerPlayerId` in game state); reader’s phone gets the answer line for the whole tossup; **host / main** does not until the break screen (`lastRoundAnswer` after each tossup).
- Reader **cannot buzz** on their reader tossup. Per-socket `game_state` so the answer is not broadcast to the room.
- **Reader device** runs tossup controls (pause/resume reveal, show full, correct/incorrect, skip, next tossup); HostLive is display-first so the TV/laptop need not be clicked.

**Still open / later:**

1. Optional host override UI on the main screen without leaking the answer.
2. Optional dedicated “TV display” route if the host laptop is mirrored and must stay blank.
3. Richer reader rotation rules if roster changes mid-game.

**Original design notes:**

1. **Rotating “reader” / temporary host** per round (or per tossup), chosen by the app.
2. **That player’s phone** shows the answer (and judging UI, if we move judging off the TV).
3. **Main screen:** can show the answer **only at end of round** (after judging / steals resolved) so the room isn’t cheating mid-clue.

### Free-for-all

- Cycle players in order; each round **one** player is temp host / reader (cannot buzz that round).
- Everyone else buzzes as today; temp host sees answer on device.

### Team mode

- Same idea, but **alternate which team** supplies the temp host each round (Team A → Team B → A …), still one designated reader per round.

### Engineering follow-ups

- ~~Server state: `readerPlayerId`, eligibility rules (who may buzz)~~ **Done** (per-socket `game_state` for answer line).
- Split UI: “main display” route vs “reader phone” vs “regular player buzz” — **partial** (HostLive + PlayGame only; no separate cast URL yet).
- ~~Update `docs/architecture.md`~~ **Done** for this slice; README refresh optional.

---

## UI / polish

- ~~**Home hero:** BuzzBowl title / badge visually centered (`Index.tsx`).~~ **Done**
- Audit other screens for alignment on large TVs.

---

## Player identity / display

- Optional **selfie at join** (with nickname): capture from device camera, crop/compress, store **session-scoped** only for v1 (no accounts until later).
- **Big screen:** show the photo next to the player name in the roster / scoreboard instead of (or optionally alongside) the random **emoji** avatar from `mapServerPlayers`.
- Permissions UX (camera denied → fall back to emoji), and host ability to clear a bad image per player if needed.

---

## Docs / repo hygiene

- **Architecture:** `docs/architecture.md` (Mermaid) — **exists**; keep in sync after reader rotation + new question sources land.
- **README:** refresh “current vs planned” when major features ship (links to `architecture.md` / `BACKLOG.md` are already in the root README).
- ~~**Optional:** remove `quiz-party-main/` snapshot from repo~~ **Done** (attribution in README if needed).

---

## Reference

- Product intent: `BuzzBowl-Product-Design-v0.2.md`
- Locked v1 defaults (update when backlog items ship): `v1-decisions.md`