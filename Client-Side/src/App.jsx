import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { checkAuthAction } from "./store/auth-slice";
import usePageMeta from "./hooks/use-page-meta";
import AppLoader from "@/components/ui/AppLoader";

// public layout import
import PublicLayout from "./components/common-components/PublicLayout";

// legal page imports
import PrivacyPolicyPage from "./pages/Legal/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/Legal/TermsConditionsPage";
import RefundPolicyPage from "./pages/Legal/RefundPolicyPage";
import DeliveryPolicyPage from "./pages/Legal/DeliveryPolicyPage";
import ContactPage from "./pages/Legal/ContactPage";
import AboutPage from "./pages/Legal/AboutPage";
import OffersPage from "./pages/user/OffersPage";
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
import PermissionGuard from "./components/admin-components/PermissionGuard";
import AdminDashboard from "./pages/admin-view/Dashboard";
import AdminFeatures from "./pages/admin-view/Features";
import AdminOffers from "./pages/admin-view/Offers";
import AdminCoupons from "./pages/admin-view/Coupons";
import AdminCollections from "./pages/admin-view/Collections";
import AdminMediaLibrary from "./pages/admin-view/MediaLibrary";
import AdminOrders from "./pages/admin-view/Orders";
import GiftManager from "./pages/admin-view/GiftManager";
import AdminProduct from "./pages/admin-view/Product";
import AdminDrops from "./pages/admin-view/Drops";
import DropAnalytics from "./pages/admin-view/DropAnalytics";
import AdminAnalytics from "./pages/admin-view/Analytics";
import AdminHomeImages from "./pages/admin-view/HomeImages";
import NotificationsManager from "./pages/admin-view/NotificationsManager";
import PendingPaymentsPage from "./pages/admin-view/PendingPaymentsPage";
import PaymentVerificationPage from "./pages/admin-view/PaymentVerificationPage";
import AdminUsers from "./pages/admin-view/Users";
import SuperAdminDashboard from "./pages/admin-view/SuperAdminDashboard";
import ReviewModerationPage from "./pages/admin-view/ReviewModerationPage";
import AboutSiteConfig from "./pages/admin-view/AboutSiteConfig";
import ContactInquiriesPage from "./pages/admin-view/ContactInquiriesPage";
import NewsletterSubscribersPage from "./pages/admin-view/NewsletterSubscribersPage";
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
  const matchedMeta = ROUTE_META.find((entry) =>
    entry.match.test(location.pathname)
  );

  usePageMeta({
    title: matchedMeta?.title || "Page Not Found",
    description:
      "Saga Elite limited-edition streetwear and customer experience platform.",
  });

  return null;
};

function App() {
  const { isAuthenticated, user, isLoading } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();

  const ADMIN_ROLES = ["admin", "super_admin", "superadmin", "sub_admin"];
  const defaultAuthenticatedRoute = ADMIN_ROLES.includes(
    String(user?.role || "").toLowerCase()
  )
    ? "/admin/dashboard"
    : "/shopping/home";

  useEffect(() => {
    const hasLocalToken =
      typeof window !== "undefined" && Boolean(localStorage.getItem("authToken"));
    const hasCookieToken =
      typeof document !== "undefined" && document.cookie.includes("token=");

    if (hasLocalToken || hasCookieToken) {
      dispatch(checkAuthAction());
    }
  }, [dispatch]);

  useEffect(() => {
    const applyTheme = (isDark) => {
      document.documentElement.classList.toggle("dark", isDark);
    };
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(mq.matches);
    const handler = (e) => applyTheme(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isLoading) {
    return <AppLoader message="Opening the atelier" />;
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
                isAuthenticated ? (
                  <Navigate to={defaultAuthenticatedRoute} replace />
                ) : (
                  <Home />
                )
              }
            />

            <Route path="/legal/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/legal/terms-and-conditions" element={<TermsConditionsPage />} />
            <Route path="/legal/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/legal/delivery-policy" element={<DeliveryPolicyPage />} />
            <Route path="/offers" element={<OffersPage />} />
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
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
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
            <Route path="home-images" element={<PermissionGuard permission="products"><AdminHomeImages /></PermissionGuard>} />
            <Route path="feature" element={<PermissionGuard permission="products"><AdminFeatures /></PermissionGuard>} />
            <Route path="offers-management" element={<PermissionGuard permission="products"><AdminOffers /></PermissionGuard>} />
            <Route path="offers" element={<PermissionGuard permission="products"><AdminOffers /></PermissionGuard>} />
            <Route path="coupons" element={<PermissionGuard permission="sendCampaigns"><AdminCoupons /></PermissionGuard>} />
            <Route path="collections" element={<PermissionGuard permission="products"><AdminCollections /></PermissionGuard>} />
            <Route path="media" element={<PermissionGuard permission="products"><AdminMediaLibrary /></PermissionGuard>} />
            <Route path="order" element={<PermissionGuard permission="orders"><AdminOrders /></PermissionGuard>} />
            <Route path="gifts" element={<PermissionGuard permission="products"><GiftManager /></PermissionGuard>} />
            <Route path="product" element={<PermissionGuard permission="products"><AdminProduct /></PermissionGuard>} />
            <Route path="users" element={<PermissionGuard permission="users"><AdminUsers /></PermissionGuard>} />
            <Route path="super-admin" element={<PermissionGuard superAdminOnly><SuperAdminDashboard /></PermissionGuard>} />
            <Route path="notifications" element={<PermissionGuard permission="notifications"><NotificationsManager /></PermissionGuard>} />
            <Route path="payments/pending" element={<PermissionGuard permission="verifyPayments"><PendingPaymentsPage /></PermissionGuard>} />
            <Route path="manual-payments" element={<PermissionGuard permission="verifyPayments"><PendingPaymentsPage /></PermissionGuard>} />
            <Route path="manual-payments/:paymentId" element={<PermissionGuard permission="verifyPayments"><PaymentVerificationPage /></PermissionGuard>} />
            <Route path="reviews" element={<PermissionGuard permission="manageReviews"><ReviewModerationPage /></PermissionGuard>} />
            <Route path="about-content" element={<PermissionGuard superAdminOnly><AboutSiteConfig /></PermissionGuard>} />
            <Route path="contact-inquiries" element={<ContactInquiriesPage />} />
            <Route path="newsletter" element={<NewsletterSubscribersPage />} />
            <Route path="account" element={<Account />} />
            <Route path="drop" element={<PermissionGuard permission="drops"><AdminDrops /></PermissionGuard>} />
            <Route path="drop-analytics" element={<PermissionGuard permission="analytics"><DropAnalytics /></PermissionGuard>} />
            <Route path="analytics" element={<PermissionGuard permission="analytics"><AdminAnalytics /></PermissionGuard>} />
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
