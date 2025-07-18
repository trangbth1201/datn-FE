import axios, { AxiosResponse } from "axios";
import { CancelRefundPayload, CreateWalletPayload, RefundPayload, RefundResponse, TransactionsResponse, WalletResponse } from "../interface/wallet.interface";
import axiosInstance from "../utils/axiosInstance";

// Base API URL (adjust as needed)
const API_URL = "http://localhost:8080/api";

// Axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Adjust based on your auth method
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Service to create a wallet
export const createWallet = async (
  payload: CreateWalletPayload
): Promise<WalletResponse> => {
  try {
    const response: AxiosResponse<WalletResponse> = await api.post(
      "/wallet",
      payload
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Tạo ví thất bại");
  }
};

// Service to get wallet information
export const getWalletInfo = async (): Promise<WalletResponse> => {
  try {
    const response: AxiosResponse<WalletResponse> = await axiosInstance.get("/wallet");
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lấy thông tin ví thất bại"
    );
  }
};

// Service to get wallet transactions
export const getWalletTransactions = async (
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  order: "asc" | "desc" = "desc",
  search: string = ""
): Promise<TransactionsResponse> => {
  try {
    const response: AxiosResponse<TransactionsResponse> = await api.get(
      "/wallet/transactions",
      {
        params: { page, limit, sortBy, order, search },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lấy lịch sử giao dịch thất bại"
    );
  }
};

// Service to refund an order
export const refundOrder = async (
  payload: RefundPayload
): Promise<RefundResponse> => {
  try {
    const response: AxiosResponse<RefundResponse> = await api.post(
      "/wallet/refund",
      payload
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Hoàn tiền đơn hàng thất bại"
    );
  }
};

// Service to refund a canceled order
export const cancelOrderRefund = async (
  payload: CancelRefundPayload
): Promise<RefundResponse> => {
  try {
    const response: AxiosResponse<RefundResponse> = await api.post(
      "/wallet/cancel-refund",
      payload
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Hoàn tiền hủy đơn hàng thất bại"
    );
  }
};
