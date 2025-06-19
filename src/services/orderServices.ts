// services/order.service.js
import axios from "axios";

const API_URL = "http://localhost:8080/api";

export const orderService = {
  // Tạo đơn hàng mới
  createOrder: async (orderData: any) => {
    try {
      const response = await axios.post(`${API_URL}/order`, orderData, {
        headers: {
          "Content-Type": "application/json",
          // Thêm Authorization header nếu có authentication
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      throw error;
    }
  },

  // Lấy thông tin đơn hàng theo ID
  getOrderById: async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      throw error;
    }
  },

  // Lấy đơn hàng theo orderCode
  getOrderByCode: async (orderCode) => {
    try {
      const response = await axios.get(`${API_URL}/order/code/${orderCode}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      throw error;
    }
  },

  // Lấy danh sách đơn hàng của user
  getUserOrders: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/order/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await axios.patch(`${API_URL}/order/${orderId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (orderId, paymentStatus) => {
    try {
      const response = await axios.patch(
        `${API_URL}/order/${orderId}/payment-status`,
        {
          paymentStatus,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
      throw error;
    }
  },

  // Hủy đơn hàng
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await axios.patch(`${API_URL}/order/${orderId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      throw error;
    }
  },
};
