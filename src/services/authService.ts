import axios from "axios";

axios.defaults.baseURL = 'http://localhost:8080/api/';
axios.defaults.withCredentials = true;

export interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  address: any;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const res = await axios.post<LoginResponse>("/login", { email, password });
    localStorage.setItem("userId", res.data.user._id);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    const user = localStorage.getItem("user");
    console.log("User data:", JSON.parse(user || '{}').address);

    return res.data;
  } catch (err: any) {
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    throw new Error("Đăng nhập thất bại. Vui lòng thử lại.");
  }
};

export const register = async (fullName: string, email: string, password: string, confirmPassword: string) => {
  try {
    const response = await axios.post('/register', {
      fullName,
      email,
      password,
      confirmPassword
    });
    return response.data;
  } catch (error: any) {
    console.error('Registration failed:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'An error occurred during registration.');
    }
    throw new Error('An unexpected error occurred.');
  }
};


export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await axios.post('/verify-otp', {
      email,
      otp,
    });
    return response.data;
  } catch (error: any) {
    // Kiểm tra nếu có lỗi phản hồi từ server
    if (error.response) {
      console.error("Lỗi xác thực OTP: ", error.response.data.message);
      throw new Error(error.response.data.message || "Xác thực OTP thất bại");
    } else if (error.request) {
      // Nếu không có phản hồi từ server
      console.error("Không nhận được phản hồi từ server: ", error.request);
      throw new Error("Không nhận được phản hồi từ server. Vui lòng thử lại.");
    } else {
      console.error("Lỗi không xác định: ", error.message);
      throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  }
};
export const ChangePassword = async (email: string, password: string) => {
  try {
    const response = await axios.post('/reset-password', {
      email,
      password,
    });

    if (response.status === 200) {
      return {
        success: true,
        message: response.data.message || 'Mật khẩu đã được thay đổi thành công!'
      };
    } else {
      throw new Error('Không thể thay đổi mật khẩu. Vui lòng thử lại.');
    }
  } catch (error: any) {
    console.error('Đổi mật khẩu thất bại:', error);
    if (error.response) {
      const errorMessage = error.response.data.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      throw new Error(errorMessage); // Ném ra lỗi với thông báo cụ thể
    }

    throw new Error('Lỗi kết nối hoặc server gặp sự cố. Vui lòng thử lại sau.');
  }
};

export const sendOtpToEmail = async (email: string) => {
  try {
    const response = await axios.post('/forgot-password', {
      email,
    });
    if (response.status === 200) {
      return { success: true, message: 'Mã OTP đã được gửi vào email.' };
    } else {
      throw new Error(response.data.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    }
  } catch (error: any) {
    console.error('Lỗi gửi OTP:', error);
    if (error.response) {
      return { success: false, message: error.response.data.message || 'Có lỗi xảy ra khi gửi OTP' };
    } else if (error.request) {
      return { success: false, message: 'Không có phản hồi từ server. Vui lòng kiểm tra kết nối.' };
    } else {
      return { success: false, message: `Lỗi: ${error.message}` };
    }
  }
};


export const verifyOtpToEmail = async (email: string, otp: string) => {
  try {
    const response = await axios.post('/verify-reset-otp', { email, otp });
    if (response.status === 200) {
      return { success: true, message: 'Xác thực OTP thành công' };
    } else {
      throw new Error(response.data.message || 'OTP chưa đúng. Vui lòng thử lại.');
    }
  } catch (error: any) {
    console.error('Lỗi gửi OTP:', error);

    if (error.response) {
      return { success: false, message: error.response.data.message || 'Có lỗi xảy ra khi gửi OTP' };
    } else if (error.request) {
      return { success: false, message: 'Không có phản hồi từ server. Vui lòng kiểm tra kết nối.' };
    } else {
      return { success: false, message: `Lỗi: ${error.message}` };
    }
  }
};

export const resetPassword = async (email: string, newPassword: string ,confirmPassword :string ) => {
  try {
    const response = await axios.post('/reset-password', { email, newPassword  ,confirmPassword});

    if (response.status === 200) {
      return { success: true, message: 'Đặt lại mật khẩu thành công' };
    } else {
      throw new Error(response.data.message || 'Không thể reset mật khẩu');
    }
  } catch (error: any) {
    console.error('Lỗi reset mật khẩu:', error);

    if (error.response) {
      return { success: false, message: error.response.data.message || 'Có lỗi xảy ra khi reset mật khẩu' };
    } else if (error.request) {
      return { success: false, message: 'Không có phản hồi từ server. Vui lòng kiểm tra kết nối.' };
    } else {
      return { success: false, message: `Lỗi: ${error.message}` };
    }
  }
};
