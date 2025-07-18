import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ShippingAddressForm = () => {
  const navigate = useNavigate();
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy dữ liệu user từ localStorage
  const getUserData = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  };

  const userData = getUserData();

  // Khởi tạo formData với địa chỉ cụ thể (street) và các thông tin khác
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    street: userData?.address || '',
    note: ''
  });
  console.log('Form Data:', userData);
  

  // Lấy dữ liệu đơn hàng từ localStorage
  useEffect(() => {
    const savedOrderSummary = localStorage.getItem('selectedCartItems');
    if (savedOrderSummary) {
      try {
        const selectedItems = JSON.parse(savedOrderSummary);
        const subtotal = selectedItems.reduce((total: number, item: any) => {
          const price = item.salePrice > 0 ? item.salePrice : item.regularPrice;
          return total + price * item.quantity;
        }, 0);
        const totalSavings = selectedItems.reduce((savings: number, item: any) => {
          if (item.salePrice > 0) {
            return savings + (item.regularPrice - item.salePrice) * item.quantity;
          }
          return savings;
        }, 0);
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
      } catch {
        navigate('/cart');
      }
    } else {
      navigate('/cart');
    }
  }, [navigate]);

  // Xử lý input thay đổi
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Xử lý submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Kiểm tra trường bắt buộc
    if (!formData.fullName || !formData.email || !formData.phone || !formData.street) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc.');
      setIsLoading(false);
      return;
    }

    try {
      const shippingData = {
        ...formData
      };
      localStorage.setItem('shippingInfo', JSON.stringify(shippingData));

      const completeOrderData = {
        ...orderSummary,
        shippingInfo: shippingData,
        orderDate: new Date().toISOString()
      };
      localStorage.setItem('completeOrderData', JSON.stringify(completeOrderData));

      navigate('/checkout/payment');
    } catch {
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render tóm tắt đơn hàng đơn giản
  const renderOrderSummary = () => {
    if (!orderSummary) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6 sticky top-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          Tóm tắt đơn hàng ({orderSummary.itemCount} sản phẩm) 
        </h3>
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {orderSummary.items.map((item: any) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex items-center space-x-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-xs text-gray-500">
                  Size: {item.size} | Màu: <span style={{backgroundColor: item.color}} className="inline-block w-3 h-3 rounded border border-gray-300 align-middle"></span> | SL: {item.quantity}
                </p>
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
            <span className="font-medium">{orderSummary.shippingFee.toLocaleString()}₫</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Tổng cộng:</span>
            <span className="text-blue-600">{orderSummary.finalTotal.toLocaleString()}₫</span>
          </div>
        </div>
      </div>
    );
  };

  if (!orderSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        

        {/* Tóm tắt đơn hàng */}
        <aside className="w-full lg:w-96">
          {renderOrderSummary()}
        </aside>
        {/* Form thông tin giao hàng */}
        <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Thông tin giao hàng</h1>

          <div className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block font-medium mb-1">Họ và tên *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-medium mb-1">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block font-medium mb-1">Số điện thoại *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="street" className="block font-medium mb-1">Địa chỉ cụ thể *</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Số nhà, tên đường, khu phố..."
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="note" className="block font-medium mb-1">Ghi chú (tuỳ chọn)</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={3}
                placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi giao..."
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingAddressForm;
