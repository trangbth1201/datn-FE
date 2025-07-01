import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:8080", {
  autoConnect: true,
  withCredentials: true,
  transports: ["websocket"],
});

export default socket;
