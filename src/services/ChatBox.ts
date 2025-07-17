import axios from "axios";

axios.defaults.baseURL = "http://localhost:8080/api/";
axios.defaults.withCredentials = true;



export interface ChatMessage {
    _id?: string;
    senderId: string;
    senderRole: "user";
    content: string;
    readBy?: string[];
    createdAt?: string;
}

export const sendMess = async (content: string, token: string) => {
  try {
    const response = await axios.post(
      "/send-message", 
      {
        content,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Gửi tin nhắn thất bại:", error);
    throw error;
  }
};

export const getMessagesFromClient = async (token: string) => {
  try {
    const response = await axios.get("/conversation/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lấy tin nhắn thất bại:", error);
    throw error;
  }
};