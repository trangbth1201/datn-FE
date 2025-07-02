import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Lock, Package } from 'lucide-react';

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4 flex flex-col gap-4">
            <div className="text-xl font-bold text-gray-800 mb-4">Quản lý</div>
            <nav className="flex flex-col gap-2">
                <NavLink
                    to="/user/info"
                    className={({ isActive }) =>
                        `flex items-center gap-2 p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : ''
                        }`
                    }
                >
                    <User size={20} />
                    <span>Tài khoản</span>
                </NavLink>
                <NavLink
                    to="/user/changepassword"
                    className={({ isActive }) =>
                        `flex items-center gap-2 p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : ''
                        }`
                    }
                >
                    <Lock size={20} />
                    <span>Đổi mật khẩu</span>
                </NavLink>
                <NavLink
                    to="/user/order"
                    className={({ isActive }) =>
                        `flex items-center gap-2 p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : ''
                        }`
                    }
                >
                    <Package size={20} />
                    <span>Quản lý đơn hàng</span>
                </NavLink>
            </nav>
        </aside>
    );
};
