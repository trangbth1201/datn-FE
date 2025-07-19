
import React, { createContext, useContext, useState } from "react";
import { ICartResponse } from "../interface/cart.interface";

interface CartContextType {
  cartCount: number;
  updateCartCount: (response: ICartResponse) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState<number>(0);

  const updateCartCount = (response: ICartResponse) => {
    if (response?.cart && Array.isArray(response.cart)) {
      const uniqueProducts = new Set(
        response.cart.map(item => `${item.productId}_${item.variantId || 'default'}`)
      );
      const uniqueCount = uniqueProducts.size;
      setCartCount(uniqueCount);
    } else {
      setCartCount(0);
    }
  };

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};