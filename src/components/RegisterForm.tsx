import {EyeFilled, EyeInvisibleFilled } from "@ant-design/icons";
import Button from "antd/es/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import Facebook from "../assets/image/facebook.svg";
import Google from "../assets/image/google.svg";
import { register } from "../services/authService";
import Swal from "sweetalert2";
import { getPasswordStrength, validatePasswordRules } from "../utils/function";
import GoogleLoginButton from "./GoogleLoginButton";

interface RegisterFormProps {
    onRegisterSuccess: (email: string) => void;
}


const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPass, setShowPass] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const rules = validatePasswordRules(formData.password);
    const strength = getPasswordStrength(rules);
    const toggleOldPassword = () => {
        setShowPass(!showPass);
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (!isStepValid()) return; 

            if (current < steps.length - 1) {
                next();
            } else {
                handleSubmit(e as any); 
            }
        }
    };
    const strengthColor = {
        Yếu: "text-red-500 ",
        "Trung bình": "text-yellow-500",
        Mạnh: "text-green-500 ",
    };
    const strengthBgColor = {
        Yếu: "w-[30%] bg-red-400",
        "Trung bình": "w-[60%] bg-yellow-400",
        Mạnh: "w-[100%] bg-green-400",
    };
    const toggleNewPassword = () => {
        setShowNewPassword(!showNewPassword);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp.');
            return;
        }
        setLoading(true);

        try {
            await register(
                formData.fullName,
                formData.email,
                formData.password,
                formData.confirmPassword
            );
            onRegisterSuccess(formData.email);
            Swal.fire({
                title: "Good job!",
                text: "Đăng ký thành công, Nhập mã OTP để xác thực",
                icon: "success"
            });
        } catch (error: any) {
            console.error('Đăng ký thất bại:', error);
            alert(error.message || 'Đăng ký thất bại!');
        } finally {
            setLoading(false);
        }
    };
    const steps = [
        {
            title: "Email của bạn",
            content: (
                <div className="input-group">
                    <input
                        required
                        type="text"
                        name="email"
                        autoComplete="off"
                        className="input"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                    />
                    <label className="user-label">Email</label>
                </div>
            ),
        },
        {
            title: "Nhập họ và tên của bạn",
            content: (
                <div className="input-group">
                    <input
                        required
                        type="text"
                        name="name"
                        autoComplete="off"
                        className="input"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <label className="user-label">Họ và tên</label>
                </div>
            ),
        },
        {
            title: "Nhập mật khẩu",
            content: (
                <>
                    <div className="input-group !mb-0">
                        <div className="flex items-top
                        ">
                            <input
                                required
                                type={showPass ? "text" : "password"}
                                name="password"
                                autoComplete="off"
                                className="input"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                            />
                            <label className="user-label">Nhập mật khẩu</label>
                            <div className="changepass" onClick={toggleOldPassword} style={{top:"25%"}}>
                                {showPass ? <EyeInvisibleFilled /> : <EyeFilled />}
                            </div>
                        </div>
                        <div className="flex gap-4 items-center justify-between my-2">
                            <div
                                className={`h-1 rounded-full ${strengthBgColor[strength] || ""}`}
                            >
                            </div>
                            <p className={`text-sm text-right ${strengthColor[strength]}`}>
                                {strength}
                            </p>
                        </div>
                    </div>
                    <ul className="text-sm grid grid-cols-2 grid-rows-2 gap-2 mb-6">
                        <li className={rules.length ? "text-green-500" : "text-gray-500"}>{rules.length ? <i className="pi pi-check text-sm"></i> : <i className="pi pi-times text-sm"></i>} Tối thiểu 8 ký tự</li>
                        <li className={rules.hasUpper ? "text-green-500" : "text-gray-500"}>{rules.hasUpper ? <i className="pi pi-check text-sm"></i> : <i className="pi pi-times text-sm"></i>} Chứa ký tự in hoa</li>
                        <li className={rules.hasNumber ? "text-green-500" : "text-gray-500"}>{rules.hasNumber ? <i className="pi pi-check text-sm"></i> : <i className="pi pi-times text-sm"></i>} Chứa số</li>
                        <li className={rules.hasSpecial ? "text-green-500" : "text-gray-500"}>{rules.hasSpecial ? <i className="pi pi-check text-sm"></i> : <i className="pi pi-times text-sm"></i>} Chứa ký tự đặc biệt</li>
                    </ul>
                    <div className="input-group">
                        <input
                            required
                            type={showNewPassword ? "text" : "password"}
                            name="confirmPassword"
                            autoComplete="off"
                            className="input"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                        />
                        <label className="user-label">Nhập lại mật khẩu</label>
                        <div className="changepass" onClick={toggleNewPassword} style={{transform: "translateY(-100%);"}}>
                            {showNewPassword ? <EyeInvisibleFilled /> : <EyeFilled />}
                        </div>
                    </div>
                </>
            ),
        },
    ];

    const isStepValid = () => {
        switch (current) {
            case 0:
                return /\S+@\S+\.\S+/.test(formData.email);
            case 1:
                return formData.fullName.trim().length > 0;
            case 2:
                return (
                    formData.password.length >= 6 &&
                    formData.password === formData.confirmPassword
                );
            default:
                return false;
        }
    };

    const next = () => setCurrent(current + 1);
    return (
        <>
            <div className="auth-form">
                <form onKeyDown={handleKeyDown}>
                    <div style={{ width: "100%", margin: "auto" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 20,
                            }}
                        >
                            {steps.map((step, index) => (
                                <div
                                    className="steps-line"
                                    key={index}
                                    onClick={() => setCurrent(index)}
                                    style={{
                                        flex: 1,
                                        textAlign: "center",
                                        cursor: "pointer",
                                        backgroundColor:
                                            current === index ? "#1890ff" : "#1a73e82d",
                                        color: current === index ? "#fff" : "#000",
                                        margin: "0 2px",
                                        width: "123px",
                                        height: "7px",
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>
                    <div className="step-title">{steps[current].title}</div>
                    <div style={{ marginTop: 20 }}>{steps[current].content}</div>
                    <div className="input-group">
                        {current < steps.length - 1 ? (
                            <Button
                                className="btn-auth rounded"
                                onClick={next}
                                disabled={!isStepValid()}
                            >
                                Tiếp theo
                            </Button>
                        ) : (
                            <Button
                                className="btn-auth rounded"
                                disabled={!isStepValid()}
                                onClick={handleSubmit}
                            >
                                Đăng ký
                            </Button>
                        )}
                        {/* <button className="btn-auth rounded">
                    Đăng nhập
                  </button> */}
                    </div>
                </form>
                <div className="line">
                    <strong>Or</strong>
                </div>
                <div className="flex items-center justify-between mt-6">
                    <div className="bg-blue-700 flex items-center justify-center social">
                        <img src={Facebook} />
                    </div>
                    <GoogleLoginButton />
                </div>
                <span className="text-center block mt-8">
                    Bạn đã có tài khoản?{" "}
                    <Link to="/login" className="text-blue-600 font-bold">
                        Đăng nhập
                    </Link>
                </span>
            </div>
        </>
    );
}
export default RegisterForm;