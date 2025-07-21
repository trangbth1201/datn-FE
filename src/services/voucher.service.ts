import axiosInstance from '../utils/axiosInstance';

const API_URL = 'http://localhost:8080/api';

export const voucherService = {
  // Lấy tất cả voucher
  getAllVouchers: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/vouchers`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tải voucher:', error);
      throw error;
    }
  },

  // Xác minh voucher
  verifyVoucher: async (voucherId: string, orderTotal: number) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/vouchers/verify/${voucherId}`, { orderTotal }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi xác minh voucher:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Voucher verification failed');
    }
  },
};