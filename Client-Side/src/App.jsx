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
// auth page imports — login/register are now in the sliding AuthDrawer
import AuthLayout from "./components/auth-components/Layout";
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
const AdminSeoSettings = lazy(() => import("./pages/admin-view/SeoSettings"));
const AdminCommunity = lazy(() => import("./pages/admin-view/CommunityPage"));
const AdminShipping = lazy(() => import("./pages/admin-view/ShippingPage"));
const AdminOrders = lazy(() => import("./pages/admin-view/Orders"));
const GiftManager = lazy(() => import("./pages/admin-view/GiftManager"));
const AdminProduct = lazy(() => import("./pages/admin-view/Product"));
const AdminDrops = lazy(() => import("./pages/admin-view/Drops"));
const DropAnalytics = lazy(() => import("./pages/admin-view/DropAnalytics"));
const AdminAnalytics = lazy(() => import("./pages/admin-view/Analytics"));
const AdminHomeImages = lazy(() => import("./pages/admin-view/HomeImages"));
const NotificationsManager = lazy(() => import("./pages/admin-view/NotificationsManager"));
const PendingPaymentsPage = lazy(() => import("./pages/admin-view/PendingPaymentsPage"));
const PaymentVerificationPage = lazy(() => import("./pages/admin-view/PaymentVerificationPage"));
const AdminUsers = lazy(() => import("./pages/admin-view/Users"));
const SuperAdminDashboard = lazy(() => import("./pages/admin-view/SuperAdminDashboard"));
const ReviewModerationPage = lazy(() => import("./pages/admin-view/ReviewModerationPage"));
const Recommendations = lazy(() => import("./pages/admin-view/Recommendations"));
const Alerts = lazy(() => import("./pages/admin-view/Alerts"));
const AboutSiteConfig = lazy(() => import("./pages/admin-view/AboutSiteConfig"));
const ContactInquiriesPage = lazy(() => import("./pages/admin-view/ContactInquiriesPage"));
const NewsletterSubscribersPage = lazy(() => import("./pages/admin-view/NewsletterSubscribersPage"));
const PoliciesManager = lazy(() => import("./pages/admin-view/PoliciesManager"));
const FooterManager = lazy(() => import("./pages/admin-view/FooterManager"));
const AnnouncementBar = lazy(() => import("./pages/admin-view/AnnouncementBar"));
const ContactPageManager = lazy(() => import("./pages/admin-view/ContactPageManager"));
const AdminAccount = lazy(() => import("./pages/admin-view/AdminAccount"));

import ErrorBoundary from "./components/common-components/ErrorBoundary";

// shopping page imports
import ShoppinLayout from "./components/shopping-components/Layout";
import NotFound from "./pages/Not-Found/Index";
import Home from "./pages/shopping-view/Home";
import Account from "./pages/shopping-view/Account";
import Orders from "./pages/shopping-view/Orders";
import MyRewards from "./pages/shopping-view/MyRewards";
import Checkout from "./pages/shopping-view/Checkout";
import ProductListing from "./pages/shopping-view/ProductListing";
import ProductDetails from "./pages/shopping-view/ProductDetails";
import DropDetails from "./pages/shopping-view/DropDetails";
import DropsIndex from "./pages/shopping-view/DropsIndex";
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
import WhatsAppFloatingButton from "./components/common-components/WhatsAppFloatingButton";


const ROUTE_META = [
  { match: /^\/$/, title: "Home" },
  { match: /^\/about$/, title: "About" },
  { match: /^\/contact$/, title: "Contact" },
  { match: /^\/legal\/privacy-policy$/, title: "Privacy Policy" },
  { match: /^\/legal\/terms-and-conditions$/, title: "Terms & Conditions" },
  { match: /^\/legal\/refund-policy$/, title: "Refund Policy" },
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
      <RegisterPromptModal guestToken={guestToken} isAuthenticated={isAuthenticated} />

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
          <Route
            path="/auth"
            element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <AuthLayout />
              </CheckAuth>
            }
          >
            {/* Redirect old direct links to home */}
            <Route index element={<Navigate to="/" replace />} />
            <Route path="login" element={<Navigate to="/" replace />} />
            <Route path="register" element={<Navigate to="/" replace />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="verify-reset-otp" element={<VerifyResetOtp />} />
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
            <Route path="offers" element={<PermissionGuard permission="products"><AdminOffers /></PermissionGuard>} />
            <Route path="coupons" element={<PermissionGuard permission="sendCampaigns"><AdminCoupons /></PermissionGuard>} />
            <Route path="seo" element={<PermissionGuard superAdminOnly><AdminSeoSettings /></PermissionGuard>} />
            <Route path="community" element={<PermissionGuard permission="sendCampaigns"><AdminCommunity /></PermissionGuard>} />
            <Route path="shipping" element={<PermissionGuard permission="manageInventory"><AdminShipping /></PermissionGuard>} />
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
            <Route path="recommendations" element={<PermissionGuard permission="manageReviews"><Recommendations /></PermissionGuard>} />
            <Route path="alerts" element={<PermissionGuard permission="manageReviews"><Alerts /></PermissionGuard>} />
            <Route path="review-insights" element={<Navigate to="/admin/recommendations" replace />} />
            <Route path="about-content" element={<PermissionGuard superAdminOnly><AboutSiteConfig /></PermissionGuard>} />
            <Route path="policies" element={<PermissionGuard superAdminOnly><PoliciesManager /></PermissionGuard>} />
            <Route path="footer" element={<PermissionGuard superAdminOnly><FooterManager /></PermissionGuard>} />
            <Route path="announcement" element={<PermissionGuard superAdminOnly><AnnouncementBar /></PermissionGuard>} />
            <Route path="contact-content" element={<PermissionGuard superAdminOnly><ContactPageManager /></PermissionGuard>} />
            <Route path="contact-inquiries" element={<ContactInquiriesPage />} />
            <Route path="newsletter" element={<NewsletterSubscribersPage />} />
            <Route path="account" element={<AdminAccount />} />
            <Route path="drop" element={<PermissionGuard permission="drops"><AdminDrops /></PermissionGuard>} />
            <Route path="drop-analytics" element={<PermissionGuard permission="viewAnalytics"><DropAnalytics /></PermissionGuard>} />
            <Route path="analytics" element={<PermissionGuard permission="viewAnalytics"><AdminAnalytics /></PermissionGuard>} />
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
            <Route path="rewards" element={<MyRewards />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="product-list" element={<ProductListing />} />
            <Route path="product/:slug" element={<ProductDetails />} />
            <Route path="drops" element={<DropsIndex />} />
            <Route path="drop/:slug" element={<DropDetails />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="checkout-success" element={<OrderSuccess />} />
            <Route path="manual-payment" element={<ManualPaymentPage />} />
            <Route path="manual-payment/:paymentSlug" element={<ManualPaymentPage />} />
            <Route path="card-payment/:orderId" element={<CardPaymentPage />} />
            <Route path="find-payment" element={<FindPaymentPage />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="for-you" element={<ForYou />} />
            <Route path="order-tracking" element={<OrderTracking />} />
            <Route path="account/my-reviews" element={<MyReviewsPage />} />
          </Route>

          {/* OTHER */}
          <Route path="/un-auth-page" element={<UnauthPage />} />
          <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>

        <WhatsAppFloatingButton />
      </ErrorBoundary>
    </div>
  );
}

export default App;
