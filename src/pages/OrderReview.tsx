import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderServices';
import { voucherService } from '../services/voucher.service';
import { paymentService } from '../services/payment.service';
import { cartService } from '../services/cart.service';
import { OrderItem, OrderPayload, OrderSummary, ShippingInfo, Voucher } from '../interface/order.interfcace';

// Voucher interface matching the backend model
interface Voucher {
  _id: string;
  code: string;
  voucherType: 'shipping' | 'product';
  discountType: 'fixed' | 'percent';
  discountValue: number;
  minOrderValues: number;
  maxDiscount?: number;
  quantity: number;
  used: number;
  voucherStatus: 'active' | 'inactive' | 'expired';
  startDate: string;
  endDate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  link?: string;
}

const OrderReview = () => {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(true);

  // --- DATA FETCHING & INITIALIZATION EFFECT ---
  useEffect(() => {
    // 1. Fetch available vouchers from API
    const fetchVouchers = async () => {
      setLoadingVouchers(true);
      try {
        const response = await voucherService.getAllVouchers();
        setAvailableVouchers(response?.docs || []);
      } catch (err) {
        console.error('Lỗi khi tải voucher:', err);
        setError('Không thể tải danh sách voucher.');
      } finally {
        setLoadingVouchers(false);
      }
    };

    fetchVouchers();

    // 2. Load order data from localStorage
    try {
      const savedOrderSummary = localStorage.getItem('selectedCartItems');
      const savedShippingInfo = localStorage.getItem('shippingInfo');
      const savedPaymentMethod = localStorage.getItem('paymentMethod');
      const savedVoucher = JSON.parse(localStorage.getItem('appliedVoucher') || 'null');

      if (!savedOrderSummary || !savedShippingInfo || !savedPaymentMethod) {
        console.warn("Thiếu thông tin checkout, điều hướng về giỏ hàng.");
        navigate('/cart');
        return;
      }

      // Process order summary
      const selectedItems: OrderItem[] = JSON.parse(savedOrderSummary);
      const subtotal = selectedItems.reduce((total, item) => total + (item.salePrice > 0 ? item.salePrice : item.regularPrice) * item.quantity, 0);
      const totalSavings = selectedItems.reduce((savings, item) => item.salePrice > 0 ? savings + (item.regularPrice - item.salePrice) * item.quantity : savings, 0);
      const shippingFee = 30000;

      setOrderSummary({ items: selectedItems, subtotal, totalSavings, shippingFee, itemCount: selectedItems.length });
      setShippingInfo(JSON.parse(savedShippingInfo));
      setPaymentMethod(savedPaymentMethod);
      if (savedVoucher) {
        setAppliedVoucher(savedVoucher);
        setVoucherCode(savedVoucher.code);
      }

    } catch (err) {
      console.error("Lỗi khi xử lý dữ liệu checkout:", err);
      localStorage.removeItem('selectedCartItems');
      localStorage.removeItem('shippingInfo');
      localStorage.removeItem('paymentMethod');
      localStorage.removeItem('appliedVoucher');
      navigate('/cart');
    }
  }, [navigate]);

  // --- VOUCHER LOGIC ---
  const isVoucherValid = (voucher: Voucher) => {
    const now = new Date();
    return (
      voucher.voucherStatus === 'active' &&
      !voucher.isDeleted &&
      now >= new Date(voucher.startDate) &&
      now <= new Date(voucher.endDate) &&
      voucher.used < voucher.quantity
    );
  };

  const validVouchers = useMemo(() => {
    return availableVouchers.filter(isVoucherValid);
  }, [availableVouchers]);

  const applyVoucher = async (codeToApply: string) => {
    const code = codeToApply.toUpperCase();
    const voucher = availableVouchers.find(v => v.code === code);

    if (!voucher) {
      setVoucherError('Mã voucher không tồn tại.');
      return;
    }
    if (!isVoucherValid(voucher)) {
      setVoucherError('Voucher đã hết hạn, hết lượt sử dụng, bị xóa hoặc không hoạt động.');
      return;
    }
    if (orderSummary && orderSummary.subtotal < voucher.minOrderValues) {
      setVoucherError(`Voucher này yêu cầu đơn hàng tối thiểu ${voucher.minOrderValues.toLocaleString('vi-VN')}₫.`);
      return;
    }

    try {
      // Verify voucher with the server
      const response = await voucherService.verifyVoucher(voucher._id, orderSummary!.subtotal);
      if (!response.isValid) {
        setVoucherError(response.message || 'Voucher không hợp lệ.');
        return;
      }

      setAppliedVoucher(voucher);
      setVoucherCode(voucher.code);
      setVoucherError('');
      setShowVoucherModal(false);
      localStorage.setItem('appliedVoucher', JSON.stringify(voucher));
    } catch (err) {
      console.error('Lỗi khi xác minh voucher:', err);
      setVoucherError('Không thể áp dụng voucher. Vui lòng thử lại.');
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
    localStorage.removeItem('appliedVoucher');
  };

  // --- CALCULATION LOGIC ---
  const calculatedDiscount = useMemo(() => {
    if (!appliedVoucher || !orderSummary) return 0;

    const { discountType, discountValue, maxDiscount } = appliedVoucher;
    const targetAmount = orderSummary.subtotal; // Always apply discount to subtotal

    if (discountType === 'percent') {
      const discount = (targetAmount * discountValue) / 100;
      return maxDiscount ? Math.min(discount, maxDiscount) : discount;
    }
    if (discountType === 'fixed') {
      return Math.min(discountValue, targetAmount);
    }
    return 0;
  }, [appliedVoucher, orderSummary]);

  const finalTotal = useMemo(() => {
    if (!orderSummary) return 0;
    const total = orderSummary.subtotal + orderSummary.shippingFee - calculatedDiscount;
    return Math.max(0, total);
  }, [orderSummary, calculatedDiscount]);

  useEffect(() => {
    localStorage.setItem('totalAmount', finalTotal.toString());
  }, [finalTotal]);

  // --- DATA PREPARATION & SUBMISSION ---
  const mapPaymentMethodForAPI = (method: string): OrderPayload['paymentMethod'] => {
    const methodMap: { [key: string]: OrderPayload['paymentMethod'] } = {
      'cod': 'COD',
      'vnpay': 'VNPAY',
    };
    return methodMap[method] || 'COD';
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const prepareOrderData = (): OrderPayload | null => {
    if (!orderSummary || !shippingInfo || !paymentMethod) return null;

    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

    return {
      userId: user._id,
      recipientInfo: { name: shippingInfo.fullName, email: shippingInfo.email, phone: shippingInfo.phone },
      orderCode: "#ORDER_CODE",
      voucherId: appliedVoucher ? [appliedVoucher._id] : [],
      shippingAddress: shippingInfo.street,
      items: orderSummary.items.map(item => ({
        productId: item.productId,
        variationId: item.variantId,
        productName: item.name,
        image: item.image,
        slug: item.slug,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        priceAtOrder: item.salePrice > 0 ? item.salePrice : item.regularPrice,
        totalPrice: (item.salePrice > 0 ? item.salePrice : item.regularPrice) * item.quantity
      })),
      cartItemIds: orderSummary.items.map(item => item.cartItemId || item._id).filter(id => id),
      subtotal: orderSummary.subtotal,
      shippingFee: orderSummary.shippingFee,
      discountAmount: calculatedDiscount,
      totalAmount: finalTotal,
      paymentMethod: mapPaymentMethodForAPI(paymentMethod),
      expectedDeliveryDate: expectedDeliveryDate.toISOString(),
    };
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setError(null);
    const orderData = prepareOrderData();

    if (!orderData) {
      setError("Thiếu thông tin đơn hàng, không thể tiếp tục.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await orderService.createOrder(orderData);

      try {
        for (const item of orderSummary!.items) {
          await cartService.removeCart({ productId: item.productId, variantId: item.variantId });
        }
      } catch (err) {
        console.warn('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', err);
      }

      if (orderData.paymentMethod === 'VNPAY') {
        const paymentResult: any = await paymentService.createVnpayPaymentUrl(result.order._id);
        if (paymentResult && paymentResult.data.paymentUrl) {
          ['selectedCartItems', 'shippingInfo', 'paymentMethod', 'appliedVoucher', 'totalAmount'].forEach(key => localStorage.removeItem(key));
          localStorage.setItem("totalAmount", finalTotal.toString());
          window.location.href = paymentResult.data.paymentUrl;
          return;
        } else {
          throw new Error('Không nhận được URL thanh toán từ máy chủ.');
        }
      }

      ['selectedCartItems', 'shippingInfo', 'paymentMethod', 'appliedVoucher', 'totalAmount'].forEach(key => localStorage.removeItem(key));
      localStorage.setItem("totalAmount", finalTotal.toString());
      navigate(`/order/confirmation/${result?.order?.orderCode}`);
    } catch (err: any) {
      console.error('Lỗi khi xử lý đơn hàng:', err);
      const errorMessage = err.response?.data?.error || err.message || "Có lỗi không mong muốn xảy ra.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // --- HELPER & RENDER FUNCTIONS ---
  const getPaymentMethodName = (method: string) => ({
    'cod': '💵 Thanh toán khi nhận hàng (COD)',
    'vnpay': '💳 Thanh toán qua VNPAY'
  }[method] || 'Không xác định');

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Xem lại & Đặt hàng</h1>
          <p className="text-gray-600 mt-2">Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Column */}
          <main className="lg:col-span-2 space-y-6">
            {/* Shipping Info */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Thông tin giao hàng</h2>
                <button onClick={() => navigate('/checkout')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Chỉnh sửa</button>
              </div>
              <div className="text-sm space-y-2">
                <p><strong>Người nhận:</strong> {shippingInfo.fullName}</p>
                <p><strong>Điện thoại:</strong> {shippingInfo.phone}</p>
                <p><strong>Email:</strong> {shippingInfo.email}</p>
                <p><strong>Địa chỉ:</strong> {shippingInfo.street}</p>
                {shippingInfo.note && <p><strong>Ghi chú:</strong> {shippingInfo.note}</p>}
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Phương thức thanh toán</h2>
                <button onClick={() => navigate('/checkout/payment')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Thay đổi</button>
              </div>
              <div className="font-medium">{getPaymentMethodName(paymentMethod)}</div>
            </section>

            {/* Order Items */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sản phẩm ({orderSummary.itemCount})</h2>
              <div className="space-y-4">
                {orderSummary.items.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-start space-x-4 border-b pb-4 last:border-b-0 last:pb-0">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Size: {item.size} | Màu: <span style={{ backgroundColor: item.color }} className="inline-block w-3 h-3 rounded-full border border-gray-300 align-middle"></span> | SL: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{((item.salePrice > 0 ? item.salePrice : item.regularPrice) * item.quantity).toLocaleString('vi-VN')}₫</p>
                      {item.salePrice > 0 && <p className="text-sm text-gray-500 line-through">{(item.regularPrice * item.quantity).toLocaleString('vi-VN')}₫</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Sidebar Column */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt chi phí</h3>

              {/* Voucher Section */}
              <div className="border-b pb-4 mb-4">
                {!appliedVoucher ? (
                  <>
                    <div className="flex space-x-2">
                      <input type="text" value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); }} placeholder="Nhập mã giảm giá" className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button onClick={() => applyVoucher(voucherCode)} className="px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900">Áp dụng</button>
                    </div>
                    {voucherError && <p className="text-red-600 text-xs mt-2">{voucherError}</p>}
                    <button onClick={() => setShowVoucherModal(true)} className="text-sm text-blue-600 hover:text-blue-700 mt-2 w-full text-left" disabled={loadingVouchers}>{loadingVouchers ? 'Đang tải...' : 'Chọn hoặc nhập mã khuyến mãi'}</button>
                  </>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 p-2 rounded-md">
                    <span className="text-sm text-green-700 font-medium">Đang áp dụng: {appliedVoucher.code}</span>
                    <button onClick={removeVoucher} className="text-red-600 hover:text-red-700 text-xl font-bold">×</button>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Tạm tính:</span><span>{orderSummary.subtotal.toLocaleString('vi-VN')}₫</span></div>
                <div className="flex justify-between"><span>Phí vận chuyển:</span><span>{orderSummary.shippingFee.toLocaleString('vi-VN')}₫</span></div>
                {calculatedDiscount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá voucher:</span><span>-{calculatedDiscount.toLocaleString('vi-VN')}₫</span></div>}
                <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2"><span>Tổng cộng:</span><span className="text-blue-600">{finalTotal.toLocaleString('vi-VN')}₫</span></div>
              </div>

              {/* Error Display */}
              {error && <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm">{error}</div>}

              {/* Action Button */}
              <div className="mt-6">
                <button onClick={handlePlaceOrder} disabled={isLoading} className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                  {isLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Đang xử lý...</>) : (paymentMethod === 'vnpay' ? 'Thanh toán với VNPAY' : 'Hoàn tất đặt hàng')}
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500 text-center">Bằng việc đặt hàng, bạn đã đồng ý với <a href="/terms-of-service" className="text-blue-600">Điều khoản sử dụng</a> của chúng tôi.</p>
            </div>
          </aside>
        </div>
      </div>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold">Voucher khả dụng</h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            {loadingVouchers ? (<p>Đang tải voucher...</p>) : (
              <div className="space-y-3 overflow-y-auto">
                {validVouchers.length > 0 ? validVouchers.map(voucher => {
                  const canUse = orderSummary.subtotal >= voucher.minOrderValues;
                  return (
                    <div key={voucher._id} className={`border rounded-lg p-3 flex items-center justify-between gap-2 ${!canUse && 'opacity-50 bg-gray-50'}`}>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-600">{voucher.code}</h4>
                        <p className="text-sm text-gray-600">{voucher.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Đơn tối thiểu: {voucher.minOrderValues.toLocaleString('vi-VN')}₫ | HSD: {formatDate(voucher.endDate)}</p>
                        <p className="text-xs text-gray-500">Còn lại: {voucher.quantity - voucher.used} / {voucher.quantity} lượt</p>
                      </div>
                      <button onClick={() => applyVoucher(voucher.code)} disabled={!canUse} className={`px-3 py-1 text-sm rounded whitespace-nowrap ${canUse ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                        {canUse ? 'Dùng' : 'Không đủ ĐK'}
                      </button>
                    </div>
                  );
                }) : <p className="text-gray-500 text-center py-4">Không có voucher nào khả dụng.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderReview;