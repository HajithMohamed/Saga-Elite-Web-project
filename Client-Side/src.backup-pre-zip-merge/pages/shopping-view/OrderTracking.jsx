import React, { useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "@/store/order-slice";
import { useSocketEvent } from "@/hooks/use-socket-events";

const TRACKING_STEPS = [
  { key: "pending_payment", label: "Awaiting Transfer" },
  { key: "verification_pending", label: "Payment Review" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const formatCurrency = (amount = 0) =>
  Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatStatus = (status = "") =>
  status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const OrderTracking = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentOrder, isLoading, orderError } = useSelector((state) => state.order);

  const orderId = location.state?.orderId || searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  useSocketEvent(
    "order:refresh",
    (payload) => {
      if (!orderId) return;

      if (!payload?.orderId || String(payload.orderId) === String(orderId)) {
        dispatch(fetchOrderById(orderId));
      }
    },
    [dispatch, orderId]
  );

  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-xl rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
            Order Tracking
          </p>
          <h1 className="mt-4 text-3xl font-bold">No order selected</h1>
          <p className="mt-3 text-sm text-gray-400">
            Choose an order from your account history to load its tracking details.
          </p>
          <Link
            to="/shopping/orders"
            className="mt-6 inline-flex rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold uppercase tracking-widest text-black"
          >
            Go to Order History
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent"></div>
          <p className="text-sm tracking-widest text-[#D4AF37]">LOADING ORDER...</p>
        </div>
      </div>
    );
  }

  if (orderError || !currentOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-xl rounded-3xl border border-red-500/20 bg-[#090909] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
            Unable to Load Order
          </p>
          <h1 className="mt-4 text-3xl font-bold">Tracking is unavailable</h1>
          <p className="mt-3 text-sm text-gray-400">
            {orderError || "We could not load that order right now."}
          </p>
          <Link
            to="/shopping/orders"
            className="mt-6 inline-flex rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold uppercase tracking-widest text-black"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const {
    _id,
    items = [],
    shippingAddress,
    contactNumber,
    user,
    status,
    paymentMethod,
    paymentStatus,
    totalAmount,
    createdAt,
  } = currentOrder;

  const isCancelled = status === "cancelled";
  const currentStepIndex = TRACKING_STEPS.findIndex((step) => step.key === status);
  const progressSteps = isCancelled
    ? TRACKING_STEPS.map((step) => ({ ...step, isCompleted: false }))
    : TRACKING_STEPS.map((step, index) => ({
        ...step,
        isCompleted: currentStepIndex >= index,
      }));
  const progressWidth =
    currentStepIndex <= 0 || isCancelled
      ? "0%"
      : `${(currentStepIndex / (TRACKING_STEPS.length - 1)) * 100}%`;

  const heroTitle = isCancelled
    ? "Cancelled."
    : status === "pending_payment"
      ? "Awaiting Transfer."
      : status === "verification_pending"
        ? "Payment Review."
    : status === "delivered"
      ? "Delivered."
      : status === "shipped"
        ? "In Transit."
        : "Processing.";

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-screen-xl px-8 pb-24 pt-24">
        <div className="mb-20 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Tracking Narrative
            </p>
            <h1 className="text-5xl font-extrabold tracking-tighter text-white md:text-7xl">
              {heroTitle}
            </h1>
            <p className="max-w-xl text-sm text-gray-400">
              This page is loaded from your order record in the database and reflects the latest saved order, payment, and item details.
            </p>
          </div>
          <div className="flex flex-col space-y-1 md:items-end">
            <div className="text-sm text-gray-400">Order Reference</div>
            <div className="text-2xl font-bold text-[#D4AF37]">#{_id}</div>
            <div className="text-sm text-gray-500">Placed {formatDate(createdAt)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="space-y-16 lg:col-span-7">
            <div className="rounded-3xl border border-white/5 bg-[#0b0b0b] p-8">
              <div className="relative py-8">
                <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-neutral-800"></div>
                <div
                  className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-[#D4AF37] transition-all duration-700"
                  style={{ width: progressWidth }}
                ></div>
                <div className="relative grid grid-cols-5 gap-2">
                  {progressSteps.map((step) => (
                    <div key={step.key} className="flex flex-col items-center gap-4 text-center">
                      <div
                        className={`z-10 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold uppercase shadow-xl transition-colors duration-500 ${
                          step.isCompleted
                            ? "bg-[#D4AF37] text-black shadow-[#D4AF37]/20"
                            : "bg-neutral-800 text-gray-500"
                        }`}
                      >
                        {step.label.slice(0, 1)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-widest ${
                          step.isCompleted ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 pt-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                    Current Status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatStatus(status)}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                    Payment
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatStatus(paymentStatus)} via {formatStatus(paymentMethod)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#0b0b0b] p-8">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                  Consignment Items
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">Items in this order</h2>
              </div>

              <div className="space-y-6">
                {items.map((item, index) => {
                  const productImg = item.product?.images?.[0]?.url || "/LOGO.png";

                  return (
                    <div
                      key={`${item.variantSku}-${index}`}
                      className="flex gap-4 rounded-2xl border border-white/5 bg-black/30 p-4"
                    >
                      <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-800">
                        <img
                          className="h-full w-full object-cover"
                          src={productImg}
                          alt={item.productName}
                        />
                      </div>
                      <div className="flex-grow">
                        <h5 className="text-sm font-bold text-white">{item.productName}</h5>
                        <p className="mt-1 text-xs text-gray-400">
                          {item.color || "Default"} / {item.size || "Standard"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">
                          SKU {item.variantSku}
                        </p>
                        <div className="mt-3 flex items-end justify-between">
                          <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                          <span className="text-sm font-semibold text-[#D4AF37]">
                            LKR {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-8 rounded-3xl border border-white/5 bg-neutral-900/50 p-10 backdrop-blur-md">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
                  Shipping Destination
                </h4>
                <div className="text-lg font-medium leading-relaxed text-white">
                  {user?.email || "Customer"}
                  <br />
                  <span className="text-gray-300">{shippingAddress}</span>
                  <br />
                  <span className="mt-2 block text-sm text-gray-400">{contactNumber}</span>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/10 pt-8">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
                  Order Summary
                </h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Items Total</span>
                  <span className="text-white">LKR {formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-medium text-[#D4AF37]">Complimentary</span>
                </div>
                <div className="flex justify-between pt-4 text-xl font-black text-white">
                  <span>Total</span>
                  <span>LKR {formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  className="rounded-lg bg-[#D4AF37] py-4 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#eadd99]"
                  onClick={() => {
                    window.location.href = "mailto:support@sagaelite.com";
                  }}
                >
                  Need Help?
                </button>
                <Link
                  to="/shopping/orders"
                  className="flex items-center justify-center rounded-lg border border-white/5 bg-neutral-800 py-4 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-neutral-700"
                >
                  More Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;
