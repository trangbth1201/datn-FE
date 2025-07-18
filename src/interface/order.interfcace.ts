export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  note?: string;
  street: string;
}

export interface Voucher {
  _id: string;
  code: string;
  description: string;
  voucherType: "product" | "shipping";
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscount: number;
  minOrderValues: number;
  startDate: string;
  endDate: string;
  quantity: number;
  used: number;
  voucherStatus: "active" | "inactive";
}

export interface OrderSummary {
  items: OrderItem[];
  subtotal: number;
  totalSavings: number;
  shippingFee: number;
  itemCount: number;
}

export interface OrderPayload {
  userId: string | null;
  recipientInfo: { name: string; email: string; phone: string };
  orderCode: string;
  voucherId: string[];
  shippingAddress: string;
  items: {
    productId: string;
    variationId: string;
    productName: string;
    quantity: number;
    priceAtOrder: number;
    totalPrice: number;
  }[];
  cartItemIds: string[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: "COD" | "VNPAY" | "MOMO";
  expectedDeliveryDate: string;
}

export interface IOrder {
  _id: string;
  completedBy: string | null;
  createdAt: string;
  deliveryDate: string | null;
  discountAmount: number;
  expectedDeliveryDate: string;
  items: OrderItem[];
  note: string | null;
  orderCode: string;
  paymentMethod: string;
  paymentStatus: number;
  recipientInfo: RecipientInfo;
  returnRequest: ReturnRequest;
  shippingAddress: string;
  shippingFee: number;
  status: number;
  subtotal: number;
  totalAmount: number;
  updatedAt: string;
  userId: string;
  voucherId: string[];
  price: number
}

export interface OrderItem {
  _id: string;
  priceAtOrder: number;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  variationId: string;
  variantId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  regularPrice: number;
  salePrice: number;
  cartItemId?: string;
  slug?: string;
}

interface RecipientInfo {
  email: string;
  name: string;
  phone: string;
}

interface ReturnRequest {
  adminNote: string | null;
  clientReason: string | null;
  refundMethod: string | null;
  returnStatus: string;
}

export interface StatusLabels {
  [key: number]: string;
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
}
export interface PaymentStatusLabels {
  [key: number]: string;
  0: string;
  1: string;
  2: string;
}
