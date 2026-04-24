import { loadCart, cartTotals, loadWishlist } from "./demo-state.js";
import { DEMO_DROPS, DEMO_NOTIFICATIONS, DEMO_SESSION } from "./demo-data.js";

const NOTIFICATION_STATE_KEY = "saga-demo-notification-state";

function loadNotificationState() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STATE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function saveNotificationState(list) {
  localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(list));
}

const notificationsState = DEMO_NOTIFICATIONS.map((notification) => ({
  ...notification,
  isRead: notification.isRead ?? !notification.unread
}));

const persistedNotifications = loadNotificationState();
if (Array.isArray(persistedNotifications) && persistedNotifications.length > 0) {
  notificationsState.splice(
    0,
    notificationsState.length,
    ...persistedNotifications.map((notification) => ({
      ...notification,
      isRead: notification.isRead ?? !notification.unread
    }))
  );
}

let menusBound = false;
let buttonsBound = false;

const SHARED_HEADER_TEMPLATE = `
  <header class="fixed top-0 z-40 w-full border-b border-[#D4AF37]/20 bg-black/95 text-white shadow-sm backdrop-blur-xl">
    <div class="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
      <div class="flex items-center md:hidden">
        <button id="mobile-menu-btn" type="button" class="text-[#D4AF37] transition-colors hover:text-white" aria-label="Toggle menu">
          <svg id="mobile-menu-open-icon" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <svg id="mobile-menu-close-icon" class="hidden h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <a href="index.html" class="flex items-center gap-3">
        <img src="LOGO.png" alt="Saga Elite Logo" class="h-12 w-12 rounded-md object-cover" />
        <div class="hidden flex-col md:flex">
          <span class="text-xl font-bold uppercase tracking-widest text-[#D4AF37]">Saga Elite</span>
          <span class="text-[10px] uppercase tracking-[0.2em] text-gray-400">Rare Fit Forever</span>
        </div>
      </a>

      <nav class="hidden items-center gap-8 text-sm font-medium uppercase tracking-widest md:flex">
        <a data-nav="index.html" href="index.html" class="transition-colors hover:text-[#D4AF37]">Home</a>
        <a data-nav="product-listing.html" href="product-listing.html" class="transition-colors hover:text-[#D4AF37]">Products</a>
        <a href="product-listing.html?category=drops" class="transition-colors hover:text-[#D4AF37]">Drops</a>
      </nav>

      <div class="flex items-center gap-6">
        <div class="relative" id="notifications-root">
          <button id="notifications-btn" type="button" class="relative p-2 text-gray-400 transition-colors hover:text-white" aria-label="Notifications">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"></path>
              <path d="M9 17a3 3 0 0 0 6 0"></path>
            </svg>
            <span id="notifications-badge" class="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"></span>
          </button>
          <div id="notifications-panel" class="absolute right-0 z-50 mt-2 hidden max-h-[420px] min-w-[24rem] overflow-hidden rounded-2xl border border-gray-800 bg-[#0b0b0b] text-white shadow-2xl">
            <div class="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <div>
                <p class="text-sm font-semibold">Notifications</p>
                <p class="text-xs text-gray-400">Recent activity and alerts</p>
              </div>
              <button id="notifications-refresh" type="button" class="text-xs uppercase text-[#D4AF37] transition-colors hover:text-white">Refresh</button>
            </div>
            <div id="notifications-list" class="max-h-[360px] divide-y divide-gray-800 overflow-y-auto custom-scrollbar"></div>
          </div>
        </div>

        <a href="#" class="relative text-white transition-colors hover:text-[#D4AF37]" aria-label="Wishlist">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m12 21-1.45-1.32C5.4 15 2 11.92 2 8.1 2 5.02 4.42 2.6 7.5 2.6c1.74 0 3.41.81 4.5 2.09A6.05 6.05 0 0 1 16.5 2.6C19.58 2.6 22 5.02 22 8.1c0 3.82-3.4 6.9-8.55 11.58Z"></path>
          </svg>
          <span class="wishlist-count absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-black"></span>
        </a>

        <a href="cart.html" class="relative text-white transition-colors hover:text-[#D4AF37]" aria-label="Cart">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.8 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 6H6"></path>
          </svg>
          <span class="cart-count absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-black"></span>
        </a>

        <div class="relative" id="user-menu-root">
          <button id="user-menu-btn" type="button" class="text-white transition-colors hover:text-[#D4AF37] focus:outline-none" aria-label="User menu">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21a8 8 0 1 0-16 0"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          <div id="user-menu" class="absolute right-0 z-50 mt-3 hidden w-52 divide-y divide-[#D4AF37]/10 rounded border border-[#D4AF37]/20 bg-[#0a0a0a] shadow-xl">
            <div class="px-4 py-3">
              <p class="text-xs uppercase tracking-widest text-gray-500">Signed in as</p>
              <p id="user-menu-email" class="mt-0.5 truncate text-sm font-medium text-white"></p>
            </div>
            <div class="py-1">
              <a id="user-admin-link" href="admin-dashboard.html" class="hidden items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-[#D4AF37]">
                <span class="material-symbols-outlined text-[18px]">shield_person</span>
                Admin Panel
              </a>
              <a href="#" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-[#D4AF37]">
                <span class="material-symbols-outlined text-[18px]">settings</span>
                My Account
              </a>
              <button id="sign-out-btn" type="button" class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-red-400">
                <span class="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="mobile-menu" class="hidden border-t border-[#D4AF37]/10 bg-[#0a0a0a] px-6 py-4 text-sm font-medium uppercase tracking-widest md:hidden">
      <div class="flex flex-col gap-4">
        <a href="index.html" class="transition-colors hover:text-[#D4AF37]">Home</a>
        <a href="product-listing.html" class="transition-colors hover:text-[#D4AF37]">Products</a>
        <a href="product-listing.html?category=drops" class="transition-colors hover:text-[#D4AF37]">Drops</a>
        <a id="mobile-admin-link" href="admin-dashboard.html" class="hidden transition-colors hover:text-[#D4AF37]">Admin Panel</a>
      </div>
    </div>
  </header>
`;

