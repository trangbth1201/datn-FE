import { Link, useLocation } from "react-router-dom";
import { User, Lock, Package, OutdentIcon } from "lucide-react";
import { ReactNode } from "react";

interface SidebarLinkItemProps {
  to: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
}

const SidebarLinkItem: React.FC<SidebarLinkItemProps> = ({
  to,
  label,
  icon,
  active = false,
}) => (
  <Link
    to={to}
    type="button"
    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition
      ${active ? "bg-blue-600 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
  >
    <div className="flex items-center">
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </div>
  </Link>
);



export const SidebarLink: React.FC = () => {
  const location = useLocation();

  return (
    <>
      <SidebarLinkItem
        to="/user/info"
        label="Tài khoản"
        icon={<User />}
        active={location.pathname === "/user/info"}
      />
      <SidebarLinkItem
        to="/user/changepassword"
        label="Đổi mật khẩu"
        icon={<Lock />}
        active={location.pathname === "/user/changepassword"}
      />
      <SidebarLinkItem
        to="/user/order"
        label="Quản lý đơn hàng"
        icon={<Package />}
        active={location.pathname === "/user/order"}
      />
    </>
  );
};
