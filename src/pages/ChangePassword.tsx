import React, { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import Swal from "sweetalert2";
import { SidebarLink } from "../components/SidebarLink";
import { useAuth } from "../auth/AuthContext ";
import { userChangePass } from "../services/authService";

interface PasswordForm {
  current: string;
  newPwd: string;
  confirm: string;
}

interface Requirement {
  label: string;
  test: (pwd: string) => boolean;
}

const requirements: Requirement[] = [
  {
    label: "Tối thiểu 8 ký tự",
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: "Chứa một số",
    test: (pwd) => /\d/.test(pwd),
  },
  {
    label: "Chứa một ký tự đặc biệt",
    test: (pwd) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
  },
  {
    label: "Chứa một ký tự in hoa",
    test: (pwd) => /[A-ZÀ-Ỹ]/.test(pwd),
  },
];

const getStrength = (pwd: string) => {
  const passed = requirements.reduce(
    (acc, r) => acc + (r.test(pwd) ? 1 : 0),
    0
  );
  if (!pwd) return { label: "", percent: 0, color: "bg-transparent" };
  if (passed <= 1) return { label: "Yếu", percent: 25, color: "bg-red-500" };
  if (passed === 2) return { label: "Trung bình", percent: 50, color: "bg-yellow-500" };
  if (passed === 3) return { label: "Khá", percent: 75, color: "bg-blue-500" };
  return { label: "Mạnh", percent: 100, color: "bg-green-500" };
};

const ChangePassword: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PasswordForm>({
    current: "",
    newPwd: "",
    confirm: "",
  });

  const [show, setShow] = useState<{ current: boolean; newPwd: boolean; confirm: boolean }>({
    current: false,
    newPwd: false,
    confirm: false,
  });

  const toggleShow = (field: keyof typeof show) => () =>
    setShow((s) => ({ ...s, [field]: !s[field] }));


  const resetForm = () => {
    setFormData({
      current: "",
      newPwd: "",
      confirm: "",
    });
    setShow({
      current: false,
      newPwd: false,
      confirm: false,
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    const token = localStorage.getItem("token");

    const res = await userChangePass(user._id, formData.current, formData.newPwd ,token ?? "");

    if (res.success) {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Mật khẩu đã được thay đổi!",
      });
      resetForm();
    } else {
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: res.message || "Không thể đổi mật khẩu",
      });
    }
  };


  const strength = getStrength(formData.newPwd);

  const canSubmit =
    formData.current &&
    formData.newPwd &&
    formData.newPwd === formData.confirm &&
    strength.percent >= 75;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-56 space-y-3 mb-6 md:mb-0">
        <SidebarLink />
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <h1 className="text-2xl font-semibold mb-6">Đổi mật khẩu</h1>

        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl shadow p-8 space-y-8">
          {/* Current password */}
          <div className="relative">
            <label htmlFor="current" className="sr-only">
              Mật khẩu hiện tại
            </label>
            <input
              id="current"
              type={show.current ? "text" : "password"}
              placeholder="Mật khẩu hiện tại"
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.current}
              onChange={(e) => setFormData({ ...formData, current: e.target.value })}
            />
            {show.current ? (
              <EyeOff
                className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-500 cursor-pointer"
                onClick={toggleShow("current")}
              />
            ) : (
              <Eye
                className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-500 cursor-pointer"
                onClick={toggleShow("current")}
              />
            )}
          </div>

          {/* New & confirm passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New */}
            <div className="relative">
              <label htmlFor="newPwd" className="sr-only">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  id="newPwd"
                  type={show.newPwd ? "text" : "password"}
                  placeholder="Mật khẩu mới"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.newPwd}
                  onChange={(e) => setFormData({ ...formData, newPwd: e.target.value })}
                />
                <button
                  type="button"
                  onClick={toggleShow("newPwd")}
                  className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-500"
                >
                  {show.newPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength bar */}
              <div className="mt-1">
                <div className="h-1 bg-gray-200 rounded">
                  <div
                    style={{ width: `${strength.percent}%` }}
                    className={`h-full rounded ${strength.color} transition-all duration-300`}
                  />
                </div>
                <p className="text-xs mt-1 text-gray-600">{strength.label}</p>
              </div>
            </div>

            {/* Confirm */}
            <div className="relative">
              <label htmlFor="confirm" className="sr-only">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={show.confirm ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.confirm}
                  onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                />
                {show.confirm ? (
                  <EyeOff
                    className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-500 cursor-pointer"
                    onClick={toggleShow("confirm")}
                  />
                ) : (
                  <Eye
                    className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-500 cursor-pointer"
                    onClick={toggleShow("confirm")}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Requirements list */}
          <ul className="space-y-1 text-sm">
            {requirements.map((r) => {
              const ok = r.test(formData.newPwd);
              return (
                <li key={r.label} className={ok ? "text-green-600" : "text-gray-500"}>
                  {ok ? <Check className="inline mr-2 w-4 h-4" /> : <X className="inline mr-2 w-4 h-4" />}
                  {r.label}
                </li>
              );
            })}
          </ul>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-8 py-3 rounded-lg font-medium text-white transition shadow-md
                ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
              disabled={!canSubmit}
            >
              Đổi mật khẩu
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ChangePassword;
