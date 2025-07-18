import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const brandService = {
  getAllBrands: async () => {
    const res = await axios.get(`${API_URL}/brand?_page=1&_limit=100`);
    return res.data;
  },
};