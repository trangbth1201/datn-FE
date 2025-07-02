import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { SidebarLink } from "./SidebarLink";
import { ChangeInfoUser } from "../services/authService";
import Swal from "sweetalert2";
import { useAuth } from "../auth/AuthContext ";
import { Loading } from "./loading";

interface AccountForm {
  fullName: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
}

const AccountSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<AccountForm>({
    fullName: user?.fullName ?? "",
    dob: "2004-01-12",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    address: user?.address ?? "",
  });

  const handleChange =
    <K extends keyof AccountForm>(field: K) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleUpdateInfo = async () => {
    if (!user) return;

    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Phiên đăng nhập hết hạn",
        text: "Vui lòng đăng nhập lại!",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await ChangeInfoUser(
        user._id,
        form.fullName,
        form.phone,
        form.address,
        token
      );

      if (res.success) {
        updateUser({
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
        });

        Swal.fire({
          icon: "success",
          title: "Cập nhật thành công",
          text: "Thông tin người dùng đã được cập nhật.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Cập nhật thất bại",
          text: res.message || "Đã xảy ra lỗi khi cập nhật.",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống",
        text: "Không thể kết nối đến máy chủ.",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="max-w-6xl mx-auto py-8 md:px-6 flex flex-col md:flex-row gap-8">

        <main className="flex-1 space-y-12">
          <section>
            <h1 className="text-2xl font-semibold mb-6">Thông tin tài khoản</h1>
            <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label htmlFor="fullName" className="sr-only">
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Họ và tên"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                />
                <Pencil className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <label htmlFor="dob" className="sr-only">
                  Ngày sinh
                </label>
                <input
                  id="dob"
                  type="date"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.dob}
                  onChange={handleChange("dob")}
                />
              </div>

              <div className="relative">
                <label htmlFor="phone" className="sr-only">
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Số điện thoại"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.phone}
                  onChange={handleChange("phone")}
                />
                <Pencil className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.email}
                  disabled
                />
                <Pencil className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative md:col-span-2">
                <label htmlFor="address" className="sr-only">
                  Địa chỉ
                </label>
                <input
                  id="address"
                  type="text"
                  placeholder="Địa chỉ"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.address}
                  onChange={handleChange("address")}
                />
                <Pencil className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </section>

          <section>
            <button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg shadow-md transition"
              onClick={handleUpdateInfo}
            >
              Cập nhật thông tin
            </button>
          </section>
        </main>
      </div>
      {loading ?? <Loading text="Đang cập nhật thông tin ..."></Loading> ?? ""}
    </>
  );
};

export default AccountSettings;
