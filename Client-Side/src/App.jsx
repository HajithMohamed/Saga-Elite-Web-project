import { Route, Routes, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

// auth page imports
import AuthLayout from "./components/auth-components/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";


// admin page imports
import AdminLayout from "./components/admin-components/Layout";
import AdminDashboard from "./pages/admin-view/Dashboard";
import AdminFeatures from "./pages/admin-view/Features";
import AdminOrders from "./pages/admin-view/Orders";
import AdminProduct from "./pages/admin-view/Product";

// shopping page imports
import ShoppinLayout from "./components/shopping-components/Layout";
import NotFound from "./pages/Not-Found/Index";
import Home from "./pages/shopping-view/Home";
import Account from "./pages/shopping-view/Account";
import Checkout from "./pages/shopping-view/Checkout";
import ProductListing from "./pages/shopping-view/ProductListing";

// unauthorized page (access control)
import UnauthPage from "./pages/unauth-page/UnauthPage";

// checking authentication page import
import CheckAuth from "./components/common-components/CheckAuth";
import VerifyOtp from "./pages/auth/VerifyOtp";

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <div>
      <Routes>
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
          <Route path="feature" element={<AdminFeatures />} />
          <Route path="order" element={<AdminOrders />} />
          <Route path="product" element={<AdminProduct />} />
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
          <Route path="home" element={<Home />} />
          <Route path="account" element={<Account />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="product-list" element={<ProductListing />} />
        </Route>

        {/* OTHER ROUTES */}
        <Route path="/un-auth-page" element={<UnauthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;