const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const { setupWSConnection } = require('y-websocket/bin/utils')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// ── Health-check endpoint ─────────────────────────────────────────────────────
// Railway (and any load balancer) pings GET / to check liveness.
// We also expose connected-client count so you can see it from the browser.
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    clients: wss.clients.size,
  })
})

// ── Yjs WebSocket ─────────────────────────────────────────────────────────────
// setupWSConnection handles the entire y-websocket protocol:
//   • document awareness (who is in the room)
//   • incremental Yjs update relay between clients
//   • in-memory document persistence (survives reconnects within the same process)
wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req)
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 1234

server.listen(PORT, () => {
  console.log(`[y-websocket] listening on :${PORT}`)
})
