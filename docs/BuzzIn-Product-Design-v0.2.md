# BuzzIn — Quiz Bowl Party Game

## Product Design Document v0.2

**Source:** [Claude public artifact](https://claude.ai/public/artifacts/5482b0c1-2ff9-4284-b95f-ca0f5f8bdb2c) (user-generated; unverified on host).

**v0.2 project note:** PDF packet upload and parsing are **deferred**; v1 questions come **only from the QB Reader API** (see §3, §10–§11).

**Resolved defaults for v1:** [v1-decisions.md](./v1-decisions.md).

---

## 1. Overview

BuzzIn is a web-based party game where a host displays quiz bowl questions on a shared screen (TV, laptop, or projector) while players join from their phones via a short room code — no app install required. Players buzz in to answer; the host judges answers and awards points in real time.

The game supports two modes: Free for All (every player has a buzzer) and Head-to-Head Team Mode (two teams, one representative per team competes per round).

### Core Experience

1. Host opens the web app, creates a room, and sees a 6-character code (e.g. `RKTF72`)
2. Players navigate to the site on their phone, enter the code and a nickname
3. The host picks a game mode, question set, and settings, then starts the game
4. A question appears on the host/main screen (displayed word-by-word, quiz bowl style)
5. Eligible players can buzz in — all other buzzers lock out immediately
6. The host reads the answer, marks it right or wrong, and play continues
7. Scores accumulate; a winner (or winning team) is declared at the end

---

## 2. Existing Landscape

Several buzzer apps exist (EZBuzzer, BuzzIn.live, JustBuzz.in) but none combine:

- Real quiz bowl question content with the buzzer mechanic
- A main shared display screen + phone-as-controller model
- No app install (pure mobile web)

The gap this app fills: an all-in-one party game, not just a buzzer infrastructure tool. Optional later: host-uploaded packets (PDF), if licensing and parsing cost are acceptable.

---

## 3. Question Sources

**v1:** QB Reader only (see project note at top). A second source may be added later.

### 3a. QB Reader API (v1 — sole question source)

[QB Reader](https://www.qbreader.org/) provides a free public API backed by the Quizbowl Packet Archive (quizbowlpackets.com) — tens of thousands of real quiz bowl tossup and bonus questions.

Key API capabilities:

- Query by category (History, Science, Literature, Fine Arts, etc.)
- Filter by difficulty (middle school, high school, college, open)
- Fetch individual tossups (single-answer) or bonuses (3-part)
- Questions include "power mark" positions (the `(*)` marker in real quiz bowl)

For a party game, tossups are the right format — one question, first correct buzz wins points.

### 3b. PDF packet upload (deferred — post-MVP)

Out of scope for v1. If brought back: server-side PDF → text, heuristics for tossup/`ANSWER:` blocks, host preview/edit, session-scoped storage — plus clear licensing disclaimers (see §10, §11).

---

## 4. Game Modes

### 4a. Free for All

The default mode. Every player who joins gets their own buzzer. First to buzz and answer correctly wins the points. Standard quiz bowl rules apply.

- Any number of players (soft cap ~20)
- Individual scoring — personal leaderboard
- All buzzers active simultaneously on each question
- Neg penalty applies when buzzing mid-question and answering wrong

### 4b. Head-to-Head Team Mode

Players are divided into two named teams at lobby setup. Each round, one player from each team is selected as the active representative — only those two players have live buzzers. The rest of their team watches. After each question (or after a configurable number of questions), the active representative rotates to the next player on each team.

Key mechanics:

- Host assigns players to Team A or Team B in the lobby (drag-and-drop or tap-to-assign)
- Each team has a visible roster; the currently active player is highlighted on the main screen
- Only the two active players' phones show a live buzz button; all others show a "watching" state
- Scores are tracked at the team level (sum of all representatives' correct answers)
- Rotation: after each question, the next player in each team's queue becomes active — OR the host can trigger rotation manually
- If a representative answers incorrectly (neg), the other team's representative gets a chance to answer (standard quiz bowl courtesy)
- At the end of all matchups, the team with more points wins

Lobby setup for Team Mode:

- Host names the two teams (e.g. "Red" / "Blue", or custom names)
- Players join normally via room code, then are assigned to a team
- Host can shuffle teams randomly or assign manually
- Host sets rotation style: auto after every question or manual rotation

---

## 5. User Roles


| Role                          | Device                       | Responsibilities                                                                                       |
| ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Host                          | Laptop / tablet / TV browser | Creates room, picks mode & questions, starts/stops game, assigns teams, judges answers, manages scores |
| Active Player                 | Phone browser                | Buzzes in, answers question                                                                            |
| Bench Player (Team Mode only) | Phone browser                | Watches current matchup, sees score, waits for their turn                                              |


The host screen doubles as the main shared display — it should be designed to be readable from across a room (large fonts, high contrast).

---

## 6. Key Screens

### Host Screens

**6.1 Home / Create Room**

- Big "Create Game" button
- Room code displayed prominently once created
- QR code option for easy player joining
- Live lobby showing players as they join (names appear in real time)
- Mode selector: Free for All vs. Head-to-Head Team Mode
- Settings panel: QB Reader filters (category, difficulty, etc.), number of questions, points for correct/incorrect answers

**6.2 Team Assignment Screen (Team Mode only)**

- Drag-and-drop (or tap) to assign players to Team A and Team B
- Team name fields (editable)
- "Shuffle" button to randomize assignments
- Rotation setting: auto (every question) or manual
- "Lock Teams & Start" button

**6.3 Main Game Screen (Host View)**

- Question text displayed large — revealed word-by-word at a configurable pace
- Team Mode: prominently shows the two active players' names and team colors; full rosters visible in sidebar with queue order
- Free for All: full player list in sidebar
- "Pause reveal" and "Resume" controls
- Buzzer status panel: shows who buzzed in, highlighted prominently
- Buttons: Correct (+points, next question) | Incorrect (-points or 0, unlock other buzzer/players)
- Scoreboard sidebar (live) — individual scores in FFA, team scores in Team Mode
- "Skip question" and "Rotate now" (Team Mode) options

**6.4 Between Questions**

- Brief score summary
- In Team Mode: shows who the next active players are for each team
- Host taps "Next Question" to continue
- Option to end game early

**6.5 End Game**

- Free for All: individual leaderboard, winner highlighted
- Team Mode: team score totals, winning team celebration
- Confetti animation
- Option to play again

### Player Screens

**6.6 Join Screen**

- Room code entry (or scan QR)
- Nickname entry
- "Join Game" button

**6.7 Waiting Lobby**

- "Waiting for host to start..." message
- See other players who have joined
- In Team Mode: see team assignments once host locks them in

**6.8 Buzz Screen (Active Player)**

- Giant buzz button (full-screen, easy to tap fast)
- Visual state: Ready (green) → Locked (gray) → You Buzzed! (yellow/gold)
- Haptic feedback on buzz (mobile vibration API)
- Current score / team score shown below

**6.9 Bench Screen (Team Mode — Non-Active Players)**

- "You're up next!" or position in queue (e.g. "You're #3 in queue")
- View of current active matchup: who's buzzing for each team
- Live team scores
- No buzz button — clearly communicated they are watching this round

**6.10 Result Feedback**

- "✅ Correct! +10 pts" or "❌ Incorrect. -5 pts"
- Brief animation, then returns to buzz/bench screen for next question

---

## 7. Real-Time Architecture

The core technical challenge is sub-100ms buzz synchronization across all players.

Recommended stack:

- Frontend: Vanilla JS or lightweight framework (React/Svelte) — no install, fast load on mobile
- Backend: Node.js with WebSockets (Socket.io or native WS)
- Hosting: Any cloud provider (Railway, Fly.io, Render, etc.)
- No database required for MVP — all session state is held in memory on the server

### WebSocket Event Flow — Free for All

```
Player buzzes
  → Client sends { event: "BUZZ", playerId, roomCode, timestamp }
  → Server receives, checks if room is in "open" state
  → If first buzz: locks room, broadcasts { event: "BUZZ_WINNER", playerId, playerName }
  → All other clients receive lock event, disable their buzz button
  → Host receives winner highlight
  → Host clicks Correct/Incorrect
  → Server broadcasts { event: "SCORE_UPDATE", scores[] }
  → Server resets buzz state, broadcasts { event: "BUZZ_OPEN" }
```

### WebSocket Event Flow — Team Mode

```
Host starts question
  → Server broadcasts { event: "ROUND_START", activePlayerA, activePlayerB }
  → Only activePlayerA and activePlayerB phones receive BUZZ_ENABLED
  → All other phones receive BUZZ_WATCHING

Active player buzzes
  → Client sends { event: "BUZZ", playerId, roomCode, timestamp }
  → Server checks: is playerId one of the two active players?
  → If yes and first buzz: locks both buzzers, broadcasts { event: "BUZZ_WINNER", ... }

Host marks Incorrect (neg)
  → Server unlocks only the opposing active player's buzzer
  → Broadcasts { event: "BUZZ_OPEN", eligiblePlayerId: otherActivePlayer }

Host marks Correct or Skip
  → Server broadcasts { event: "SCORE_UPDATE", teamScores[] }
  → Server advances rotation queue, broadcasts { event: "ROUND_END", nextActivePlayerA, nextActivePlayerB }
```

### Room Codes

- 6-character alphanumeric, uppercase, excluding ambiguous chars (0, O, I, 1)
- Generated server-side, stored in memory with TTL of ~4 hours
- Rooms support up to ~20 players comfortably (soft limit)

---

## 8. Scoring

Default point values (configurable by host):

- Correct answer: +10 points
- Incorrect answer (before question ends): -5 points (neg/interrupt penalty, true to quiz bowl)
- Incorrect answer (after question fully read): 0 points, question open to others
- Power answer (buzz before power mark `(*)`): +15 points (optional, for quiz bowl purists)

In Free for All, points accrue to individual players.

In Team Mode, points accrue to the team. The active player who earned or lost points is noted in the score log for transparency, but the scoreboard shows team totals. A neg by one representative does not penalize their teammates' future turns — only the team's running total is affected.

---

## 9. Question Reveal Mechanic

True to quiz bowl format, questions are revealed progressively:

- Default: words appear one-by-one at ~2 words/second
- Host can pause/resume the reveal (to read aloud)
- Host can "show full question" at any time
- Players can buzz at any point during the reveal

The question text should visually distinguish already-revealed words from upcoming (grayed out or hidden).

---

## 10. PDF parsing pipeline (deferred)

**Status:** Tabled for v1; questions come from QB Reader only.

When revisited, sketch for uploaded packets:

```
Upload PDF
  → Extract raw text (pdfplumber or pdf-parse)
  → Split into blocks by question number patterns (e.g. "1.", "2.", etc.)
  → For each block:
      - Identify ANSWER: line → extract answerline
      - Strip category headers, packet metadata
      - Detect (*) power mark position
  → Return array of { questionText, answerLine, powerMarkIndex }
  → Host previews parsed questions, can delete/edit before starting
```

Common packet format (NAQT, ACF, etc.) is fairly consistent, making regex-based parsing viable. Fallback ideas: copy-paste raw text, or manual host entry.

---

## 11. MVP Scope vs. Future Features

### MVP (v1)

- Room creation with 6-char code
- Phone join via mobile web (no install)
- Free for All mode (all players, individual scores)
- Head-to-Head Team Mode (2 teams, rotating representatives, 2 active buzzers)
- QB Reader API integration (tossups, filterable by category/difficulty)
- Real-time buzzer with lock-out
- Host correct/incorrect judging
- Live scoreboard (individual for FFA, team totals for Team Mode)
- End game screen

### Post-MVP (v2+)

- PDF packet upload + parsing (and related disclaimers)
- QR code join
- Power mark scoring
- Bonus question format (3-part, awarded to team that won the tossup)
- Timed answer mode (countdown after buzz)
- Host-less mode (rotate reader role)
- Custom categories / question tagging
- Game history / replay
- Shareable room links
- More than 2 teams in Team Mode

---

## 12. Tech Stack Recommendation


| Layer               | Choice                                                | Rationale                                         |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| Frontend            | React + Vite                                          | Fast dev, component model suits host/player split |
| Styling             | Tailwind CSS                                          | Rapid UI, good mobile support                     |
| Real-time           | Socket.io                                             | Simple WebSocket abstraction, auto-reconnect      |
| Backend             | Node.js (Express)                                     | Same language front/back, Socket.io native        |
| Question API        | QB Reader public API                                  | Free, real quiz bowl questions                    |
| PDF parsing (later) | Python microservice or `pdfplumber` via child process | Only if custom packets return to scope            |
| Hosting             | Fly.io or Railway                                     | Easy WebSocket support, free tier                 |
| Session storage     | In-memory (Map)                                       | Sufficient for MVP, no DB setup needed            |


---

## 13. Open Questions

1. Rotation cadence in Team Mode: Auto-rotate after every question, or every N questions? Every question keeps it maximally fair but can feel abrupt mid-momentum.
2. Uneven team sizes: If Team A has 4 players and Team B has 3, does Team B's last player get an extra turn, or does the game cut short to match? Needs a rule.
3. Neg in Team Mode: After a neg, should the opposing rep always get a shot, or only if the question is still mid-reveal? (True quiz bowl: only if question wasn't fully read.)
4. Monetization: Free forever, or paid for large rooms / premium features?
5. QB Reader usage: Confirm [API terms](https://www.qbreader.org/) for **attribution** and allowed use; caching rules if you prefetch. Rate limits are a low priority for friends-only v1.
6. Mobile web limitations: Vibration API works on Android but not iOS Safari. Acceptable?
7. App name: "BuzzIn" is placeholder — worth checking for trademark conflicts.

*(Deferred with PDF: packet licensing for host uploads, parsing accuracy / host edit burden.)*

---

## 14. Design review notes (recommendations)

**What’s strong**

- Clear split between host display and phone controllers; modes (FFA vs team) are well motivated.
- WebSocket flows in §7 are a good backbone for implementation; in-memory rooms match MVP simplicity.
- Progressive reveal (§9) matches quiz bowl feel and differentiates the product.

**Clarify or tighten**

- **Buzz winner authority:** Treat client `timestamp` as advisory only. The server should pick the first buzz by **order of receipt** (or a monotonic server sequence) so clock skew and cheating don’t decide ties. Document that explicitly in §7.
- **FFA after “incorrect”:** §8 distinguishes neg (mid-reveal) vs wrong after full question, but §7’s FFA flow always resets with `BUZZ_OPEN`. Spell out: after a neg, re-open to everyone; after wrong on a completed tossup, either next question or “open to others” per §8 — so host UI and server state stay aligned.
- **Team mode + neg:** §4b and §7 imply the other rep gets a shot; align with §8 (only when question not fully read, if you want strict quiz bowl). Make the rule one sentence in §4b or §8 and mirror it in events.
- **MVP vs UI copy:** Join screen (§6.6) mentions “scan QR” while QR is listed post-MVP (§11). Either drop QR from join copy for v1 or promote QR to MVP if it’s cheap (encode URL + room code).
- **Question pipeline:** For QB Reader, decide early: fetch tossups **on demand** per question vs **prefetch a run** at game start (fewer API calls, simpler offline-of-API during a round). Both are valid; prefetch avoids mid-game latency.

**QB Reader–only v1**

- Skim their API/docs for **attribution** and allowed use (§13). For early friends-only playtests, **rate limits** need not drive architecture; revisit if traffic grows. Cache or batch per their rules if you prefetch tossups.
- Handle **empty or unsuitable** results (category + difficulty too narrow): host message + “try different filters” beats a broken game.

**Operational / product**

- **Reconnect:** **v1** (per [v1-decisions.md](./v1-decisions.md)): rely on **Socket.io reconnect for the same browser tab** on brief drops. **Do not** require restoring the same player identity after the tab is closed or refreshed — that player joins again as a **new** participant (new nickname). **Token-based rejoin** that restores score and team is **post-v1**.
- **Abuse:** Room codes are guessable at small entropy (even 6 chars). Optional: rate-limit joins per IP, or use longer codes / single-use tokens if abuse appears.
- **Host handoff:** If the host refreshes, the room should survive (host secret or “claim host” flow) so the TV doesn’t kill the party.
- **Scope for first ship:** Team mode + reveal + QB Reader + solid buzzer correctness is a lot. If schedule slips, consider **FFA-only v1** and team mode as v1.1 — the doc can stay as the north star.

**Accessibility / polish**

- Host view: large type and contrast (already noted) plus **visible focus** for keyboard-driven host is helpful in dim rooms.
- iOS: no vibration (§13) — use clear **color + motion** on buzz states so feedback isn’t vibration-only.

