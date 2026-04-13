import cors from "cors";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket.js";

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

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
  console.log(`BuzzIn server http://localhost:${PORT} (CORS ${CLIENT_ORIGIN})`);
});
