import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { refreshToken } from "../services/authService";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (accessToken: string, user: User) => Promise<void>;
  logout: () => void;
  updateUser: (newData: Partial<User>) => void;
  isAuthenticated: boolean;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && !user.isActive) {
      logout();
      navigate("/login");
    }
  }, [user, navigate]);

  const login = async (accessToken: string, userData: User) => {
    try {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.removeItem("accessToken");
      setUser(userData);

      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("cartitem");
    document.cookie = "cart=; max-age=0; path=/";
    setUser(null);
    queryClient.setQueryData(["cart"], { cart: [], success: true });
    navigate("/login");
  };

  const updateUser = (newData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const response = await refreshToken();
      localStorage.setItem("accessToken", response.accessToken);
      return response.accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout();
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};