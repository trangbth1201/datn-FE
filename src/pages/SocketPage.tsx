// import { useEffect, useState } from "react";
// import socket from "../services/socket";
// import { useAuth } from "../auth/AuthContext ";

// interface User {
//     fullName: string;
//     email: string;
//     phone: string;
//     address: string;
//     role: string;
//     isActive: boolean;
// }

// export const SocketPage = () => {
//     const [UserInfo, setUserInfo] = useState<User | null>(null);
//     const { user } = useAuth();
//     const userId = user?._id;

//     useEffect(() => {
//         socket.connect();
//         socket.emit("subscribeUser", userId);

//         socket.on("userUpdated", (userData: User) => {
//             console.log("📡 Nhận dữ liệu user:", userData);
//             setUserInfo(userData);
//         });

//         return () => {
//             socket.off("userUpdated");
//             socket.disconnect();
//         };
//     }, [userId]);

//     return (
//         <div style={{ padding: 20 }}>
//             <h2>Thông tin người dùng (real-time)</h2>
//             {UserInfo ? (
//                 <ul>
//                     <li><strong>Họ tên:</strong> {UserInfo.fullName}</li>
//                     <li><strong>Email:</strong> {UserInfo.email}</li>
//                     <li><strong>Phone:</strong> {UserInfo.phone}</li>
//                     <li><strong>Địa chỉ:</strong> {UserInfo.address}</li>
//                     <li><strong>Vai trò:</strong> {UserInfo.role}</li>
//                     <li><strong>Trạng thái:</strong> {UserInfo.isActive ? "Hoạt động" : "Đã khóa"}</li>

//                 </ul>
//             ) : (
//                 <p>Đang tải thông tin...</p>
//             )}
//         </div>
//     );
// };
