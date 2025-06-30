import React from "react";
import { MessageType } from "../utils/function";

interface Props {
  msg: MessageType;
  showAvatar?: boolean;
}

const Message: React.FC<Props> = ({ msg, showAvatar = true }) => {
  const isUser = msg.sender === "user";

  return (
    <div className={`flex items-end ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && showAvatar && (
        <img
          src="https://i.pravatar.cc/40"
          className="w-8 h-8 rounded-full self-end"
          alt="avatar"
        />
      )}

      <div
        className={`relative max-w-[70%] px-4 py-2 text-sm rounded-2xl shadow ${
          isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-100 text-gray-900 rounded-bl-none"
        }`}
      >
        {msg.image && (
          <img src={msg.image} alt="sent" className="rounded-lg mb-1 max-w-full" />
        )}
        {msg.text && <p className="m-0 text-white text-sm">{msg.text}</p>}
        <span className="absolute -bottom-4 right-2 text-[10px] text-gray-400">{msg.time}</span>
      </div>
    </div>
  );
};

export default Message;
