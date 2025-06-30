import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import ChatWindow from "../components/ChatWindow";

const MainLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isPage = location.pathname;

  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <Header isHome={isHome} isPage={isPage} />
      <main>
        <Outlet />
      </main>
      <Footer />
      <button
        onClick={() => setShowChat((prev) => !prev)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50"
      >
        💬 Chat
      </button>

      {showChat && (
        <div className="fixed bottom-20 right-4 w-[360px] h-[500px] bg-white rounded-xl shadow-lg z-50 overflow-hidden">
          <ChatWindow />
        </div>
      )}
    </>
  );
};

export default MainLayout;
