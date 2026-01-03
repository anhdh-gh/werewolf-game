import { io } from "socket.io-client";
import { KEYS } from "@/constants/keys";

let socket = null;

export function connectGameSocket() {
  if (socket) return socket;

  const serverRaw = localStorage.getItem(KEYS.SERVER_SELECTED);
  if (!serverRaw) return null;

  const accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);
  if (!accessToken) return null;

  const server = JSON.parse(serverRaw);

  socket = io(server.ws, {
    transports: ["websocket"],
    autoConnect: true,
    auth: {
      token: accessToken,
    },
  });

  return socket;
}

export function getGameSocket() {
  return socket;
}

export function disconnectGameSocket() {
  if (socket) {
    clearGameSocket()
    socket = null;
  }
}

export function clearGameSocket() {
  if (socket) {
    socket.off();
    socket.disconnect(true);
  }
}