import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, lazy, Suspense } from "react";
import { checkAuthAction } from "./store/auth-slice";
import usePageMeta from "./hooks/use-page-meta";
import { useLenis } from "./hooks/use-lenis";
import { useGuestId } from "./hooks/use-guest-id";
import useTracker from "./hooks/useTracker";
import AppLoader from "@/components/ui/AppLoader";
import RegisterPromptModal from "./components/common-components/RegisterPromptModal";
import ScrollToTop from "./components/common-components/ScrollToTop";

// public layout import
import PublicLayout from "./components/common-components/PublicLayout";

// legal page imports
import PrivacyPolicyPage from "./pages/Legal/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/Legal/TermsConditionsPage";
import RefundPolicyPage from "./pages/Legal/RefundPolicyPage";
import DeliveryPolicyPage from "./pages/Legal/DeliveryPolicyPage";
import ContactPage from "./pages/Legal/ContactPage";
import AboutPage from "./pages/Legal/AboutPage";
// Removed conflicting OffersPage import
// auth page imports — login/register are now in the sliding AuthDrawer
// auth page imports — login/register are now in the sliding AuthDrawer
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyResetOtp from "./pages/auth/VerifyResetOtp";
import SetNewPassword from "./pages/auth/SetNewPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";

// Admin shell + permission gate stay eagerly loaded — both are tiny and on
// every admin route. Page components below are code-split (React.lazy) so a
// fresh admin session only downloads the chunk for whichever page is opened.
import AdminLayout from "./components/admin-components/Layout";
import PermissionGuard from "./components/admin-components/PermissionGuard";

const AdminDashboard = lazy(() => import("./pages/admin-view/Dashboard"));
const AdminFeatures = lazy(() => import("./pages/admin-view/Features"));
const AdminOffers = lazy(() => import("./pages/admin-view/Offers"));
const AdminCoupons = lazy(() => import("./pages/admin-view/Coupons"));
const AdminCommunity = lazy(() => import("./pages/admin-view/CommunityPage"));
const AdminShipping = lazy(() => import("./pages/admin-view/ShippingPage"));
const AdminOrders = lazy(() => import("./pages/admin-view/Orders"));
const AdminProduct = lazy(() => import("./pages/admin-view/Product"));
const AdminDrops = lazy(() => import("./pages/admin-view/Drops"));
const PendingPaymentsPage = lazy(() => import("./pages/admin-view/PendingPaymentsPage"));
const PaymentVerificationPage = lazy(() => import("./pages/admin-view/PaymentVerificationPage"));
const AdminUsers = lazy(() => import("./pages/admin-view/Users"));
const SuperAdminDashboard = lazy(() => import("./pages/admin-view/SuperAdminDashboard"));
const ReviewModerationPage = lazy(() => import("./pages/admin-view/ReviewModerationPage"));
const ContactInquiriesPage = lazy(() => import("./pages/admin-view/ContactInquiriesPage"));
const AdminCategoriesList = lazy(() => import("./pages/admin/CategoriesList"));
const AdminAccount = lazy(() => import("./pages/admin-view/AdminAccount"));
const ContentManagement = lazy(() => import("./pages/admin-view/ContentManagement"));

import ErrorBoundary from "./components/common-components/ErrorBoundary";

// shopping page imports
import ShoppinLayout from "./components/shopping-components/Layout";
import CheckoutLayout from "./components/shopping-components/CheckoutLayout";
import NotFound from "./pages/Not-Found/Index";
import Home from "./pages/shopping-view/Home";
import Orders from "./pages/shopping-view/Orders";
import AccountLayout from "./components/shopping-components/AccountLayout";
import DashboardOverview from "./pages/shopping-view/account/DashboardOverview";
import Profile from "./pages/shopping-view/account/Profile";
import Addresses from "./pages/shopping-view/account/Addresses";
import Security from "./pages/shopping-view/account/Security";
import Settings from "./pages/shopping-view/account/Settings";
import MyRewards from "./pages/shopping-view/MyRewards";
import Checkout from "./pages/shopping-view/Checkout";
import ProductListing from "./pages/shopping-view/ProductListing";
import ProductDetails from "./pages/shopping-view/ProductDetails";
import DropsIndex from "./pages/shopping-view/DropsIndex";
import OffersPage from "./pages/shopping-view/OffersPage";
import DropDetails from "./pages/shopping-view/DropDetails";
import ProductReviewsPage from "./pages/ProductReviewsPage";
import MyReviewsPage from "./pages/MyReviewsPage";
import NotificationsPage from "./pages/common/NotificationsPage";
import OrderSuccess from "./pages/shopping-view/OrderSuccess";
import Cart from "./pages/shopping-view/Cart";
import Wishlist from "./pages/shopping-view/Wishlist";
import ForYou from "./pages/shopping-view/ForYou";
import OrderTracking from "./pages/shopping-view/OrderTracking";
import ManualPaymentPage from "./pages/ManualPaymentPage";
import CardPaymentPage from "./pages/CardPaymentPage";
import FindPaymentPage from "./pages/FindPaymentPage";

// unauthorized page
import UnauthPage from "./pages/unauth-page/UnauthPage";

