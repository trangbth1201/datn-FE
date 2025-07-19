
export interface Wallet {
  _id: string;
  userId: { email: string; fullName: string };
  balance: number;
  status: number;
}

export interface Transaction {
  _id: string;
  walletId: string;
  orderId?: { orderCode: string; totalAmount: number };
  type: string;
  amount: number;
  status: number;
  description: string;
  createdAt: string;
}

export interface WalletResponse {
  message: string;
  data: {
    wallet: Wallet;
  };
}

export interface TransactionsResponse {
  message: string;
  data: {
    transactions: Transaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface RefundResponse {
  message: string;
  data: {
    transactionId: string;
    newBalance: number;
  };
}

export interface CreateWalletPayload {
  userId: string;
}

export interface RefundPayload {
  orderId: string;
  amount: number;
}

export interface CancelRefundPayload {
  orderId: string;
}