const NOTIFICATION_MODAL_TEMPLATE = `
  <div id="notification-modal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div class="relative w-full max-w-md rounded-2xl border border-gray-800 bg-[#0b0b0b] shadow-2xl">
      <button id="notification-modal-close" type="button" class="absolute right-4 top-4 text-gray-400 transition-colors hover:text-white" aria-label="Close notification">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="p-6">
        <div class="mb-4 flex items-center gap-3">
          <span id="notification-modal-icon" class="rounded-full border border-gray-800 bg-[#111111] p-2 text-[#D4AF37]"></span>
          <h3 id="notification-modal-title" class="pr-6 text-lg font-semibold text-white"></h3>
        </div>
        <p id="notification-modal-message" class="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-300"></p>
        <div class="flex items-center justify-between text-xs uppercase tracking-wider text-gray-500">
          <span id="notification-modal-date"></span>
          <button id="notification-modal-dismiss" type="button" class="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-white transition-colors hover:bg-[#1a1a1a]">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
`;

function ensureNotificationModal() {
  if (document.getElementById("notification-modal")) {
    return;
  }
  document.body.insertAdjacentHTML("beforeend", NOTIFICATION_MODAL_TEMPLATE);
}

export function renderNav({ activePath = "", mode = "shopping" } = {}) {
  const rootHeader = document.getElementById("root-header");
  if (!rootHeader) {
    return;
  }

  rootHeader.innerHTML = SHARED_HEADER_TEMPLATE;
  menusBound = false;
  buttonsBound = false;
  ensureNotificationModal();

  if (activePath) {
    const activeLink = rootHeader.querySelector(`[data-nav="${activePath}"]`);
    if (activeLink) {
      activeLink.classList.add("text-[#D4AF37]");
    }
  }

  const hideInAdmin = mode === "admin";
  if (hideInAdmin) {
    rootHeader.querySelectorAll('a[href="cart.html"], .wishlist-count, #notifications-root').forEach((node) => {
      const wrapper = node.closest("a") || node;
      wrapper.classList.add("hidden");
    });
  }

  setupSessionUi();
  setupMenus();
  setupButtons();
  renderNotifications();
  updateHeader();
  updateDropUi();
}

export function computeCountdown(targetDate) {
  if (!targetDate) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  const diff = targetDate - new Date();
  if (diff <= 0) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  return {
    days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
    hours: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
    minutes: String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, "0"),
    seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, "0")
  };
}

export function getUpcomingDrops() {
  return [...DEMO_DROPS]
    .filter((drop) => new Date(drop.releaseDate) > new Date())
    .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
}

