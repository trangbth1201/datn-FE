import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const cartService = {
  getCart: async () => {
    try {
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Cart API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi tải giỏ hàng:', error.response?.data || error.message);
      throw error;
    }
  },

  addToCart: async (cartItem: { productId: string; variantId: string; quantity: number }) => {
    try {
      console.log('Sending cartItem to add:', cartItem);
      const response = await axios.post(`${API_URL}/cart`, cartItem, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Add to cart response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error.response?.data || error.message);
      throw error;
    }
  },

  removeCart: async (cartItem: { productId: string; variantId: string }) => {
    try {
      const response = await axios.post(`${API_URL}/cart/remove`, cartItem, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Remove cart response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error.response?.data || error.message);
      throw error;
    }
  },

  updateCartQuantity: async (cartItem: { productId: string; variantId: string; quantity: number }) => {
    try {
      const response = await axios.patch(`${API_URL}/cart/update`, cartItem, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Update cart quantity response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi cập nhật số lượng sản phẩm trong giỏ hàng:', error.response?.data || error.message);
      throw error;
    }
  },

  syncCart: async (cartData: { userId: string; items: { productId: string; variantId: string; quantity: number }[] }) => {
    try {
      const response = await axios.post(`${API_URL}/cart/sync`, cartData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Sync cart response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi đồng bộ giỏ hàng:', error.response?.data || error.message);
      throw error;
    }
  },
};