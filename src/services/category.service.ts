import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const categoryService = {
  getAllCategories: async () => {
    const res = await axios.get(`${API_URL}/category?_page=1&_limit=100`);
    return res.data;
  },

  getAllSubCategory: async (parentId: string) => {
    const res = await axios.get(`${API_URL}/category/get-all-subcategory/${parentId}`);
    return res.data;
  },
};