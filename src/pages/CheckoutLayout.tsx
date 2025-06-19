import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const CheckoutLayout = () => {
  const location = useLocation();
  
  const steps = [
    { path: '/checkout', label: 'Thông tin giao hàng', step: 1 },
    { path: '/checkout/payment', label: 'Thanh toán', step: 2 },
    { path: '/checkout/review', label: 'Xác nhận', step: 3 }
  ];
  
  const getCurrentStep = () => {
    if (location.pathname === '/checkout' || location.pathname === '/checkout/shipping') return 1;
    if (location.pathname === '/checkout/payment') return 2;
    if (location.pathname === '/checkout/review') return 3;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
          <p className="text-gray-600 mt-2">Hoàn tất đơn hàng của bạn</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  getCurrentStep() >= step.step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {getCurrentStep() > step.step ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{step.step}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  getCurrentStep() >= step.step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    getCurrentStep() > step.step ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default CheckoutLayout;
