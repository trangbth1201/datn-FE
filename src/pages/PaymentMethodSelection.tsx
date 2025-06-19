import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentMethodSelection = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('cod');
  const [orderSummary, setOrderSummary] = useState(null);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy dữ liệu từ localStorage khi component mount
  useEffect(() => {
    const savedOrderSummary = localStorage.getItem('selectedCartItems');
    const savedShippingInfo = localStorage.getItem('shippingInfo');
    
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
      
      const shippingFee = 30000;
      const freeShippingThreshold = 500000;
      const finalShippingFee = subtotal >= freeShippingThreshold ? 0 : shippingFee;
      const finalTotal = subtotal + finalShippingFee;
      
      setOrderSummary({
        items: selectedItems,
        subtotal,
        totalSavings,
        shippingFee: finalShippingFee,
        finalTotal,
        itemCount: selectedItems.length,
        freeShippingThreshold
      });
    } else {
      // Nếu không có dữ liệu, chuyển về trang cart
      navigate('/cart');
    }

    if (savedShippingInfo) {
      setShippingInfo(JSON.parse(savedShippingInfo));
    } else {
      // Nếu không có thông tin shipping, chuyển về trang shipping
      navigate('/checkout');
    }
  }, [navigate]);

  const paymentMethods = [
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng (COD)',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng',
      icon: '💵',
      fee: 0
    },
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản qua ATM, Internet Banking',
      icon: '🏦',
      fee: 0
    },
    // {
    //   id: 'momo',
    //   name: 'Ví MoMo',
    //   description: 'Thanh toán qua ví điện tử MoMo',
    //   icon: '📱',
    //   fee: 0
    // },
    // {
    //   id: 'zalopay',
    //   name: 'ZaloPay',
    //   description: 'Thanh toán qua ví điện tử ZaloPay',
    //   icon: '💳',
    //   fee: 0
    // }
  ];

  const getItemPrice = (item) => {
    return item.salePrice > 0 ? item.salePrice : item.regularPrice;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Lưu phương thức thanh toán
      localStorage.setItem('paymentMethod', selectedMethod);
      
      // Lưu thông tin đơn hàng hoàn chỉnh
      const completeOrderData = {
        ...orderSummary,
        shippingInfo,
        paymentMethod: selectedMethod,
        orderDate: new Date().toISOString(),
        orderStatus: 'pending'
      };
      localStorage.setItem('completeOrderData', JSON.stringify(completeOrderData));
      
      // Chuyển đến trang review
      setTimeout(() => {
        navigate('/checkout/review');
      }, 500);
    } catch (error) {
      console.error('Lỗi khi lưu thông tin:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Order Summary với dữ liệu thực từ cart
  const renderOrderSummary = () => {
    if (!orderSummary) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tóm tắt đơn hàng ({orderSummary.itemCount} sản phẩm)
        </h3>
        
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {orderSummary.items.map((item, index) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex items-center space-x-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Size: {item.size}</p>
                  <div className="flex items-center gap-1">
                    <span>Màu:</span>
                    <div 
                      className="w-3 h-3 rounded border border-gray-300"
                      style={{ backgroundColor: item.color }}
                    ></div>
                  </div>
                  <p>SL: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-medium text-sm">
                  {(getItemPrice(item) * item.quantity).toLocaleString()}₫
                </span>
                {item.salePrice > 0 && (
                  <p className="text-xs text-gray-500 line-through">
                    {(item.regularPrice * item.quantity).toLocaleString()}₫
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tạm tính ({orderSummary.itemCount} sản phẩm):</span>
            <span>{orderSummary.subtotal.toLocaleString()}₫</span>
          </div>
          
          {orderSummary.totalSavings > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Tiết kiệm:</span>
              <span>-{orderSummary.totalSavings.toLocaleString()}₫</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>Phí vận chuyển:</span>
            <span>
              {orderSummary.shippingFee === 0 ? (
                <span className="text-green-600 font-medium">Miễn phí</span>
              ) : (
                `${orderSummary.shippingFee.toLocaleString()}₫`
              )}
            </span>
          </div>
          
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Tổng cộng:</span>
            <span className="text-blue-600">{orderSummary.finalTotal.toLocaleString()}₫</span>
          </div>
        </div>

        {/* Shipping Info Summary */}
        {shippingInfo && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Thông tin giao hàng:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>{shippingInfo.fullName}</strong></p>
              <p>{shippingInfo.phone}</p>
              <p>{shippingInfo.address}</p>
              <p>{shippingInfo.ward}, {shippingInfo.district}, {shippingInfo.city}</p>
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Thanh toán an toàn & bảo mật
        </div>
      </div>
    );
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
            Phương thức thanh toán
          </h1>
          <p className="text-gray-600 mt-2">
            Chọn phương thức thanh toán phù hợp với bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            {renderOrderSummary()}
          </div>
          
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Chọn phương thức thanh toán</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-4 flex-1">
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{method.name}</h3>
                          <p className="text-sm text-gray-500">{method.description}</p>
                          {method.fee > 0 && (
                            <p className="text-sm text-red-600 mt-1">
                              Phí: {method.fee.toLocaleString()}₫
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedMethod === method.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Bank Transfer Details */}
                {selectedMethod === 'bank_transfer' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Thông tin chuyển khoản
                    </h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p><strong>Ngân hàng:</strong> Vietcombank</p>
                          <p><strong>Số tài khoản:</strong> 1234567890</p>
                          <p><strong>Chủ tài khoản:</strong> SHOE STORE</p>
                        </div>
                        <div>
                          <p><strong>Số tiền:</strong> {orderSummary.finalTotal.toLocaleString()}₫</p>
                          <p><strong>Nội dung:</strong> DH{Date.now().toString().slice(-6)} {shippingInfo?.phone}</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 text-xs">
                          <strong>Lưu ý:</strong> Vui lòng chuyển khoản đúng số tiền và nội dung để đơn hàng được xử lý nhanh chóng.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* E-wallet Notice */}
                {/* {(selectedMethod === 'momo' || selectedMethod === 'zalopay') && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Thanh toán qua ví điện tử
                    </h4>
                    <p className="text-sm text-green-800">
                      Bạn sẽ được chuyển hướng đến ứng dụng {selectedMethod === 'momo' ? 'MoMo' : 'ZaloPay'} để hoàn tất thanh toán.
                    </p>
                  </div>
                )} */}

                {/* COD Notice */}
                {selectedMethod === 'cod' && (
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Thanh toán khi nhận hàng
                    </h4>
                    <p className="text-sm text-gray-600">
                      Bạn sẽ thanh toán bằng tiền mặt khi nhận được hàng. Vui lòng chuẩn bị đủ số tiền: <strong>{orderSummary.finalTotal.toLocaleString()}₫</strong>
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate('/checkout')}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại thông tin giao hàng
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </div>
                    ) : (
                      <>
                        Xem lại đơn hàng
                        <svg className="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelection;
