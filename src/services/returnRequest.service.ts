import axiosInstance from "../utils/axiosInstance";

const API_URL = "http://localhost:8080/api";

export const returnRequestService = {
  // Lấy danh sách yêu cầu hoàn hàng
  getAllReturnRequests: async (params = {}) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/return-requests`, {
        params,
      });

      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải danh sách yêu cầu hoàn hàng:", error);
      throw error;
    }
  },

  // Lấy chi tiết yêu cầu hoàn hàng theo ID
  getReturnRequestById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/return-requests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi tải yêu cầu hoàn hàng ${id}:`, error);
      throw error;
    }
  },

  // Tạo yêu cầu hoàn hàng mới
  createReturnRequest: async (data: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.post(`${API_URL}/return-requests`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo yêu cầu hoàn hàng:", error);
      throw error;
    }
  },
};