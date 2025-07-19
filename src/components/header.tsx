
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/image/logo.png";
import Bag from "../assets/image/bag.svg";
import BagDark from "../assets/image/bag-dark.svg";
import { UserOutlined } from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext ";
import Avatar from "antd/es/avatar";
import Popover from "antd/es/popover";
import Search from "../components/search";
import { useQuery } from "@tanstack/react-query";
import { cartService } from "../services/cart.service";
import { useCart } from "../auth/CartContext";

interface HeaderProps {
  isHome: boolean;
  isPage: string;
}

const Header: React.FC<HeaderProps> = ({ isHome, isPage }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { cartCount, updateCartCount } = useCart();

  const { data: cartData, refetch } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.getCart,
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (cartData) {
      updateCartCount(cartData);
    } else {
      const cartCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("cart="))
        ?.split("=")[1];
      if (cartCookie) {
        const cartItems: any[] = JSON.parse(decodeURIComponent(cartCookie));
        updateCartCount({ cart: cartItems, success: true });
      } else {
        updateCartCount({ cart: [], success: true });
      }
    }
  }, [cartData, updateCartCount]);

  useEffect(() => {
    const handleCartUpdate = () => {
      refetch();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [refetch]);

  const popoverContent = (
    <div className="min-w-[180px]">
      <p className="text-center">
        <a href="/user/info" className="text-sm">
          Thông tin tài khoản
        </a>
      </p>
      <p className="text-center">
        <a href="/user/order" className="text-sm">
          Đơn hàng của tôi
        </a>
      </p>
      {/* <p className="text-center">
        <a href="/user/changepassword" className="text-sm mb-4">
          Đổi mật khẩu
        </a>
      </p> */}
      <p className="text-sm text-center" onClick={logout}>
        Đăng xuất
      </p>
    </div>
  );

  useEffect(() => {
    if (location.pathname !== "/") return;

    const handleScroll = () => {
      const header = document.querySelector("header");
      if (header) {
        if (window.scrollY > 200) {
          header.classList.remove("active");
          header.classList.add("header-fixed");
        } else {
          header.classList.add("active");
          header.classList.remove("header-fixed");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  console.log("user", user);


  return (
    <header className={isHome ? "active" : ""}>
      <div className="container mx-auto">
        <div className="flex">
          <a href="/" className="w-4/12">
            <img src={Logo} alt="" className="logo" />
          </a>
          <ul className="ul-menu w-8/12">
            <li>
              <Link to="/" className={isPage === "/" ? "active" : ""}>
                Trang chủ
              </Link>
            </li>
            <li>
              <a href="">Giới thiệu</a>
            </li>
            <li>
              <a href="/products">Sản phẩm</a>
            </li>
            <li>
              <a href="/blogs">Tin tức</a>
            </li>
            <li>
              <a href="">Liên hệ</a>
            </li>
            <li className="right-item">
              <Search />
              <div className="header-icon">
                <a href="/cart" className="cart-icon" data-count={cartCount || 0}>
                  <img src={Bag} className="bag-light" />
                  <img src={BagDark} className="bag-dark" />
                </a>
              </div>
              <div className="header-icon">
                {user ? (
                  <Popover
                    content={popoverContent}
                    trigger="click"
                    className="cursor-pointer"
                    placement="bottomRight"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="avatar"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Avatar
                        size={32}
                        style={{
                          backgroundColor: "#7265e6",
                          verticalAlign: "middle",
                        }}
                      >
                        {user?.fullName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    )}
                  </Popover>
                ) : (
                  <a href="/login">
                    <UserOutlined />
                  </a>
                )}
              </div>

            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;