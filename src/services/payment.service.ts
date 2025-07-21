import axiosInstance from "../utils/axiosInstance";

const createVnpayPaymentUrl = async (orderId: string) => {
  try {
    const response = await axiosInstance.post("/payment/vnpay/create", {
      orderId,
    });
    console.log("VNPAY Payment URL:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Lỗi khi tạo URL thanh toán VNPAY:", error.response?.data?.message || error.message);
    throw error;
  }
};

export const paymentService = {
  createVnpayPaymentUrl,
};