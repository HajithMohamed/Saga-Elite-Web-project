import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { checkAuthAction } from "./store/auth-slice";
import { Loader2 } from "lucide-react";
import usePageMeta from "./hooks/use-page-meta";

// public layout import
import PublicLayout from "./components/common-components/PublicLayout";

// legal page imports
import PrivacyPolicyPage from "./pages/Legal/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/Legal/TermsConditionsPage";
import RefundPolicyPage from "./pages/Legal/RefundPolicyPage";
import DeliveryPolicyPage from "./pages/Legal/DeliveryPolicyPage";
import ContactPage from "./pages/Legal/ContactPage";
import AboutPage from "./pages/Legal/AboutPage";

// auth page imports
import AuthLayout from "./components/auth-components/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyResetOtp from "./pages/auth/VerifyResetOtp";
import SetNewPassword from "./pages/auth/SetNewPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";

// admin page imports
import AdminLayout from "./components/admin-components/Layout";
import AdminDashboard from "./pages/admin-view/Dashboard";
import AdminFeatures from "./pages/admin-view/Features";
import AdminOrders from "./pages/admin-view/Orders";
import AdminProduct from "./pages/admin-view/Product";
import AdminDrops from "./pages/admin-view/Drops";
import AdminHomeImages from "./pages/admin-view/HomeImages";
import NotificationsManager from "./pages/admin-view/NotificationsManager";
import PendingPaymentsPage from "./pages/admin/PendingPaymentsPage";
import PaymentVerificationPage from "./pages/Admin/PaymentVerificationPage";
import AdminUsers from "./pages/admin-view/Users";
import SuperAdminDashboard from "./pages/admin-view/SuperAdminDashboard";
import ReviewModerationPage from "./pages/admin-view/ReviewModerationPage";
import ErrorBoundary from "./components/common-components/ErrorBoundary";

// shopping page imports
import ShoppinLayout from "./components/shopping-components/Layout";
import NotFound from "./pages/Not-Found/Index";
import Home from "./pages/shopping-view/Home";
import Account from "./pages/shopping-view/Account";
import Orders from "./pages/shopping-view/Orders";
import Checkout from "./pages/shopping-view/Checkout";
import ProductListing from "./pages/shopping-view/ProductListing";
import ProductDetails from "./pages/shopping-view/ProductDetails";
import DropDetails from "./pages/shopping-view/DropDetails";
import ProductReviewsPage from "./pages/ProductReviewsPage";
import MyReviewsPage from "./pages/MyReviewsPage";
import NotificationsPage from "./pages/common/NotificationsPage";
import OrderSuccess from "./pages/shopping-view/OrderSuccess";
import Cart from "./pages/shopping-view/Cart";
import Wishlist from "./pages/shopping-view/Wishlist";
import OrderTracking from "./pages/shopping-view/OrderTracking";
import ManualPaymentPage from "./pages/ManualPaymentPage";

// unauthorized page
import UnauthPage from "./pages/unauth-page/UnauthPage";

// checking authentication
import CheckAuth from "./components/common-components/CheckAuth";
import SocketBridge from "./components/common-components/SocketBridge";
import WhatsAppFloatingButton from "./components/common-components/WhatsAppFloatingButton";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const isAdminLike = ["admin", "super_admin", "superadmin"].includes(
    String(user?.role || "").toLowerCase(),
  );

  if (adminOnly && !isAdminLike) {
    return <Navigate to="/un-auth-page" replace state={{ from: location }} />;
  }

  return children;
};

const ROUTE_META = [
  { match: /^\/$/, title: "Home" },
  { match: /^\/about$/, title: "About" },
  { match: /^\/contact$/, title: "Contact" },
  { match: /^\/legal\/privacy-policy$/, title: "Privacy Policy" },
  { match: /^\/legal\/terms-and-conditions$/, title: "Terms & Conditions" },
  { match: /^\/legal\/refund-policy$/, title: "Refund Policy" },
];

const RouteMetaManager = () => {
  const location = useLocation();
  const matchedMeta = ROUTE_META.find((entry) => entry.match.test(location.pathname));

  usePageMeta({
    title: matchedMeta?.title || "Page Not Found",
    description: "Saga Elite limited-edition streetwear and customer experience platform.",
  });

  return null;
};

function App() {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const defaultAuthenticatedRoute =
    user?.role === "admin"
      ? "/admin/dashboard"
      : "/shopping/home";

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
      <SocketBridge />
      <RouteMetaManager />

      <ErrorBoundary>
        <Routes>

          {/* PUBLIC */}
          <Route element={<PublicLayout />}>
            <Route
              path="/"
              element={
                isAuthenticated
                  ? <Navigate to={defaultAuthenticatedRoute} replace />
                  : <Home />
              }
            />

            <Route path="/legal/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/legal/terms-and-conditions" element={<TermsConditionsPage />} />
            <Route path="/legal/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/legal/delivery-policy" element={<DeliveryPolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/product/:productId/reviews" element={<ProductReviewsPage />} />

            <Route
              path="/account/my-reviews"
              element={
                <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                  <MyReviewsPage />
                </CheckAuth>
              }
            />
          </Route>

          {/* AUTH */}
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
            <Route path="verify-otp" element={<VerifyOtp />} />
          </Route>

          {/* ADMIN */}
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
            <Route path="users" element={<AdminUsers />} />
            <Route path="super-admin" element={<SuperAdminDashboard />} />

            <Route path="notifications" element={<NotificationsManager />} />

            <Route
              path="payments/pending"
              element={<ProtectedRoute adminOnly><PendingPaymentsPage /></ProtectedRoute>}
            />

            <Route path="manual-payments" element={<PendingPaymentsPage />} />
            <Route path="manual-payments/:paymentId" element={<PaymentVerificationPage />} />
            <Route path="reviews" element={<ReviewModerationPage />} />
            <Route path="account" element={<Account />} />
            <Route path="drop" element={<AdminDrops />} />
          </Route>

          {/* SHOPPING */}
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
            <Route path="orders" element={<Orders />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="product-list" element={<ProductListing />} />
            <Route path="product/:slug" element={<ProductDetails />} />
            <Route path="drop/:slug" element={<DropDetails />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="checkout-success" element={<OrderSuccess />} />
            <Route path="manual-payment" element={<ManualPaymentPage />} />
            <Route path="manual-payment/:paymentSlug" element={<ManualPaymentPage />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="order-tracking" element={<OrderTracking />} />
            <Route path="account/my-reviews" element={<MyReviewsPage />} />
          </Route>

          {/* OTHER */}
          <Route path="/un-auth-page" element={<UnauthPage />} />
          <Route path="*" element={<NotFound />} />

        </Routes>

        <WhatsAppFloatingButton />
      </ErrorBoundary>
    </div>
  );
}

export default App;