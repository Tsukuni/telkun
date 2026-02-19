/**
 * カスタムサーバー
 * Next.js + Express + WebSocket (Twilio Media Streams)
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { handleMediaStream } from "./lib/media-streams/handler";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3005", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const expressApp = express();
  const server = createServer(expressApp);

  // WebSocketサーバー設定
  const wss = new WebSocketServer({
    noServer: true,
    path: "/api/media-stream",
  });

  // WebSocket接続ハンドリング
  wss.on("connection", (ws: WebSocket) => {
    console.log("[Server] New WebSocket connection");
    handleMediaStream(ws);
  });

  // HTTPアップグレード処理
  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url || "", true);

    if (pathname === "/api/media-stream") {
      console.log("[Server] WebSocket upgrade request");

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      // Next.jsのWebSocketリクエストは通す（HMRなど）
      if (pathname?.startsWith("/_next/webpack-hmr")) {
        // Hot Module Replacementは通常のNext.js処理に任せる
        return;
      }
      socket.destroy();
    }
  });

  // Next.jsリクエストハンドリング
  expressApp.all("/{*path}", (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, () => {
    console.log(`[Server] Ready on http://${hostname}:${port}`);
    console.log(`[Server] WebSocket endpoint: ws://${hostname}:${port}/api/media-stream`);
    console.log(`[Server] Environment: ${dev ? "development" : "production"}`);
  });

  // グレースフルシャットダウン
  const shutdown = () => {
    console.log("[Server] Shutting down...");
    wss.clients.forEach((client) => {
      client.close();
    });
    server.close(() => {
      console.log("[Server] Closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[Server] Error starting server:", err);
  process.exit(1);
});
