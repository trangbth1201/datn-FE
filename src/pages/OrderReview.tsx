import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderServices';
import { voucherService } from '../services/voucher.service';

const OrderReview = () => {
  const navigate = useNavigate();
  const [orderSummary, setOrderSummary] = useState(null);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Lấy dữ liệu từ localStorage khi component mount
  useEffect(() => {
    const savedOrderSummary = localStorage.getItem('selectedCartItems');
    const savedShippingInfo = localStorage.getItem('shippingInfo');
    const savedPaymentMethod = localStorage.getItem('paymentMethod');
    const savedVoucher = JSON.parse(localStorage.getItem('appliedVoucher') || 'null');
    
    // Fetch vouchers từ API
    const fetchVouchers = async () => {
      setLoadingVouchers(true);
      try {
        const response = await voucherService.getAllVouchers();
        // Lọc chỉ lấy voucher active và chưa hết hạn
        const activeVouchers = response.data.filter(voucher => {
          const now = new Date();
          const endDate = new Date(voucher.endDate);
          return voucher.voucherStatus === 'active' && endDate > now;
        });
        setAvailableVouchers(activeVouchers);
      } catch (error) {
        console.error('Lỗi khi tải voucher:', error);
      } finally {
        setLoadingVouchers(false);
      }
    };

    fetchVouchers();
    
    if (savedOrderSummary) {
      const selectedItems = JSON.parse(savedOrderSummary);
      
      // Tính toán lại các giá trị
      const subtotal = selectedItems.reduce((total, item) => {
        const price = item.salePrice > 0 ? item.salePrice : item.regularPrice;
        return total + (price * item.quantity);
      }, 0);
      
      const totalSavings = selectedItems.reduce((savings, item) => {
        if (item.salePrice > 0) {
          return savings + ((item.regularPrice - item.salePrice) * item.quantity);
        }
        return savings;
      }, 0);
      
      const shippingFee = 40000; // Cập nhật theo bản ghi mẫu
      const freeShippingThreshold = 500000;
      const finalShippingFee = subtotal >= freeShippingThreshold ? 0 : shippingFee;
      
      setOrderSummary({
        items: selectedItems,
        subtotal,
        totalSavings,
        shippingFee: finalShippingFee,
        itemCount: selectedItems.length,
        freeShippingThreshold
      });
    } else {
      navigate('/cart');
    }

    if (savedShippingInfo) {
      setShippingInfo(JSON.parse(savedShippingInfo));
    } else {
      navigate('/checkout');
    }

    if (savedPaymentMethod) {
      setPaymentMethod(savedPaymentMethod);
    } else {
      navigate('/checkout/payment');
    }

    if (savedVoucher) {
      setAppliedVoucher(savedVoucher);
    }
  }, [navigate]);

  // Kiểm tra voucher có hợp lệ không
  const isVoucherValid = (voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);
    
    return (
      voucher.voucherStatus === 'active' &&
      now >= startDate &&
      now <= endDate &&
      voucher.used < voucher.quantity
    );
  };

  // Áp dụng voucher
  const applyVoucher = (code = voucherCode) => {
    const voucher = availableVouchers.find(v => v.code === code.toUpperCase());
    
    if (!voucher) {
      setVoucherError('Mã voucher không hợp lệ');
      return;
    }

    if (!isVoucherValid(voucher)) {
      setVoucherError('Voucher đã hết hạn hoặc không khả dụng');
      return;
    }

    if (orderSummary.subtotal < voucher.minOrderValues) {
      setVoucherError(`Đơn hàng tối thiểu ${voucher.minOrderValues.toLocaleString()}₫`);
      return;
    }

    setAppliedVoucher(voucher);
    setVoucherCode(voucher.code);
    setVoucherError('');
    setShowVoucherModal(false);
    
    localStorage.setItem('appliedVoucher', JSON.stringify(voucher));
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
    localStorage.removeItem('appliedVoucher');
  };

  // Tính toán giảm giá dựa trên cấu trúc voucher mới
  const calculateDiscount = () => {
    if (!appliedVoucher || !orderSummary) return 0;
    
    if (appliedVoucher.voucherType === 'shipping') {
      // Voucher giảm phí ship
      if (appliedVoucher.discountType === 'percent') {
        const discount = (orderSummary.shippingFee * appliedVoucher.discountValue) / 100;
        return Math.min(discount, appliedVoucher.maxDiscount || discount);
      } else if (appliedVoucher.discountType === 'fixed') {
        return Math.min(appliedVoucher.discountValue, orderSummary.shippingFee);
      }
    } else {
      // Voucher giảm giá sản phẩm
      if (appliedVoucher.discountType === 'percent') {
        const discount = (orderSummary.subtotal * appliedVoucher.discountValue) / 100;
        return Math.min(discount, appliedVoucher.maxDiscount || discount);
      } else if (appliedVoucher.discountType === 'fixed') {
        return Math.min(appliedVoucher.discountValue, orderSummary.subtotal);
      }
    }
    
    return 0;
  };

  const calculateTotal = () => {
    if (!orderSummary) return 0;
    const discount = calculateDiscount();
    
    if (appliedVoucher?.voucherType === 'shipping') {
      // Giảm phí ship
      return orderSummary.subtotal + (orderSummary.shippingFee - discount);
    } else {
      // Giảm giá sản phẩm
      return orderSummary.subtotal + orderSummary.shippingFee - discount;
    }
  };

  const getItemPrice = (item) => {
    return item.salePrice > 0 ? item.salePrice : item.regularPrice;
  };

  // Tạo order code unique
  const generateOrderCode = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `DH${year}${month}${day}-${random}`;
  };

  // Map payment method từ frontend sang backend
  const mapPaymentMethod = (method) => {
    const methodMap = {
      'cod': 'COD',
      'bank_transfer': 'VNPAY',
      'momo': 'MOMO',
      'zalopay': 'VNPAY'
    };
    return methodMap[method] || 'COD';
  };

  // Chuẩn bị dữ liệu cho API theo đúng model schema mới
  const prepareOrderData = () => {
    const orderCode = generateOrderCode();
    const discount = calculateDiscount();
    const total = calculateTotal();
    localStorage.setItem("totalAmount", total);
    // Chuẩn bị items theo format mới
    const items = orderSummary.items.map(item => ({
      productId: item.productId,
      variationId: item.variantId,
      productName: item.name,
      quantity: item.quantity,
      priceAtOrder: getItemPrice(item),
      totalPrice: getItemPrice(item) * item.quantity
    }));

    // Chuẩn bị recipient info theo schema mới
    const recipientInfo = {
      name: shippingInfo.fullName,
      email: shippingInfo.email,
      phone: shippingInfo.phone
    };

    // Chuẩn bị shipping address theo đúng schema mới
    const shippingAddress = shippingInfo.address

    // Chuẩn bị voucherId array
    const voucherId = appliedVoucher ? [appliedVoucher._id] : [];
    
    // **THÊM CART ITEM IDS ĐỂ XÓA**
    const cartItemIds = orderSummary.items
      .map(item => item.cartItemId || item._id)
      .filter(id => id); // Lọc bỏ undefined/null

    const user = localStorage.getItem('userId');

    // Tính toán expected delivery date (7 ngày từ hiện tại)
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

    return {
      userId: user,
      recipientInfo,
      orderCode,
      voucherId,
      shippingAddress,
      items,
      cartItemIds, // **THÊM FIELD NÀY ĐỂ XÓA CART ITEMS**
      subtotal: orderSummary.subtotal,
      shippingFee: orderSummary.shippingFee,
      discountAmount: discount,
      totalAmount: total,
      paymentMethod: mapPaymentMethod(paymentMethod),
      expectedDeliveryDate: expectedDeliveryDate.toISOString()
    };
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    
    try {
      const orderData = prepareOrderData();
      
      // Gọi API tạo đơn hàng
      const result = await orderService.createOrder(orderData);
      console.log('Order data being sent:', orderData);

      // Clear checkout data from localStorage
      localStorage.removeItem('selectedCartItems');
      localStorage.removeItem('shippingInfo');
      localStorage.removeItem('paymentMethod');
      localStorage.removeItem('appliedVoucher');
      localStorage.removeItem('orderSummary');
      localStorage.removeItem('completeOrderData');
      
      // Save order data for confirmation page
      localStorage.setItem('completedOrder', JSON.stringify(result));
      
      // Hiển thị thông báo thành công
      if (result.cartItemsRemoved > 0) {
        console.log(`Đã xóa ${result.cartItemsRemoved} sản phẩm khỏi giỏ hàng`);
      }
      
      // Chuyển đến trang xác nhận với order code
      navigate(`/order/confirmation/${result.orderCode || orderData.orderCode}`);
      
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      alert(`Có lỗi xảy ra khi đặt hàng: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      'cod': 'Thanh toán khi nhận hàng (COD)',
      'bank_transfer': 'Chuyển khoản ngân hàng',
      'momo': 'Ví MoMo',
      'zalopay': 'ZaloPay'
    };
    return methods[method] || method;
  };

  // Format ngày tháng
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ color: '#8BC42D' }}>
            Xem lại đơn hàng
          </h1>
          <p className="text-gray-600 mt-2">
            Kiểm tra lại thông tin trước khi hoàn tất đơn hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Recipient Information - Cập nhật theo schema mới */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Thông tin người nhận</h2>
                <button
                  onClick={() => navigate('/checkout')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Người nhận:</p>
                  <p className="font-medium">{shippingInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Điện thoại:</p>
                  <p className="font-medium">{shippingInfo.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Email:</p>
                  <p className="font-medium">{shippingInfo.email}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 mb-1">Địa chỉ giao hàng:</p>
                  <p className="font-medium">
                    {shippingInfo.address}
                  </p>
                </div>
                {shippingInfo.note && (
                  <div className="md:col-span-2">
                    <p className="text-gray-500 mb-1">Ghi chú:</p>
                    <p className="font-medium">{shippingInfo.note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Phương thức thanh toán</h2>
                <button
                  onClick={() => navigate('/checkout/payment')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {paymentMethod === 'cod' && '💵'}
                  {paymentMethod === 'bank_transfer' && '🏦'}
                  {paymentMethod === 'momo' && '📱'}
                  {paymentMethod === 'zalopay' && '💳'}
                </div>
                <div>
                  <span className="font-medium">{getPaymentMethodName(paymentMethod)}</span>
                  <p className="text-sm text-gray-500">
                    Sẽ được xử lý qua: {mapPaymentMethod(paymentMethod)}
                  </p>
                </div>
              </div>

              {paymentMethod === 'bank_transfer' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> Bạn sẽ được chuyển hướng đến cổng thanh toán VNPAY để hoàn tất giao dịch.
                  </p>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng. 
                    Vui lòng chuẩn bị đủ số tiền: <strong>{calculateTotal().toLocaleString()}₫</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sản phẩm đặt mua ({orderSummary.itemCount} sản phẩm)
              </h2>
              
              <div className="space-y-4">
                {orderSummary.items.map((item, index) => (
                  <div key={`${item.productId}-${item.variantId}`} className={`flex items-center space-x-4 py-4 ${index !== orderSummary.items.length - 1 ? 'border-b' : ''}`}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <div className="text-sm text-gray-500 space-y-1 mt-1">
                        <p>Size: {item.size}</p>
                        <div className="flex items-center gap-1">
                          <span>Màu:</span>
                          <div 
                            className="w-3 h-3 rounded border border-gray-300"
                            style={{ backgroundColor: item.color }}
                          ></div>
                        </div>
                        <p>Số lượng: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-lg">
                        {(getItemPrice(item) * item.quantity).toLocaleString()}₫
                      </p>
                      {item.salePrice > 0 && (
                        <p className="text-sm text-gray-500 line-through">
                          {(item.regularPrice * item.quantity).toLocaleString()}₫
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {getItemPrice(item).toLocaleString()}₫ x {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary & Place Order */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
              
              {/* Voucher Section */}
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Mã giảm giá</span>
                  <button
                    onClick={() => setShowVoucherModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    disabled={loadingVouchers}
                  >
                    {loadingVouchers ? 'Đang tải...' : 'Xem voucher khả dụng'}
                  </button>
                </div>
                
                {!appliedVoucher ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => {
                          setVoucherCode(e.target.value.toUpperCase());
                          setVoucherError('');
                        }}
                        placeholder="Nhập mã giảm giá"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => applyVoucher()}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Áp dụng
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-red-500 text-xs">{voucherError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
                    <div>
                      <span className="text-sm text-green-700 font-medium">{appliedVoucher.code}</span>
                      <p className="text-xs text-green-600">{appliedVoucher.description}</p>
                      <p className="text-xs text-gray-500">
                        {appliedVoucher.voucherType === 'shipping' ? 'Giảm phí ship' : 'Giảm giá sản phẩm'}
                      </p>
                    </div>
                    <button 
                      onClick={removeVoucher}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính ({orderSummary.itemCount} sản phẩm):</span>
                  <span>{orderSummary.subtotal.toLocaleString()}₫</span>
                </div>
                
                {orderSummary.totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Tiết kiệm từ khuyến mãi:</span>
                    <span>-{orderSummary.totalSavings.toLocaleString()}₫</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {orderSummary.shippingFee === 0 ? (
                      <span className="text-green-600 font-medium">Miễn phí</span>
                    ) : (
                      `${orderSummary.shippingFee.toLocaleString()}₫`
                    )}
                  </span>
                </div>
                
                {appliedVoucher && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Giảm giá voucher ({appliedVoucher.code}) - {appliedVoucher.voucherType === 'shipping' ? 'Phí ship' : 'Sản phẩm'}:
                    </span>
                    <span>-{calculateDiscount().toLocaleString()}₫</span>
                  </div>
                )}
                
                <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{calculateTotal().toLocaleString()}₫</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tạo đơn hàng...
                    </div>
                  ) : (
                    <>
                      Đặt hàng
                      <svg className="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => navigate('/checkout/payment')}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại phương thức thanh toán
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                Bằng việc đặt hàng, bạn đồng ý với{' '}
                <a href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</a>
                {' '}và{' '}
                <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
              </div>

              {/* Security & Policies */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-center text-xs text-gray-500 mb-2">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Thanh toán an toàn & bảo mật
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Miễn phí đổi trả trong 30 ngày</p>
                  <p>• Bảo hành chính hãng</p>
                  <p>• Hỗ trợ 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Voucher khả dụng</h3>
              <button 
                onClick={() => setShowVoucherModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {loadingVouchers ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Đang tải voucher...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableVouchers.filter(voucher => isVoucherValid(voucher)).map((voucher) => {
                  const canUse = orderSummary.subtotal >= voucher.minOrderValues;
                  return (
                    <div 
                      key={voucher._id} 
                      className={`border rounded-lg p-3 ${canUse ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${canUse ? 'text-blue-600' : 'text-gray-400'}`}>
                              {voucher.code}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              voucher.voucherType === 'shipping' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {voucher.voucherType === 'shipping' ? 'Phí ship' : 'Sản phẩm'}
                            </span>
                          </div>
                          <p className={`text-sm ${canUse ? 'text-gray-600' : 'text-gray-400'}`}>
                            {voucher.description}
                          </p>
                          <div className="text-xs space-y-1 mt-2">
                            <p className={canUse ? 'text-gray-500' : 'text-gray-400'}>
                              Đơn tối thiểu: {voucher.minOrderValues.toLocaleString()}₫
                            </p>
                            <p className={canUse ? 'text-gray-500' : 'text-gray-400'}>
                              Giảm tối đa: {voucher.maxDiscount.toLocaleString()}₫
                            </p>
                            <p className={canUse ? 'text-gray-500' : 'text-gray-400'}>
                              Còn lại: {voucher.quantity - voucher.used}/{voucher.quantity}
                            </p>
                            <p className={canUse ? 'text-gray-500' : 'text-gray-400'}>
                              HSD: {formatDate(voucher.endDate)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => applyVoucher(voucher.code)}
                          disabled={!canUse}
                          className={`px-3 py-1 text-sm rounded ml-2 ${
                            canUse 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {canUse ? 'Sử dụng' : 'Không đủ điều kiện'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {availableVouchers.filter(voucher => isVoucherValid(voucher)).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Không có voucher khả dụng</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderReview;