// checking authentication
import CheckAuth from "./components/common-components/CheckAuth";
import SocketBridge from "./components/common-components/SocketBridge";
import MysteryGiftButton from "./components/common-components/MysteryGiftButton";
import MobileBottomNav from "./components/common-components/MobileBottomNav";
import FloatingActions from "./components/common-components/FloatingActions";


const ROUTE_META = [
  { match: /^\/$/, title: "Home" },
  { match: /^\/about$/, title: "About" },
  { match: /^\/contact$/, title: "Contact" },
  { match: /^\/legal\/privacy-policy$/, title: "Privacy Policy" },
  { match: /^\/legal\/terms-and-conditions$/, title: "Terms & Conditions" },
  { match: /^\/legal\/refund-policy$/, title: "Refund Policy" },
  { match: /^\/legal\/delivery-policy$/, title: "Delivery Policy" },
  { match: /^\/auth\/forgot-password$/, title: "Reset Access" },
  { match: /^\/auth\/verify-reset-otp$/, title: "Verify Reset Code" },
  { match: /^\/auth\/reset-password-otp$/, title: "Verify Reset Code" },
  { match: /^\/auth\/set-new-password$/, title: "Set New Password" },
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
  useLenis();
  const { guestToken } = useGuestId();
  useTracker();

  const ADMIN_ROLES = ["admin", "super_admin", "superadmin", "sub_admin"];
  const defaultAuthenticatedRoute = ADMIN_ROLES.includes(
    String(user?.role || "").toLowerCase()
  )
    ? "/admin/dashboard"
    : "/shopping/home";

  useEffect(() => {
    dispatch(checkAuthAction());
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
      <ScrollToTop />
      <RegisterPromptModal guestToken={guestToken} isAuthenticated={isAuthenticated} />
      <FloatingActions />
      <MobileBottomNav />

      <ErrorBoundary>
        <Suspense fallback={<AppLoader />}>
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

            {/* AUTH — login/register removed (now AuthDrawer); keep OTP/reset routes */}
            {/* SHOPPING & AUTHENTICATION */}
            <Route
              path="/"
              element={
                <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                  <ShoppinLayout />
                </CheckAuth>
              }
            >
              {/* Shopping Routes */}
              <Route index element={<Navigate to="shopping/home" replace />} />
              <Route path="shopping/home" element={<Home />} />
              
              <Route element={<AccountLayout />}>
                <Route path="shopping/account" element={<DashboardOverview />} />
                <Route path="shopping/account/orders" element={<Orders />} />
                <Route path="shopping/account/wishlist" element={<Wishlist />} />
                <Route path="shopping/account/addresses" element={<Addresses />} />
                <Route path="shopping/account/profile" element={<Profile />} />
                <Route path="shopping/account/notifications" element={<NotificationsPage />} />
                <Route path="shopping/account/security" element={<Security />} />
                <Route path="shopping/account/settings" element={<Settings />} />
              </Route>
              
              <Route path="shopping/orders" element={<Navigate to="/shopping/account/orders" replace />} />
              <Route path="shopping/wishlist" element={<Navigate to="/shopping/account/wishlist" replace />} />
              <Route path="shopping/notifications" element={<Navigate to="/shopping/account/notifications" replace />} />

              <Route path="shopping/rewards" element={<MyRewards />} />
              <Route path="shopping/cart" element={<Cart />} />
              <Route path="shopping/product-list" element={<ProductListing />} />
              <Route path="shopping/product/:slug" element={<ProductDetails />} />
              <Route path="shopping/drops" element={<DropsIndex />} />
              <Route path="shopping/offers" element={<OffersPage />} />
              <Route path="shopping/drop/:slug" element={<DropDetails />} />
              <Route path="shopping/checkout-success" element={<OrderSuccess />} />
              <Route path="shopping/for-you" element={<ForYou />} />
              <Route path="shopping/order-tracking" element={<OrderTracking />} />
              <Route path="shopping/account/my-reviews" element={<MyReviewsPage />} />
              <Route path="shopping/manual-payment" element={<ManualPaymentPage />} />
              <Route path="shopping/manual-payment/:paymentSlug" element={<ManualPaymentPage />} />
              <Route path="shopping/find-payment" element={<FindPaymentPage />} />
              
              {/* Auth Routes */}
              <Route path="auth/login" element={<Navigate to="/" replace />} />
              <Route path="auth/register" element={<Navigate to="/" replace />} />
              <Route path="auth/forgot-password" element={<ForgotPassword />} />
              <Route path="auth/verify-reset-otp" element={<VerifyResetOtp />} />
              <Route path="auth/reset-password-otp" element={<VerifyResetOtp />} />
              <Route path="auth/set-new-password" element={<SetNewPassword />} />
              <Route path="auth/verify-otp" element={<VerifyOtp />} />
            </Route>

            {/* CHECKOUT FLOW — standalone, no storefront chrome (own secure-checkout
                header only). URLs stay under /shopping/* so existing links work. */}
            <Route
              path="/shopping"
              element={
                <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                  <CheckoutLayout />
                </CheckAuth>
              }
            >
              <Route path="checkout" element={<Checkout />} />
              <Route path="card-payment/:orderId" element={<CardPaymentPage />} />
            </Route>

            {/* OTHER */}
            <Route path="/un-auth-page" element={<UnauthPage />} />
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>

        <MysteryGiftButton />
      </ErrorBoundary>
    </div>
  );
}

export default App;
