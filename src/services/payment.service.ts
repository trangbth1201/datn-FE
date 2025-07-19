import axiosInstance from "../utils/axiosInstance";

const createVnpayPaymentUrl = async (orderId: string) => {
  const response = await axiosInstance.post("/payment/vnpay/create", {
    orderId,
  });
  console.log("VNPAY Payment URL:", response.data);

  return response.data;
};

export const paymentService = {
  createVnpayPaymentUrl,
};
