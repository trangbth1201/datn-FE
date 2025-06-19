// services/location.service.ts
import axios from "axios";

// Sử dụng proxy endpoint từ backend
const LOCATION_API_URL = "http://localhost:8080/api/proxy";

export const locationService = {
  // Lấy danh sách tỉnh/thành phố
  getProvinces: async () => {
    try {
      const response = await axios.get(`${LOCATION_API_URL}/provinces`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải danh sách tỉnh/thành:", error);
      throw error;
    }
  },

  // Lấy danh sách quận/huyện theo mã tỉnh
  getDistricts: async (provinceCode: any) => {
    try {
      const response = await axios.get(
        `${LOCATION_API_URL}/districts/${provinceCode}`
      );
      return response.data.districts || [];
    } catch (error) {
      console.error("Lỗi khi tải danh sách quận/huyện:", error);
      throw error;
    }
  },

  // Lấy danh sách phường/xã theo mã quận/huyện
  getWards: async (districtCode: any) => {
    try {
      const response = await axios.get(
        `${LOCATION_API_URL}/wards/${districtCode}`
      );
      return response.data.wards || [];
    } catch (error) {
      console.error("Lỗi khi tải danh sách phường/xã:", error);
      throw error;
    }
  },
};
