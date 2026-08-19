import { io } from 'socket.io-client'

// Singleton socket. Connects lazily so it's only ever opened once per tab.
// In dev, requests to /socket.io are proxied to the backend (see vite.config.mjs),
// so no host needs to be hardcoded. In prod, set VITE_SOCKET_URL if the API
// is served from a different origin than the frontend.
let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

// Connects (if needed) and joins the role/user room the backend uses to
// target shipment/order/stock-alert events (see server.js "join" handler).
export function connectSocket(user) {
  if (!user) return null
  const s = getSocket()
  if (!s.connected) s.connect()
  s.emit('join', { role: user.role, userId: user._id || user.id })
  return s
}
