import axiosInstance from "../utils/axiosInstance";
import { refreshToken } from "../services/authService";

const API_URL = "http://localhost:8080/api";

export const reviewService = {
  addReview: async (reviewData: any) => {
    try {
      console.log("Sending review data:", reviewData);
      const requestData = {
        orderId: reviewData.orderId,
        productId: reviewData.productId,
        content: reviewData.content || '',
        rating: reviewData.rating,
        images: reviewData.images || [],
      };

      let token = localStorage.getItem('accessToken');
      if (!token) {
        const refreshed = await refreshToken();
        if (!refreshed || !refreshed.accessToken) {
          throw new Error("No token found, please login.");
        }
        token = refreshed.accessToken;
      }


      const response = await axiosInstance.post(`${API_URL}/comments/add`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log("Add review response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi thêm đánh giá:",
        error.response?.data?.message || error.message,
        "Full error:", error
      );
      throw error;
    }
  },

  getReviewsForClient: async (productId: string) => {
    try {
      console.log("Fetching reviews for productId:", productId);
      let token = localStorage.getItem('accessToken');
      if (!token) {
        const refreshed = await refreshToken();
        if (!refreshed || !refreshed.accessToken) {
          throw new Error("No token found, please login.");
        }
        token = refreshed.accessToken;
      }


      const response = await axiosInstance.get(`${API_URL}/comments/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log("Get reviews response:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log("No reviews found for productId:", productId);
        return { comments: [], totalComments: 0, averageRating: 0, ratingCount: {} };
      }
      console.error(
        "Lỗi khi lấy danh sách đánh giá:",
        error.response?.data?.message || error.message,
        "Response:", error.response?.data
      );
      throw error;
    }
  },
};