import React from "react";

const Sidebar: React.FC = () => {
  const users = ["Ngọc Trinh", "Anh Đức", "Trợ lý Zalo"];

  return (
    <div className="w-[300px] bg-white border-r p-4">
      <h2 className="text-xl font-bold mb-4">Tin nhắn</h2>
      <div className="space-y-3">
        {users.map((name, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <img src={`https://i.pravatar.cc/150?img=${idx + 10}`} className="w-10 h-10 rounded-full" />
            <div>
              <h4 className="font-medium">{name}</h4>
              <p className="text-sm text-gray-500">Tin nhắn gần đây...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
