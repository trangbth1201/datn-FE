import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
const total = localStorage.getItem('totalAmount');
  useEffect(() => {
    
    // Clear checkout data from localStorage
    localStorage.removeItem('shippingInfo');
    localStorage.removeItem('paymentMethod');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-gray-600 mb-6">
            Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
          </p>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-medium text-blue-600">#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày đặt:</span>
                <span className="font-medium">{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-medium text-lg">{total}₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phương thức thanh toán:</span>
                <span className="font-medium">Thanh toán khi nhận hàng</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-900 mb-2">Bước tiếp theo:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Chúng tôi sẽ xác nhận đơn hàng qua email/SMS</li>
              <li>• Đơn hàng sẽ được giao trong 2-3 ngày làm việc</li>
              <li>• Bạn có thể theo dõi đơn hàng trong mục "Đơn hàng của tôi"</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to={`/order/tracking/${orderId}`}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 inline-block text-center"
            >
              Theo dõi đơn hàng
            </Link>
            
            <Link
              to="/"
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 inline-block text-center"
            >
              Tiếp tục mua sắm
            </Link>
          </div>

          {/* Contact Info */}
          <div className="text-center text-sm text-gray-500 mt-6">
            <p>Cần hỗ trợ? Liên hệ:</p>
            <p className="font-medium">Hotline: 1900-1234 | Email: support@shoestore.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
