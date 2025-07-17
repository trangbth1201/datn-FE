import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import { sendMess } from "../services/ChatBox";
import { getConversation, subscribeToMessages } from "../services/ChatClient";
import socket from "../services/socket";

type Sender = "user" | "admin";
type Message = { sender: Sender; text: string };

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);
  const userId = localStorage.getItem("userId") ?? "";
  const token = localStorage.getItem("token") ?? "";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket connection
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getConversation(token);
        const converted: Message[] = data.messages.map((msg: any) => ({
          sender: msg.senderId === userId ? "user" : "admin",
          text: msg.content,
        }));
        setMessages(converted);
        setConversationId(data._id);
        socket.emit("join-conversation", data._id); 
        isLoaded.current = true;
      } catch (err) {
        console.error("Không thể tải tin nhắn:", err);
      }
    };

    if (isOpen && !isLoaded.current) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      if (msg.senderId !== userId) {
        setMessages((prev) => [
          ...prev,
          { sender: "admin", text: msg.content },
        ]);
      }
    });

    return unsubscribe;
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    const content = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: content }]);
    setInput("");

    try {
      await sendMess(content, token);
    } catch (error) {
      console.error("Gửi tin nhắn thất bại:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    isLoaded.current = false; 
    setMessages([]); 
    setConversationId(null);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white shadow-xl rounded-lg flex flex-col border border-gray-300">
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <span>Hỗ trợ trực tuyến</span>
            <button onClick={handleClose}>
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`w-fit max-w-[80%] p-2 rounded-lg text-sm break-words whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-blue-100 self-end ml-auto"
                    : "bg-gray-200"
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t flex items-center gap-2">
            <input
              type="text"
              className="flex-1 border rounded-lg px-2 py-1 text-sm"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} className="text-blue-600">
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg"
        >
          Chat với chúng tôi
        </button>
      )}
    </div>
  );
}
