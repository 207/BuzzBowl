# BuzzBowl v1 — decision log

Working defaults for implementation and playtesting. Adjust as you learn; this file is the “we picked X” anchor (see also `BuzzBowl-Product-Design-v0.2.md` §13–§14).

---

## Product & scope


| Decision                 | Choice                                             | Notes                                                                                                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Question source (v1)** | QB Reader API only                                 | No PDF; no custom packets until a later milestone.                                                                                                                                                                                                         |
| **Monetization (v1)**    | Free; no payments                                  | Revisit after real usage (rooms, costs, abuse).                                                                                                                                                                                                            |
| **Name**                 | Ship as **BuzzBowl** for v1                        | Do a quick trademark/web search before any public marketing spend.                                                                                                                                                                                         |
| **MVP contingency**      | If timeline slips: **FFA-only v1**, team mode next | North star stays full doc; this is an explicit escape hatch.                                                                                                                                                                                               |
| **Audience (early v1)**  | **Friends-only** playtests                         | No need to engineer around QB Reader rate limits yet; still follow their ToS when you read them.                                                                                                                                                           |
| **Player rejoin**        | **Not in v1**                                      | No “same person, same score” after the tab closes or they leave. They can **join again** with the room code as a **new** player (new nickname), or you accept a duplicate nickname for friends-only. **Full rejoin / restore identity** → later milestone. |


---

## Game rules (team mode)


| Decision                   | Choice                                                                                                                                                                                                                                                                            | Notes                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Rotation cadence**       | **Auto-advance both reps after each completed tossup** (correct, wrong after no more buzzes, or skip)                                                                                                                                                                             | Maximally fair and simple to explain. Host keeps **“Rotate now”** for manual override (already in PDD).                                   |
| **Uneven team sizes**      | **Independent circular queues**: after each round, `nextA = (idxA + 1) % lenA`, same for B                                                                                                                                                                                        | Players on the smaller team get turns **more often**; acceptable for a party game. Document in UI: “Smaller team — players cycle faster.” |
| **Neg → other rep (team)** | **Strict quiz bowl:** opposing rep gets a buzz **only if the tossup is still mid-reveal** (question not fully shown/read per game state). If tossup was fully revealed before the neg, **no** second buzzer unlock — host goes to resolution / next question per FFA-style rules. | Matches §8 “interrupt vs after full question” spirit; server needs `revealComplete` (or equivalent) in state.                             |


---

## Free for all — after “incorrect”


| Decision                           | Choice                                                                                                | Notes                                                                                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Neg (buzzed mid-reveal, wrong)** | **Re-open buzzers** to all eligible players; same tossup continues                                    | Server broadcasts `BUZZ_OPEN` to all (no winner locked).                                                                                                            |
| **Wrong after tossup complete**    | **No points** to that player; **either** host opens to others **or** host advances (pick one default) | **v1 default:** if anyone else can still buzz, **re-open**; if only one player left or host ends tossup, **next question**. Host always has **Skip** to force next. |


---

## Real-time & fairness


| Decision                | Choice                                                         | Notes                                                                                                               |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Who wins a tie buzz** | **Server order only** — first `BUZZ` the server processes wins | Ignore client `timestamp` for authority; optional: log client time for debugging only.                              |
| **Reveal sync**         | **Server-authoritative reveal state**                          | Host pause/resume/full-show updates server; server ticks or steps words and broadcasts so all clients stay aligned. |


---

## QB Reader


| Decision                | Choice                                                                                                                          | Notes                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fetch strategy**      | **Prefetch a buffer** at game start (e.g. batch of tossups for the selected filters), **refill** in background when running low | Cuts mid-question API latency; easier on players. For friends-only v1, batch size can be generous enough that rate limits are unlikely to bite. |
| **Terms / attribution** | **Skim QB Reader docs** when you’re close to any public launch; **honor attribution / usage** they ask for                      | **Rate limits:** not a design priority for private friend games; revisit if traffic grows.                                                      |
| **Empty / bad filters** | **Block “Start”** with a clear error: “No tossups for these filters — widen category or difficulty.”                            | Prevents a dead game mid-room.                                                                                                                  |


---

## Join UX (v1)


| Decision     | Choice           | Notes                                                                                                                                              |
| ------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **QR codes** | **Out of v1 UI** | Join = **room code + nickname** only. Add QR in v1.1 (cheap win: URL like `https://app…/?room=CODE`). Removes PDD inconsistency until implemented. |


