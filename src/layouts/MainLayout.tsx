import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import ChatWidget from "../components/ChatWidget";
import { useAuth } from "../auth/AuthContext ";

const MainLayout: React.FC = () => {
   const { user } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isPage = location.pathname;
  return (
    <>
    <Header isHome={isHome} isPage = {isPage} />
      <main>
        <Outlet />
      </main>
      {user && <ChatWidget />}
      <Footer />
    </>
  );
};

export default MainLayout;
