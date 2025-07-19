import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import { sendMess } from "../services/ChatBox";
import { getConversation, subscribeToMessages } from "../services/ChatClient";
import socket from "../services/socket";
import EmojiPicker from "emoji-picker-react";
import { FaImage } from "react-icons/fa";
import axios from "axios";

type Sender = "user" | "admin" | "system";
type Message = { sender: Sender; text: string };

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const userId = localStorage.getItem("userId") ?? "";
  const token = localStorage.getItem("token") ?? "";

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);

    try {
      const res = await axios.post("/chat/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages((prev) => [
        ...prev,
        { sender: "user", text: "[ảnh]", image: res.data.url },
      ]);
    } catch (error) {
      console.error("Upload ảnh thất bại:", error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          <div className="p-3 border-t flex items-center gap-2 relative">
            {/* Emoji Button */}
            <button
              onClick={() => setShowEmoji((prev) => !prev)}
              className="text-xl px-1"
              title="Chèn emoji"
            >
              😊
            </button>

            {/* Emoji Picker */}
            {showEmoji && (
              <div className="absolute bottom-14 left-0 z-50">
                <EmojiPicker
                  onEmojiClick={(emojiData) =>
                    setInput((prev) => prev + emojiData.emoji)
                  }
                  height={350}
                  width={280}
                />
              </div>
            )}

            {/* Hidden Image Input */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              ref={fileInputRef}
            />

            {/* Image Button */}
            <button
              onClick={() => {
                setShowEmoji(false);
                fileInputRef.current?.click();
              }}
              className="text-green-600"
              title="Gửi ảnh"
            >
              <FaImage className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              className="flex-1 border rounded-lg px-2 py-1 text-sm"
              placeholder="Nhập tin nhắn..."
              value={input}
              onClick={() => setShowEmoji(false)}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />

            {/* Send Button */}
            <button
              onClick={() => {
                setShowEmoji(false);
                handleSend();
              }}
              className="text-blue-600"
              title="Gửi"
            >
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
