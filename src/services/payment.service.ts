import axios from "axios"; 

const apiClient = axios.create({
  baseURL: "http://localhost:8080/api", 
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});


interface VnpayResponse {
    paymentUrl: string;
}

const createVnpayPaymentUrl = async (orderId: string) => {
  const response = await apiClient.post<VnpayResponse>(
    "/payment/vnpay/create",
    { orderId }
  );
  console.log("VNPAY Payment URL:", response.data);
  
  return response.data;
};

export const paymentService = {
    createVnpayPaymentUrl,
};
