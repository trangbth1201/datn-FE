import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import About from "./pages/About";
import BlogCategory from "./pages/BlogCategory";
import ChangePassword from "./pages/ChangePassword";
import CheckoutLayout from "./pages/CheckoutLayout";
import DetailBlog from "./pages/DetailBlog";
import DetailCart from "./pages/DetailCart";
import DetailOrder from "./pages/DetailOrder";
import DetailProduct from "./pages/DetailProduct";
import { ForgotPassword } from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Order from "./pages/Order";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderDetail from "./pages/OrderDetail";
import OrderReview from "./pages/OrderReview";
import PaymentMethodSelection from "./pages/PaymentMethodSelection";
import ProductCategory from "./pages/ProductCategory";
import Register from "./pages/Register";
import ShippingAddressForm from "./pages/ShippingAddressForm";
import { UserInfo } from "./pages/Userinfo";
import { useSocket } from "./socket/useSocket";
import { Sidebar } from "./components/Sidebar";
import Wallet from "./pages/Wallet";

const App: React.FC = () => {
  useSocket();
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/about" element={<About />} />
        {/* Products */}
        <Route
          path="/products/brand/:brandSlug/category/:categorySlug"
          element={<ProductCategory />}
        />
        <Route path="/products" element={<ProductCategory />} />
        <Route path="/products/:slug" element={<DetailProduct />} />
        <Route path="/cart" element={<DetailCart />} />
        <Route path="/checkout" element={<CheckoutLayout />}>
          <Route index element={<ShippingAddressForm />} />
          <Route path="shipping" element={<ShippingAddressForm />} />
          <Route path="payment" element={<PaymentMethodSelection />} />
          <Route path="review" element={<OrderReview />} />
        </Route>
        <Route
          path="/order/confirmation/:orderId"
          element={<OrderConfirmationPage />}
        />
        {/* Blogs */}
        <Route path="/blogs" element={<BlogCategory />} />
        <Route path="/blogs/detail" element={<DetailBlog />} />
        {/* User Routes with Sidebar */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen w-3/4 mx-auto">
                <Sidebar />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                  <Routes>
                    <Route index element={<UserInfo />} />
                    <Route path="info" element={<UserInfo />} />
                    <Route path="changepassword" element={<ChangePassword />} />
                    <Route path="order" element={<Order />} />
                    <Route path="wallet" element={<Wallet />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        {/* Order Detail without Sidebar */}
        <Route
          path="/order/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/products/detailorder" element={<DetailOrder />} />
      </Route>
    </Routes>
  );
};

export default App;
