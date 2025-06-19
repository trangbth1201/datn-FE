import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationService } from '../services/location.service';

interface IStructuredAddress {
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  province?: string;
  country?: string;
}

interface IAuth {
  _id?: string;
  fullName?: string;
  email: string;
  password?: string;
  phone?: string;
  address?: IStructuredAddress;
  city?: string;
  country?: string;
  role?: 'staff' | 'admin' | 'user';
  isActive?: boolean;
  userUpdated?: string;
  resetPasswordVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

interface Province {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  phone_code: number;
}

interface District {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  province_code: number;
}

interface Ward {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  district_code: number;
}

const ShippingAddressForm = () => {
  const navigate = useNavigate();
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Location states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  // Safe user data parsing
  const getUserData = (): IAuth | null => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const userData = getUserData();

  // Helper function để safely access address data từ cấu trúc mới
  const getUserAddress = (): IStructuredAddress => {
    if (!userData) return {};
    
    // Với cấu trúc userData mới: có address object và city riêng biệt
    return {
      street: userData.address?.street || '',
      ward: userData.address?.ward || '',
      district: userData.address?.district || '',
      city: userData.city || userData.address?.city || '',
      country: userData.country || userData.address?.country || ''
    };
  };

  const userAddress = getUserAddress();
  console.log("User address data:", userAddress);
  

  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userAddress.street || '',
    city:userAddress.city || '',
    cityName: userAddress.city || '',
    district: '',
    districtName: userAddress.district || '',
    ward: '',
    wardName: userAddress.ward || '',
    note: ''
  });

  // Lấy dữ liệu order từ localStorage
  useEffect(() => {
    const savedOrderSummary = localStorage.getItem('selectedCartItems');
    if (savedOrderSummary) {
      try {
        const selectedItems = JSON.parse(savedOrderSummary);
        
        const subtotal = selectedItems.reduce((total: number, item: any) => {
          const price = item.salePrice > 0 ? item.salePrice : item.regularPrice;
          return total + (price * item.quantity);
        }, 0);

        const totalSavings = selectedItems.reduce((savings: number, item: any) => {
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
      } catch (error) {
        console.error('Error parsing cart items:', error);
        navigate('/cart');
      }
    } else {
      navigate('/cart');
    }
  }, [navigate]);

  // Lấy danh sách tỉnh/thành và auto-select từ userData
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setApiError('');
        const provincesData = await locationService.getProvinces();
        setProvinces(provincesData);
        
        // Auto-select user's city nếu có
        if (userAddress.city) {
          const userProvince = provincesData.find((p: Province) => 
            p.name.toLowerCase().includes(userAddress.city?.toLowerCase() || '') ||
            userAddress.city?.toLowerCase().includes(p.name.toLowerCase() || '') ||
            p.codename.toLowerCase().includes(userAddress.city?.toLowerCase().replace(/\s+/g, '_') || '')
          );
          
          if (userProvince) {
            setFormData(prev => ({
              ...prev,
              city: userProvince.code.toString(),
              cityName: userProvince.name
            }));
            
            // Load districts cho province của user
            await loadDistrictsForProvince(userProvince.code, userAddress.district);
          }
        }
      } catch (error) {
        console.error('Không thể tải danh sách tỉnh/thành:', error);
        setApiError('Không thể tải dữ liệu địa phương. Vui lòng nhập thủ công hoặc thử lại sau.');
      }
    };

    loadProvinces();
  }, []);

  const loadDistrictsForProvince = async (provinceCode: number, userDistrictName?: string) => {
    setLoadingDistricts(true);
    try {
      const districtsData = await locationService.getDistricts(provinceCode);
      setDistricts(districtsData);
      
      // Auto-select user's district nếu có
      if (userDistrictName) {
        const userDistrict = districtsData.find((d: District) => 
          d.name.toLowerCase().includes(userDistrictName.toLowerCase()) ||
          userDistrictName.toLowerCase().includes(d.name.toLowerCase()) ||
          d.codename.toLowerCase().includes(userDistrictName.toLowerCase().replace(/\s+/g, '_'))
        );
        
        if (userDistrict) {
          setFormData(prev => ({
            ...prev,
            district: userDistrict.code.toString(),
            districtName: userDistrict.name
          }));
          
          // Load wards cho district của user
          await loadWardsForDistrict(userDistrict.code, userAddress.ward);
        }
      }
    } catch (error) {
      console.error('Không thể tải danh sách quận/huyện:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadWardsForDistrict = async (districtCode: number, userWardName?: string) => {
    setLoadingWards(true);
    try {
      const wardsData = await locationService.getWards(districtCode);
      setWards(wardsData);
      
      // Auto-select user's ward nếu có
      if (userWardName) {
        const userWard = wardsData.find((w: Ward) => 
          w.name.toLowerCase().includes(userWardName.toLowerCase()) ||
          userWardName.toLowerCase().includes(w.name.toLowerCase()) ||
          w.codename.toLowerCase().includes(userWardName.toLowerCase().replace(/\s+/g, '_'))
        );
        
        if (userWard) {
          setFormData(prev => ({
            ...prev,
            ward: userWard.code.toString(),
            wardName: userWard.name
          }));
        }
      }
    } catch (error) {
      console.error('Không thể tải danh sách phường/xã:', error);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Xử lý khi chọn tỉnh/thành
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = parseInt(e.target.value);
    const selectedProvince = provinces.find(p => p.code === selectedCode);
    console.log("Selected province:", selectedProvince);
    setFormData({
      ...formData,
      city: selectedCode.toString(),
      cityName: selectedProvince?.name || '',
      district: '',
      districtName: '',
      ward: '',
      wardName: ''
    });

    setDistricts([]);
    setWards([]);

    if (selectedCode) {
      await loadDistrictsForProvince(selectedCode);
    }
  };

  // Xử lý khi chọn quận/huyện
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = parseInt(e.target.value);
    const selectedDistrict = districts.find(d => d.code === selectedCode);
    console.log("Selected district:", selectedDistrict);
    setFormData({
      ...formData,
      district: selectedCode.toString(),
      districtName: selectedDistrict?.name || '',
      ward: '',
      wardName: ''
    });

    setWards([]);

    if (selectedCode) {
      await loadWardsForDistrict(selectedCode);
    }
  };

  // Xử lý khi chọn phường/xã
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = parseInt(e.target.value);
    const selectedWard = wards.find(w => w.code === selectedCode);
    console.log("Selected ward:", selectedWard);
    setFormData({
      ...formData,
      ward: selectedCode.toString(),
      wardName: selectedWard?.name || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate required fields
      const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'district', 'ward'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        alert(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
        return;
      }

      // Lưu thông tin shipping với đầy đủ dữ liệu
      const shippingData = {
        ...formData,
        cityCode: formData.city,
        cityName: formData.cityName,
        districtCode: formData.district,
        districtName: formData.districtName,
        wardCode: formData.ward,
        wardName: formData.wardName
      };
      
      localStorage.setItem('shippingInfo', JSON.stringify(shippingData));
      
      const completeOrderData = {
        ...orderSummary,
        shippingInfo: shippingData,
        orderDate: new Date().toISOString()
      };
      localStorage.setItem('completeOrderData', JSON.stringify(completeOrderData));
      
      setTimeout(() => {
        navigate('/checkout/payment');
      }, 500);
    } catch (error) {
      console.error('Lỗi khi lưu thông tin:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getItemPrice = (item: any) => {
    return item.salePrice > 0 ? item.salePrice : item.regularPrice;
  };

  // Render Order Summary
  const renderOrderSummary = () => {
    if (!orderSummary) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tóm tắt đơn hàng ({orderSummary.itemCount} sản phẩm)
        </h3>
        
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {orderSummary.items.map((item: any, index: number) => (
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
            <span className="text-gray-900 font-medium">
              {orderSummary.shippingFee.toLocaleString()}₫
            </span>
          </div>
          
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Tổng cộng:</span>
            <span className="text-blue-600">{orderSummary.finalTotal.toLocaleString()}₫</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Thanh toán an toàn & bảo mật
        </div>
      </div>
    );
  };

  if (!orderSummary) {
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
            Thông tin giao hàng
          </h1>
          <p className="text-gray-600 mt-2">
            Vui lòng điền đầy đủ thông tin để hoàn tất đơn hàng
          </p>
          {/* {userData && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Chào {userData.fullName}!</strong> Thông tin địa chỉ của bạn đã được điền sẵn từ hồ sơ.
              </p>
              <p className="text-xs text-green-600 mt-1">
                Địa chỉ hiện tại: {userAddress.street}, {userAddress.ward}, {userAddress.district}, {userAddress.city}
              </p>
            </div>
          )} */}
        </div>

        {/* API Error Notice */}
        {apiError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            {renderOrderSummary()}
          </div>
          
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin người nhận</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ chi tiết *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Số nhà, tên đường, khu vực..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location Selection với auto-fill từ userData */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh/Thành phố *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleProvinceChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn tỉnh/thành</option>
                      {provinces.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện *
                    </label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleDistrictChange}
                      required
                      disabled={!formData.city || loadingDistricts}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {loadingDistricts ? 'Đang tải...' : 'Chọn quận/huyện'}
                      </option>
                      {districts.map((district) => (
                        <option key={district.code} value={district.code}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phường/Xã *
                    </label>
                    <select
                      name="ward"
                      value={formData.ward}
                      onChange={handleWardChange}
                      required
                      disabled={!formData.district || loadingWards}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {loadingWards ? 'Đang tải...' : 'Chọn phường/xã'}
                      </option>
                      {wards.map((ward) => (
                        <option key={ward.code} value={ward.code}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Ghi chú thêm cho đơn hàng (tùy chọn)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate('/cart')}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại giỏ hàng
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
                        Tiếp tục thanh toán
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

export default ShippingAddressForm;
