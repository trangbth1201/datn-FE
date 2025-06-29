import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import BagDark from '../assets/image/bag-dark.svg';
import Bag from '../assets/image/bag.svg';
import Logo from '../assets/image/logo.png';

import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext ";

import Avatar from "antd/es/avatar";
import Popover from "antd/es/popover";

interface HeaderProps {
  isHome: boolean;
  isPage: string;
}

const Header: React.FC<HeaderProps> = ({ isHome, isPage }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const popoverContent = (
    <div className="min-w-[180px]">
      <p className="text-center ">
        <a href="../user/info" className="text-sm"> Thông tin tài khoản</a>
      </p>
       <p className="text-center">
        <a href="../user/order" className="text-sm"> Đơn hàng của tôi</a>
      </p>
       <p className="text-center">
        <a href="../user/changepassword" className="text-sm mb-4"> Đổi mật khẩu</a>
      </p>
      <p  className="text-sm  text-center" onClick={logout}>
        Đăng xuất
      </p>
    </div>
  );

  useEffect(() => {
    if (location.pathname !== "/") return; // Chỉ áp dụng trên trang chủ

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


  // const popoverContent = (
  //   <div className="min-w-[180px]">
  //     <p className="font-semibold text-center">
  //       <Link className="block" to={"user/info"}>Thông tin tài khoản</Link>
  //       <Link className="block" to={"user/order"}>Đơn hàng của tôi</Link>
  //       <Link className="block" to={"user/changepassword"}>Đổi mật khẩu</Link>
  //     </p>
  //     <Button type="text" danger block onClick={logout}>
  //       Đăng xuất
  //     </Button>
  //   </div>
  // );


  return (
    <header className={isHome ? 'active' : ''}>
      <div className="container mx-auto">
        <div className="flex">
          <a href="/" className="w-4/12">
            <img src={Logo} alt="" className='logo' />
          </a>
          <ul className='ul-menu w-8/12'>
            <li>
              <Link to="/" className={isPage === '/' ? 'active' : ''} >Trang chủ</Link>
            </li>
            <li><a href="">Giới thiệu</a></li>
            <li><a href="/products">Sản phẩm</a></li>
            <li><a href="/blogs">Tin tức</a></li>
            <li><a href="">Liên hệ</a></li>
            <li className='right-item'>
              <div className='header-icon'><a href=""><SearchOutlined /></a></div>
              <div className='header-icon'>
                <a href="/cart" className='cart-icon' data-count="10">
                  <img src={Bag} className="bag-light" />
                  <img src={BagDark} className="bag-dark" />
                </a></div>
              <div className='header-icon'>
                {user ? (
                  <>
                    <Popover
                      content={popoverContent}
                      trigger="click"
                      className="cursor-pointer"
                      placement="bottomRight">
                      <Avatar
                        size={30}
                        src={user?.avatar || undefined}
                        style={{ backgroundColor: "#7265e6", verticalAlign: "middle" }}
                      >
                        {!user?.avatar && user?.fullName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    </Popover>
                  </>
                ) : (
                  <a href="/login"><UserOutlined /></a>
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