export function getNextDrop() {
  return getUpcomingDrops()[0] || null;
}

function notificationIcon(type) {
  switch (type) {
    case "drop":
      return "schedule";
    case "offer":
      return "warning";
    case "order":
      return "check_circle";
    default:
      return "notifications";
  }
}

function renderNotifications() {
  const list = document.getElementById("notifications-list");
  const badge = document.getElementById("notifications-badge");

  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (notificationsState.length === 0) {
    const empty = document.createElement("div");
    empty.className = "px-4 py-6 text-sm text-gray-400";
    empty.textContent = "No notifications yet.";
    list.appendChild(empty);
  } else {
    notificationsState.forEach((notification) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "notification-item w-full bg-[#111111] px-4 py-4 text-left transition-colors hover:bg-[#1f1f1f]";
      button.innerHTML = `
        <div class="flex items-start gap-3">
          <span class="notification-item-icon mt-1 text-[#D4AF37]">
            <span class="material-symbols-outlined text-[18px]">${notificationIcon(notification.type)}</span>
          </span>
          <div class="min-w-0">
            <div class="flex items-center justify-between gap-3">
              <span class="notification-item-title text-sm font-semibold text-white">${notification.title}</span>
              <span class="notification-item-badge ${notification.isRead ? "hidden" : ""} rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black">New</span>
            </div>
            <p class="notification-item-message mt-1 line-clamp-2 text-sm text-gray-400">${notification.message || notification.body || ""}</p>
            <p class="notification-item-date mt-2 text-[11px] uppercase tracking-[0.24em] text-gray-500">${new Date(notification.createdAt).toLocaleString()}</p>
          </div>
        </div>
      `;
      button.style.backgroundColor = notification.isRead ? "#090909" : "#111111";
      button.addEventListener("click", () => openNotification(notification.id));
      list.appendChild(button);
    });
  }

  const unreadCount = notificationsState.filter((notification) => !notification.isRead).length;
  if (badge) {
    badge.textContent = unreadCount;
    badge.classList.toggle("hidden", unreadCount === 0);
    badge.style.display = unreadCount > 0 ? "inline-flex" : "none";
  }

  saveNotificationState(notificationsState);
}

function openNotification(notificationId) {
  const modal = document.getElementById("notification-modal");
  const title = document.getElementById("notification-modal-title");
  const message = document.getElementById("notification-modal-message");
  const date = document.getElementById("notification-modal-date");
  const icon = document.getElementById("notification-modal-icon");
  const panel = document.getElementById("notifications-panel");

  const notification = notificationsState.find((item) => item.id === notificationId);
  if (!notification || !modal || !title || !message || !date || !icon) {
    return;
  }

  notification.isRead = true;
  title.textContent = notification.title;
  message.textContent = notification.message || notification.body || "";
  date.textContent = new Date(notification.createdAt).toLocaleString();
  icon.innerHTML = `<span class="material-symbols-outlined text-[18px]">${notificationIcon(notification.type)}</span>`;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (panel) {
    panel.classList.add("hidden");
  }
  renderNotifications();
}

function closeNotificationModal() {
  const modal = document.getElementById("notification-modal");
  if (!modal) {
    return;
  }
  modal.classList.remove("flex");
  modal.classList.add("hidden");
}

function updateDropUi() {
  const nextDrop = getNextDrop();
  const topBanner = document.getElementById("top-drop-banner");
  const topDropName = document.getElementById("top-drop-name");
  const bannerTimer = document.getElementById("drop-banner-timer");
  const footerLoading = document.getElementById("footer-drop-loading");
  const footerCountdown = document.getElementById("footer-drop-countdown");
  const footerTimer = document.getElementById("footer-drop-timer");

  if (!nextDrop) {
    topBanner?.classList.add("hidden");
    footerLoading?.classList.add("hidden");
    footerCountdown?.classList.add("hidden");
    return;
  }

  const countdown = computeCountdown(new Date(nextDrop.releaseDate));
  if (topBanner && topDropName && bannerTimer) {
    topDropName.textContent = nextDrop.name.toUpperCase();
    bannerTimer.textContent = `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
    topBanner.classList.remove("hidden");
  }

  if (footerLoading && footerCountdown && footerTimer) {
    footerLoading.classList.add("hidden");
    footerTimer.textContent = `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;
    footerCountdown.classList.remove("hidden");
  }
}

