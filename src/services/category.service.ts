import axiosInstance from '../utils/axiosInstance';

const API_URL = 'http://localhost:8080/api';

export const categoryService = {
  getAllCategories: async () => {
    try {
      const res = await axiosInstance.get(`${API_URL}/category?_page=1&_limit=100`);
      return res.data;
    } catch (error) {
      console.error('Lỗi khi tải danh sách danh mục:', error);
      throw error;
    }
  },

  getAllSubCategory: async (parentId: string) => {
    try {
      const res = await axiosInstance.get(`${API_URL}/category/get-all-subcategory/${parentId}`);
      return res.data;
    } catch (error) {
      console.error('Lỗi khi tải danh sách danh mục con:', error);
      throw error;
    }
  },
};