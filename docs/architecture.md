# BuzzBowl — architecture (current)

High-level view of what exists **today** in the repo. **Answer privacy (v1):** per-tossup `readerPlayerId`, reader-only answer on the wire during play, full answer on the break screen for everyone. Still planned: Jeopardy source, optional TV-only route — see [BACKLOG.md](./BACKLOG.md).

---

## System context

```mermaid
flowchart TB
  subgraph clients["Browsers"]
    H[Host UI]
    P[Player UI]
  end

  subgraph buzzbowl["BuzzBowl monorepo"]
    API["Express HTTP"]
    IO["Socket.io"]
    RM[Room registry<br/>in-memory Map]
    R[Room class<br/>state machine]
    QB[QB Reader fetch<br/>server-side]
  end

  subgraph external["External"]
    QBR["qbreader.org/api"]
  end

  H --> API
  P --> API
  H <-->|WebSocket| IO
  P <-->|WebSocket| IO
  IO --> R
  R --> RM
  QB --> QBR
  R -.->|start_game| QB
```

---

## Monorepo layout

```mermaid
flowchart LR
  subgraph root["Repository root"]
    PKG["package.json<br/>workspace: buzzbowl"]
  end

  subgraph client["client/"]
    VITE["Vite + React 18"]
    UI["Tailwind + shadcn/ui"]
    RTR["React Router"]
    SOC["socket.io-client"]
  end

  subgraph server["server/"]
    EXP["Express"]
    SIO["socket.io"]
    HAND["socket.ts"]
    ROOM["room.ts"]
    REG["registry.ts"]
  end

  root --> client
  root --> server
  SOC <--> SIO
  HAND --> ROOM
  HAND --> REG
```

---

## Client routes (logical)

```mermaid
flowchart LR
  I["/"]
  HG["/host"]
  L["/lobby/:code"]
  HL["/host/game/:code"]
  J["/join"]
  PG["/play/:code"]

  I --> HG
  I --> J
  HG --> L
  J --> L
  L --> HL
  L --> PG
```

---

## Socket.io — main server events (summary)

| Direction | Events (examples) |
|-----------|-------------------|
| Client → server | `create_room`, `host_join`, `player_join`, `player_identify`, `set_game_mode`, `set_player_team`, `update_settings`, `start_game`, `pause_reveal`, `resume_reveal`, `show_full_question`, `buzz`, `mark_correct`, `mark_incorrect`, `skip_question`, `continue_game` |
| Server → room | `game_state` (room snapshot; **answer line** omitted for non-readers during `playing`; reader matches `socket.data.playerId === readerPlayerId`) |

---

## Room lifecycle (server)

```mermaid
stateDiagram-v2
  [*] --> lobby
  lobby --> playing: start_game
  playing --> between: tossup round finished
  between --> playing: continue_game
  playing --> ended: no more tossups
  ended --> [*]
```

---

## Planned / partial

Documented in [BACKLOG.md](./BACKLOG.md):

- **Jeopardy-style** question option (e.g. JService) alongside QB Reader.
- **Answer privacy — remaining:** judging from reader phone, dedicated cast-only display if the host machine is mirrored.

**Implemented:** rotating reader per tossup (`readerPlayerId`), reader excluded from buzz, per-socket `game_state` for the printed answer during play, `lastRoundAnswer` on the `between` screen for all clients.

---

## Related docs

- [BACKLOG.md](./BACKLOG.md) — deferred tasks and design notes
- [BuzzBowl-Product-Design-v0.2.md](./BuzzBowl-Product-Design-v0.2.md) — product spec
- [v1-decisions.md](./v1-decisions.md) — implementation defaults
