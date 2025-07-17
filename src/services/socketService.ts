import { useEffect } from "react";
import socket from "./socket";

export const useChatSocket = (
  conversationId: string,
  onNewMessage: (msg: any) => void
) => {
  useEffect(() => {
    if (!conversationId) return;
    socket.connect();
    socket.emit("join-conversation", conversationId);
    socket.on("new-message", onNewMessage);
    return () => {
      socket.off("new-message", onNewMessage);
    };
  }, [onNewMessage, conversationId]);
};
