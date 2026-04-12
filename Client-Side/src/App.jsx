import { Route, Routes, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { checkAuthAction } from "./store/auth-slice";
import { Loader2 } from "lucide-react";

// auth page imports
import AuthLayout from "./components/auth-components/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyResetOtp from "./pages/auth/VerifyResetOtp";
import SetNewPassword from "./pages/auth/SetNewPassword";


// admin page imports
import AdminLayout from "./components/admin-components/Layout";
import AdminDashboard from "./pages/admin-view/Dashboard";
import AdminFeatures from "./pages/admin-view/Features";
import AdminOrders from "./pages/admin-view/Orders";
import AdminProduct from "./pages/admin-view/Product";
import AdminDrops from "./pages/admin-view/Drops";
import AdminHomeImages from "./pages/admin-view/HomeImages";


// shopping page imports
import ShoppinLayout from "./components/shopping-components/Layout";
import NotFound from "./pages/Not-Found/Index";
import Home from "./pages/shopping-view/Home";
import Account from "./pages/shopping-view/Account";
import Checkout from "./pages/shopping-view/Checkout";
import ProductListing from "./pages/shopping-view/ProductListing";
import ProductDetails from "./pages/shopping-view/ProductDetails";

// unauthorized page (access control)
import UnauthPage from "./pages/unauth-page/UnauthPage";

// checking authentication page import
import CheckAuth from "./components/common-components/CheckAuth";
import VerifyOtp from "./pages/auth/VerifyOtp";


function App() {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthAction());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* AUTH ROUTES */}
        <Route
          path="/auth"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AuthLayout />
            </CheckAuth>
          }
        >
          <Route index element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password-otp" element={<VerifyResetOtp />} />
          <Route path="set-new-password" element={<SetNewPassword />} />
          <Route path="verify-otp" element={<VerifyOtp/>}/>
        </Route>

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AdminLayout />
            </CheckAuth>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="home-images" element={<AdminHomeImages />} />
          <Route path="feature" element={<AdminFeatures />} />
          <Route path="order" element={<AdminOrders />} />
          <Route path="product" element={<AdminProduct />} />
          <Route path="account" element={<Account />} />
          <Route path="drop" element={<AdminDrops/>}/>
        </Route>

        {/* SHOPPING ROUTES */}
        <Route
          path="/shopping"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <ShoppinLayout />
            </CheckAuth>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="account" element={<Account />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="product-list" element={<ProductListing />} />
          <Route path="product/:slug" element={<ProductDetails />} />
        </Route>

        {/* OTHER ROUTES */}
        <Route path="/un-auth-page" element={<UnauthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;