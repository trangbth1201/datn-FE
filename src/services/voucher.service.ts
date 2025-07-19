import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const voucherService = {
  getAllVouchers: async () => {
    try {
      const response = await axios.get(`${API_URL}/vouchers`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tải voucher:', error);
      throw error;
    }
  },
  // voucher.service.ts
 verifyVoucher: async (voucherId: string, orderTotal: number) => {
  const response = await fetch(`http://localhost:8080/api/vouchers/verify/${voucherId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ orderTotal }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Voucher verification failed');
  }
  return data;
}

};
