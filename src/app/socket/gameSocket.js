import { io } from "socket.io-client";
import { KEYS } from "@/constants/keys";

let socket;

export function getGameSocket() {
  if (socket) return socket;

  const serverRaw = localStorage.getItem(KEYS.SERVER_SELECTED);
  if (!serverRaw) return null;

  const server = JSON.parse(serverRaw);

  socket = io(server.ws, {
    transports: ["websocket"],
    auth: {
      token: localStorage.getItem(KEYS.ACCESS_TOKEN),
    },
  });

  return socket;
}
