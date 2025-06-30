import React, { useState, ChangeEvent } from "react";
import Message from "./Message";
import EmojiPicker from "emoji-picker-react";
import { motion } from "framer-motion";
import { MessageType } from "../utils/function";

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const handleSend = () => {
    if (!input.trim() && !image) return;
    const newMsg: MessageType = {
      id: Date.now(),
      text: input,
    //   image,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setImage(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#fff]">
      {/* Header */}
      <div className="h-[60px] bg-white border-b flex items-center gap-3 px-4">
        <img src="https://i.pravatar.cc/150?img=11" className="w-10 h-10 rounded-full" />
        <div>
          <h3 className="font-semibold">Ngọc Trinh</h3>
          <p className="text-xs text-green-500 m-0">Đang hoạt động</p>
        </div>
      </div>

      {/* Nội dung tin nhắn */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Message msg={msg} />
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEmoji(!showEmoji)}>😄</button>
          <input
            type="text"
            className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-4 py-2 rounded-full"
          >
            Gửi
          </button>
        </div>
        {showEmoji && (
          <div className="mt-2">
            <EmojiPicker onEmojiClick={(e) => setInput((prev) => prev + e.emoji)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
