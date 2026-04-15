import cors from "cors";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket.js";

const PORT = Number(process.env.PORT) || 3001;

/** Browser origin allowed for CORS + Socket.io (must match where users load the UI). */
function resolveClientOrigin(): string {
  const explicit = process.env.CLIENT_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) return render.replace(/\/$/, "");
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${railway.replace(/\/$/, "")}`;
  const fly = process.env.FLY_APP_NAME?.trim();
  if (fly) return `https://${fly}.fly.dev`;
  return "http://localhost:5173";
}

const CLIENT_ORIGIN = resolveClientOrigin();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, "../../client/dist");
if (process.env.SERVE_CLIENT === "1") {
  app.use(express.static(clientDist));
  app.get(/^\/(?!socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
});

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(
    `BuzzBowl listening on port ${PORT} (CORS / Socket.io origin: ${CLIENT_ORIGIN})`,
  );
});
