import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import Swal from "sweetalert2";
import { useAuth } from "../auth/AuthContext ";
import socket from "../services/socket";

export const useSocket = () => {
  const { user, logout } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = socket;

    console.log("[socket] Connecting to server...");

    socket.on("connect", () => {
      console.log("[socket] Connected to server", socket.id);
      socket.emit("check-account-status", user?._id);
      socket.emit("join-room", user?._id);
    });

    socket.connect();
    // check trạng thái tài khoản
    socket.off("account-status");
    socket.on("account-status", (data) => {
      console.log("[socket] Received account-status:", data);

      if (!data.isActive) {
        Swal.fire({
          icon: "error",
          title: "Rất tiếc...",
          text: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với quản trị viên để giải quyết.",
          confirmButtonText: "OK",
        }).then(() => {
          logout();
          window.location.href = "/login";
        });
      }
    });
    socket.on("disconnect", (reason) => {
      console.log("[socket] Disconnected from server:", reason);
    });

    socket.on("connect_error", (error) => {
      console.log("[socket] Error:", error.message);
    });

    socket.io.on("error", (err) => {
      console.log("❌ [socket] IO error:", err.message);
    });

    socket.io.on("reconnect_attempt", () => {
      console.log("🔁 [socket] Trying to reconnect...");
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, logout]);
};