---

## Sessions, host, abuse


| Decision                      | Choice                                                                                                                                                                           | Notes                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Player reconnect / rejoin** | **v1:** only what Socket.io gives you **for the same tab** (brief Wi‑Fi blip may auto-reconnect). **No** persisted `playerId` / token to reclaim score after refresh or new tab. | **Post-v1:** optional rejoin token + restore nickname, team, and points.                     |
| **Host refresh / new tab**    | **Host secret**: creating a room returns a **host token** stored locally; reconnecting with room code + host token **reclaims** host controls                                    | Without this, refreshing the TV kills the party.                                             |
| **Room codes**                | Keep **6 unambiguous chars** for v1                                                                                                                                              | **Optional later:** rate-limit failed join attempts per IP; lengthen code if abuse shows up. |


---

## Mobile / UX polish


| Decision               | Choice                                                                     | Notes                                                             |
| ---------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Vibration**          | **Use on Android when available**; **not required** for core UX            | Buzz states must read clearly via **color + large labels** (iOS). |
| **Host accessibility** | Large type, high contrast; **visible focus** on host controls for keyboard | Helps in dark rooms and laptop-only hosts.                        |


---

## Server state — what those fields mean

The checklist items are **per-room (or per-active-tossup) fields** the game server keeps so rules stay consistent for every client. You can name them differently in code; the ideas are what matter.

### `revealComplete` (boolean)

**Meaning:** “Has this tossup been **fully** revealed to the room?”

- `false` while words are still streaming (or host hasn’t hit “show full question”).
- `true` once the full tossup text has been shown (either reveal finished or host forced full text).

**Why it exists:** Your own rules depend on it: e.g. **neg** (wrong while still reading) vs **no neg** (wrong after the full line is out), and **whether the other team’s rep gets another buzz** in team mode. The server must not rely on the host’s memory — it keys off this flag.

---

### Buzz phase (`open` / `locked` / winner)

**Meaning:** “What part of the buzz‑judge cycle are we in for **this** tossup (or this line of play)?”

Think of it as a small state machine:


| Phase                   | Typical meaning                                                                                                                                                                                                 | Who can do what                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `**open`**              | Buzzers are **on**; no one has claimed this buzz yet (or you’ve re-opened after a neg).                                                                                                                         | Eligible players can send `BUZZ`. |
| `**locked`**            | Someone **won the race**; everyone else’s buzzer is off; you’re waiting on the **host** to mark correct / wrong / skip.                                                                                         | No new buzzes; host resolves.     |
| `**winner` (optional)** | Often folded into `locked`. If split: `winner` = which `playerId` buzzed first; `locked` = player UIs frozen. **Practical v1:** use `**buzzWinnerPlayerId`** (set or null) and treat locked as “winner is set.” | Same as locked.                   |


After the host resolves (e.g. wrong + re-open on same tossup), phase goes back to `**open`** with `buzzWinnerPlayerId` cleared. After “correct” or “next question,” you reset for a new tossup.

You don’t *have* to use three enum values if `**open` + `locked` + `buzzWinnerPlayerId`** covers your UI — the checklist is naming the **concepts**.

---

### Team rep indices

**Meaning:** “**Which** player on each team is the active buzzer for **this** head‑to‑head?”

- `**activeIndexTeamA`** (number): index into Team A’s ordered roster (0 … len−1).
- `**activeIndexTeamB*`* (number): same for Team B.

After each finished tossup (per your rotation rules), increment (with wrap):  
`activeIndexTeamA = (activeIndexTeamA + 1) % teamA.length` (and same for B).

**Why on the server:** Only the server decides who is “eligible to buzz”; phones just show buzz vs bench. If indices lived only on the host UI, a refresh or desync would break the game.

---

## Checklist before coding

- Skim QB Reader docs mainly for **attribution / allowed use**; don’t over-optimize for rate limits until you’re beyond friends-only.
- Model **per-tossup (or per-round) state** on the server: `revealComplete`, buzz eligibility + who buzzed (`buzzWinnerPlayerId` or equivalent), and **team rep indices** in team mode.
- Implement **host token** so the host display can refresh without killing the room. (**Player rejoin tokens** — skip for v1.)
- Align client copy: no QR until v1.1.