export const validatePasswordRules = (password: string) => {
  return {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};


export const getPasswordStrength = (rules: ReturnType<typeof validatePasswordRules>): "Yếu" | "Trung bình" | "Mạnh" => {
  const passed = Object.values(rules).filter(Boolean).length;
  if (passed <= 2) return "Yếu";
  if (passed === 3) return "Trung bình";
  return "Mạnh";
};


export const formatCurrency = (amount?: number) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount);
};


export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};



export interface MessageType {
  id: number;
  text?: string;
  sender: "user" | "bot";
  time: string;
  image?: string;
}
