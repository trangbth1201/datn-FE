import { AuthHeader } from "../components/authHeader";
import Background from '../assets/image/shoes.svg';
import Facebook from '../assets/image/facebook.svg';
// import Google from '../assets/image/google.svg';
import { Link, useNavigate } from "react-router-dom";
import { EyeFilled, EyeInvisibleFilled } from "@ant-design/icons";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext ";
import { login } from "../services/authService";
import GoogleLoginButton from "../components/GoogleLoginButton";
// <-- Context login

const Login: React.FC = () => {
    const [showPass, setShowPass] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login: loginContext } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    document.title = "Đăng nhập";

    const togglePassword = () => setShowPass(!showPass);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); 
        try {
            const { accessToken, user } = await login(email, password);
            loginContext(accessToken, user);
            navigate("/");
        } catch (err: any) {
            setError(err.message);
        }
    };


    return (
        <>
            <AuthHeader title={"Đăng nhập"} />
            <div className="auth-box">
                <div className="container mx-auto">
                    <div className="grid place-items-center grid-cols-2">
                        <img src={Background} className="ani" />
                        <div className="auth-form">
                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="off"
                                        className="input"
                                    />
                                    <label className="user-label">Email</label>
                                    {error && <small className="text-red-500 mb-4">{error}</small>}
                                </div>
                                <div className="input-group">
                                    <input
                                        required
                                        type={showPass ? "text" : "password"}
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="off"
                                        className="input"
                                    />
                                    <label className="user-label">Mật khẩu</label>
                                    <div className="changepass" onClick={togglePassword}>
                                        {showPass ? <EyeInvisibleFilled /> : <EyeFilled />}
                                    </div>
                                </div>
                                <div className="input-group">
                                    <button type="submit" className="btn-auth rounded">
                                        Đăng nhập
                                    </button>
                                </div>
                                <div className="flex justify-between">
                                    <div className="flex items-center ">
                                        <input type="checkbox" id="check" />
                                        <label htmlFor="check" className="form-text ml-2">Duy trì đăng nhập</label>
                                    </div>
                                    <a href="/forgot-password" className="form-text">Quên mật khẩu</a>
                                </div>
                            </form>
                            <div className="line">
                                <strong>Or</strong>
                            </div>
                            <div className="flex items-center justify-between mt-6">
                                <div className="bg-blue-700 flex items-center justify-center social">
                                    <img src={Facebook} />
                                </div>
                                <div >
                                    {/* <img src={Google} alt="" /> */}
                                    <GoogleLoginButton />
                                </div>
                            </div>
                            <span className="text-center block mt-8">
                                Bạn chưa có tài khoản?{" "}
                                <Link to="/register" className="text-blue-600 font-bold">Đăng ký</Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
