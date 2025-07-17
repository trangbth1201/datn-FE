import axios from "axios";
import socket from "./socket"; 

interface Message {
  senderId: string;
  content: string;
  createdAt?: string;
}

interface ConversationResponse {
  _id: string;
  messages: Message[];
  createdBy: string;
}

export const getConversation = async (token: string): Promise<ConversationResponse> => {
  try {
    const response = await axios.get<ConversationResponse>("/conversation/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// 👉 Đăng ký lắng nghe socket realtime
export const subscribeToMessages = (
  conversationId: string,
  onMessage: (msg: Message) => void
) => {
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("join-room", conversationId);

  const handler = (msg: Message) => {
    onMessage(msg);
  };

  socket.on("receive-message", handler);

  return () => {
    socket.off("receive-message", handler);
  };
};
