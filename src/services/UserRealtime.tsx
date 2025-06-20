// src/pages/UserRealtime.tsx
import { useEffect, useState } from "react";
import socket from "../services/socket";

interface UserRealtimeProps {
  userId: string;
}

interface User {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
}

const UserRealtime: React.FC<UserRealtimeProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Kết nối socket
    socket.connect();
    socket.emit("subscribeUser", userId);

    // Lắng nghe dữ liệu từ server
    socket.on("userUpdated", (userData: User) => {
      console.log("📡 Dữ liệu real-time nhận được:", userData);
      setUser(userData);
    });

    // Cleanup khi component unmount
    return () => {
      socket.off("userUpdated");
      socket.disconnect(); // Ngắt kết nối nếu cần
    };
  }, [userId]);

  if (!user) return <p>Đang tải dữ liệu người dùng...</p>;

  return (
    <div>
      <h2>Thông tin real-time:</h2>
      <p><strong>Họ tên:</strong> {user.fullName}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Phone:</strong> {user.phone}</p>
      <p><strong>Địa chỉ:</strong> {user.address}</p>
      <p><strong>Vai trò:</strong> {user.role}</p>
    </div>
  );
};

export default UserRealtime;
