import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const voucherService = {
  getAllVouchers: async () => {
    try {
      const response = await axios.get(`${API_URL}/voucher`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tải voucher:', error);
      throw error;
    }
  },

};
