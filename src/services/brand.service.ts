import axiosInstance from '../utils/axiosInstance';

const API_URL = 'http://localhost:8080/api';

export const brandService = {
  getAllBrands: async () => {
    try {
      const res = await axiosInstance.get(`${API_URL}/brand?_page=1&_limit=100`);
      return res.data;
    } catch (error) {
      console.error('Lỗi khi tải danh sách thương hiệu:', error);
      throw error;
    }
  },
};