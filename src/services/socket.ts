import { io } from "socket.io-client";

const token = localStorage.getItem("token");

const socket = io("http://localhost:8080", {
  autoConnect: false, 
  transports: ["websocket"],
  auth: {
    token, 
  },
});

export default socket;
