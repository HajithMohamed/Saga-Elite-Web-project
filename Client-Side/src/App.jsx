import { Route, Routes } from "react-router-dom";
// auth page imports
import Layout from "./components/auth-components/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/register";
// admin page importsw
import AdminLayout from "./components/admin-components/Layout";
import AdminDashboard from "./pages/admin-view/Dashboard";
import AdminFeatures from "./pages/admin-view/Features";
import AdminOrders from "./pages/admin-view/orders";
import AdminProduct from "./pages/admin-view/product";
//shopping page imports
import ShoppinLayout from "./components/shopping-components/Layout";
import NotFound from "./pages/Not-Found/Index";
import Home from "./pages/shopping-view/Home";
import Account from "./pages/shopping-view/Account";
import Checkout from "./pages/shopping-view/Checkout";
import ProductListing from "./pages/shopping-view/ProductListing";
// checking authentication page import
import CheckAuth from "./components/common-components/CheckAuth";

function App() {
  const isAuthenticated = false;
  const user = null;
  return (
    <div>
      <Routes>
        <Route
          path="/auth"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
             <Layout/>
            </CheckAuth>
          }
        >
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
        </Route>
        <Route
          path="/admin"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AdminLayout />
            </CheckAuth>
          }
        >
          {/* child paths should be relative - no leading slash */}
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="feature" element={<AdminFeatures />} />
          <Route path="order" element={<AdminOrders />} />
          <Route path="product" element={<AdminProduct />} />
        </Route>
        <Route
          path="Shopping"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <ShoppinLayout />
            </CheckAuth>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/account" element={<Account />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/product-list" element={<ProductListing />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
