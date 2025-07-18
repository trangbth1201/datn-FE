// services/order.service.js
import axios from "axios";
import axiosInstance from "../utils/axiosInstance";

const API_URL = "http://localhost:8080/api";

export const orderService = {
  // Tạo đơn hàng mới
  createOrder: async (orderData: any) => {
    try {
      const response = await axios.post(`${API_URL}/order`, orderData, {
        headers: {
          "Content-Type": "application/json",
          // Thêm Authorization header nếu có authentication
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      throw error;
    }
  },

  // Lấy thông tin đơn hàng theo ID
  getOrderById: async (orderId: string) => {
    try {
      const response = await axios.get(`${API_URL}/order/id/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      throw error;
    }
  },

  // Lấy đơn hàng theo orderCode
  getOrderByCode: async (orderCode: string) => {
    try {
      const response = await axios.get(`${API_URL}/order/code/${orderCode}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      throw error;
    }
  },

  // Lấy danh sách đơn hàng của user
  getUserOrders: async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/order/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId: string, status: number, userId: string) => {
    try {
      const response = await axios.patch(`${API_URL}/order/status/${orderId}`, {
        status,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái đánh giá
  updateReviewStatus: async (orderId: string, review: number) => {
    try {
      const response = await axios.patch(`${API_URL}/order/status/${orderId}`, {
        review,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đánh giá:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (orderId: string, paymentStatus: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/order/payment-status/${orderId}`,
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
  cancelOrder: async (orderId: string, reason: any) => {
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
  getPaymentStatus: async (orderId: string) => {
    try {
      const response = await axiosInstance.get(`/payment/status/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy trạng thái đơn hàng:", error);
      throw error;
    }
  },
};
