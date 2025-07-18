import axiosInstance from "../utils/axiosInstance";
import { ICartItem, ICartResponse } from "../interface/cart.interface";

const API_URL = "http://localhost:8080/api/cart";

export const cartService = {
  getCart: async (): Promise<ICartResponse> => {
    try {
      const response = await axiosInstance.get(`${API_URL}`);
      console.log("API getCart trả về:", response.data);

      const cartItem = response.data?.cart;
      if (cartItem && cartItem.length > 0) {
        localStorage.setItem("cartitem", JSON.stringify(cartItem));
      }
      return response.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi tải giỏ hàng:",
        error.response?.data || error.message
      );
      throw error;
    }
  },


  addToCart: async (cartItem: ICartItem): Promise<ICartResponse> => {
    try {
      console.log("Sending cartItem to add:", cartItem);
      const response = await axiosInstance.post(`${API_URL}`, cartItem);
      console.log("Add to cart response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi thêm sản phẩm vào giỏ hàng:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  removeCart: async (
    cartItem: Pick<ICartItem, "productId" | "variantId">
  ): Promise<ICartResponse> => {
    try {
      const response = await axiosInstance.post(`${API_URL}/remove`, cartItem);
      console.log("Remove cart response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi xóa sản phẩm khỏi giỏ hàng:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  updateCartQuantity: async (cartItem: ICartItem): Promise<ICartResponse> => {
    try {
      const response = await axiosInstance.patch(`${API_URL}/update`, cartItem);
      console.log("Update cart quantity response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật số lượng sản phẩm trong giỏ hàng:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  syncCart: async (cartData: { userId: string; items: ICartItem[] }): Promise<ICartResponse> => {
    try {
      const response = await axiosInstance.post(`${API_URL}/sync`, cartData);
      console.log("Sync cart response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi đồng bộ giỏ hàng:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};
