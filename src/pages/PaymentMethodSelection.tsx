import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cartService } from "../services/cart.service";
import { useCart } from "../auth/CartContext";

// --- Định nghĩa các Interface cho TypeScript ---
interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  regularPrice: number;
  salePrice: number;
}

interface OrderSummary {
  items: OrderItem[];
  subtotal: number;
  totalSavings: number;
  shippingFee: number;
  finalTotal: number;
  itemCount: number;
}

interface ShippingInfo {
  fullName: string;
  phone: string;
  street: string;
  // Thêm các trường khác nếu cần
}

interface PaymentMethod {
  id: 'cod' | 'vnpay';
  name: string;
  description: string;
  icon: string;
}

// --- Component ---
const PaymentMethodPage = () => {
  const navigate = useNavigate();

  // --- Trạng thái (State) ---
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod['id']>("cod");
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Trạng thái cho thông báo lỗi
  const { cartCount, updateCartCount } = useCart();

  // --- Danh sách phương thức thanh toán ---
  const paymentMethods: PaymentMethod[] = [
    {
      id: "cod",
      name: "Thanh toán khi nhận hàng (COD)",
      description: "Thanh toán bằng tiền mặt khi nhận hàng.",
      icon: "💵",
    },
    {
      id: "vnpay",
      name: "Thanh toán qua VNPAY",
      description: "Thanh toán qua tài khoàng ngân hàng hoặc thẻ tín dụng.",
      icon: "💳",
    },
  ];


  // --- Load dữ liệu từ localStorage khi component được mount ---
  useEffect(() => {
    const savedOrderSummary = localStorage.getItem("selectedCartItems");
    const savedShippingInfo = localStorage.getItem("shippingInfo");
    const method = localStorage.getItem("paymentMethod");
    setSelectedMethod(method as PaymentMethod['id']);

    if (method === null) {
      setSelectedMethod(paymentMethods[0].id);
    }

    if (!savedOrderSummary) {
      console.log(0)

      navigate("/cart");
      return;
    }
    if (!savedShippingInfo) {
      navigate("/checkout");
      return;
    }

    try {
      const selectedItems: OrderItem[] = JSON.parse(savedOrderSummary);
      const subtotal = selectedItems.reduce(
        (total, item) => total + (item.salePrice > 0 ? item.salePrice : item.regularPrice) * item.quantity, 0
      );
      const totalSavings = selectedItems.reduce(
        (savings, item) => item.salePrice > 0 ? savings + (item.regularPrice - item.salePrice) * item.quantity : savings, 0
      );
      const shippingFee = 30000;
      const finalTotal = subtotal + shippingFee;

      setOrderSummary({
        items: selectedItems,
        subtotal,
        totalSavings,
        shippingFee,
        finalTotal,
        itemCount: selectedItems.length,
      });

      setShippingInfo(JSON.parse(savedShippingInfo));
    } catch (err) {
      console.error("Failed to parse data from localStorage", err);
      navigate("/cart");
    }
  }, [navigate]);

  // --- Hàm xử lý khi submit form ---
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedMethod) {
    setError("Vui lòng chọn phương thức thanh toán.");
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const completeOrderData = {
      ...orderSummary,
      shippingInfo,
      paymentMethod: selectedMethod,
      orderDate: new Date().toISOString(),
      orderStatus: "pending", // hoặc 0 nếu backend dùng enum số
    };

    localStorage.setItem("completeOrderData", JSON.stringify(completeOrderData));
    localStorage.setItem("paymentMethod", selectedMethod);

    setTimeout(() => {
      // ✅ Xóa giỏ hàng
      localStorage.removeItem("cart");
      document.cookie = "cart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // ✅ Cập nhật số lượng giỏ hàng
      updateCartCount({ cart: [], success: true });

      setIsLoading(false);
      navigate("/checkout/review");
    }, 500);
  } catch (err) {
    setError("Có lỗi xảy ra khi lưu thông tin đơn hàng. Vui lòng thử lại.");
    setIsLoading(false);
  }
};


  // --- UI hiển thị khi đang tải dữ liệu ---
  if (!orderSummary || !shippingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  // --- Text cho nút submit động ---
  const getSubmitButtonText = () => {
    if (isLoading) {
      return "Đang xử lý...";
    }
    // if (selectedMethod === 'vnpay') {
    //   return "Thanh toán với VNPAY";
    // }
    return "Hoàn tất đơn hàng";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* === CỘT TÓM TẮT ĐƠN HÀNG === */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tóm tắt đơn hàng ({orderSummary.itemCount} sản phẩm)
            </h3>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {orderSummary.items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex items-center space-x-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">Size: {item.size}| Màu: <span style={{ backgroundColor: item.color }} className="inline-block w-3 h-3 rounded border border-gray-300 align-middle"></span> | SL: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-sm">{((item.salePrice > 0 ? item.salePrice : item.regularPrice) * item.quantity).toLocaleString()}₫</span>
                    {item.salePrice > 0 && (
                      <p className="text-xs text-gray-500 line-through">{(item.regularPrice * item.quantity).toLocaleString()}₫</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chi tiết giá */}
            <div className="border-t pt-4 mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Tạm tính:</span><span>{orderSummary.subtotal.toLocaleString()}₫</span></div>
              {orderSummary.totalSavings > 0 && <div className="flex justify-between text-green-600"><span>Tiết kiệm:</span><span>-{orderSummary.totalSavings.toLocaleString()}₫</span></div>}
              <div className="flex justify-between"><span>Phí vận chuyển:</span><span>{orderSummary.shippingFee === 0 ? <span className="text-green-600 font-medium">Miễn phí</span> : `${orderSummary.shippingFee.toLocaleString()}₫`}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2"><span>Tổng cộng:</span><span className="text-blue-600">{orderSummary.finalTotal.toLocaleString()}₫</span></div>
            </div>

            {/* Thông tin giao hàng */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-900 mb-2">Giao đến:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>{shippingInfo.fullName}</strong> ({shippingInfo.phone})</p>
                <p>{shippingInfo.street}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* === CỘT CHỌN PHƯƠNG THỨC THANH TOÁN === */}
        <main className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Chọn phương thức thanh toán</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <label key={method.id} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedMethod === method.id ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 ml-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === method.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {selectedMethod === method.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </label>
                ))}
              </div>

              {/* Vùng hiển thị lỗi */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  <strong>Lỗi:</strong> {error}
                </div>
              )}

              {/* Các nút bấm */}
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-6">
                <button type="button" onClick={() => navigate("/checkout")} className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                  &lt; Quay lại
                </button>
                <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {getSubmitButtonText()}
                </button>
              </div>
            </form>
          </div>
        </main>

      </div>
    </div>
  );
};

export default PaymentMethodPage;