export function updateHeader() {
  const totals = cartTotals(loadCart());
  const wishlist = loadWishlist();

  document.querySelectorAll(".cart-count").forEach((element) => {
    element.textContent = totals.count;
    element.classList.toggle("hidden", totals.count === 0);
    element.style.display = totals.count > 0 ? "flex" : "none";
  });

  document.querySelectorAll(".wishlist-count").forEach((element) => {
    element.textContent = wishlist.length;
    element.classList.toggle("hidden", wishlist.length === 0);
    element.style.display = wishlist.length > 0 ? "flex" : "none";
  });
}

function setupMenus() {
  if (menusBound) {
    return;
  }

  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuOpenIcon = document.getElementById("mobile-menu-open-icon");
  const menuCloseIcon = document.getElementById("mobile-menu-close-icon");
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userMenu = document.getElementById("user-menu");
  const notificationsBtn = document.getElementById("notifications-btn");
  const notificationsPanel = document.getElementById("notifications-panel");
  const notificationsRoot = document.getElementById("notifications-root");
  const userMenuRoot = document.getElementById("user-menu-root");

  if (!mobileMenuBtn || !mobileMenu || !menuOpenIcon || !menuCloseIcon || !userMenuBtn || !notificationsBtn) {
    return;
  }

  mobileMenuBtn.addEventListener("click", () => {
    const isHidden = mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden");
    menuOpenIcon.classList.toggle("hidden", !isHidden);
    menuCloseIcon.classList.toggle("hidden", isHidden);
  });

  userMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    userMenu.classList.toggle("hidden");
    notificationsPanel?.classList.add("hidden");
  });

  notificationsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!notificationsPanel) {
      return;
    }
    notificationsPanel.classList.toggle("hidden");
    userMenu?.classList.add("hidden");
  });

  document.addEventListener("click", (event) => {
    if (userMenuRoot && !userMenuRoot.contains(event.target)) {
      userMenu?.classList.add("hidden");
    }

    if (notificationsRoot && !notificationsRoot.contains(event.target)) {
      notificationsPanel?.classList.add("hidden");
    }
  });

  menusBound = true;
}

function setupSessionUi() {
  const email = document.getElementById("user-menu-email");
  const adminLink = document.getElementById("user-admin-link");
  const mobileAdminLink = document.getElementById("mobile-admin-link");
  const footerYear = document.getElementById("footer-year");
  const user = DEMO_SESSION.user;

  if (email) {
    email.textContent = user.email || "Guest";
  }

  const isAdmin = user.role === "admin";
  if (adminLink) {
    adminLink.classList.toggle("hidden", !isAdmin);
    adminLink.classList.toggle("flex", isAdmin);
  }
  if (mobileAdminLink) {
    mobileAdminLink.classList.toggle("hidden", !isAdmin);
  }
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
}

function setupButtons() {
  if (buttonsBound) {
    return;
  }

  const notificationsRefresh = document.getElementById("notifications-refresh");
  const modalClose = document.getElementById("notification-modal-close");
  const modalDismiss = document.getElementById("notification-modal-dismiss");
  const modal = document.getElementById("notification-modal");
  const signOutBtn = document.getElementById("sign-out-btn");

  if (!notificationsRefresh || !modalClose || !modalDismiss || !modal || !signOutBtn) {
    return;
  }

  notificationsRefresh.addEventListener("click", () => {
    renderNotifications();
  });

  modalClose.addEventListener("click", closeNotificationModal);
  modalDismiss.addEventListener("click", closeNotificationModal);

  modal.addEventListener("click", (event) => {
    if (event.target.id === "notification-modal") {
      closeNotificationModal();
    }
  });

  signOutBtn.addEventListener("click", () => {
    const userMenu = document.getElementById("user-menu");
    const feedback = document.getElementById("elite-signup-feedback");
    userMenu?.classList.add("hidden");
    if (feedback) {
      feedback.textContent = "Signed out in demo mode.";
      feedback.classList.remove("hidden");
    }
  });

  buttonsBound = true;
}

document.addEventListener("DOMContentLoaded", () => {
  ensureNotificationModal();
  setupSessionUi();
  setupMenus();
  setupButtons();
  renderNotifications();
  updateHeader();
  updateDropUi();
  window.setInterval(updateDropUi, 1000);
});
