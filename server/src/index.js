const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const { setupWSConnection } = require('y-websocket/bin/utils')

const app = express()
const server = http.createServer(app)

// ── Allowed origins ───────────────────────────────────────────────────────────
// List every frontend origin that's allowed to open a WebSocket connection.
// CORS doesn't apply to WS, but we validate Origin manually to prevent
// random scripts from connecting to our relay server.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

function isAllowedOrigin(origin) {
  // In development there's no restriction
  if (process.env.NODE_ENV !== 'production') return true
  if (!origin) return false
  return ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.endsWith(allowed))
}

// ── Health-check endpoint ─────────────────────────────────────────────────────
// Render/Railway ping GET / to check liveness.
app.get('/', (_req, res) => {
  res.json({ status: 'ok', clients: wss.clients.size })
})

// ── Yjs WebSocket ─────────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req)
})

// Intercept the HTTP upgrade and validate Origin before handing off to ws
server.on('upgrade', (req, socket, head) => {
  const origin = req.headers.origin
  if (!isAllowedOrigin(origin)) {
    console.warn(`[ws] rejected connection from origin: ${origin}`)
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
    socket.destroy()
    return
  }
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req)
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 1234

server.listen(PORT, () => {
  console.log(`[y-websocket] listening on :${PORT}`)
})
