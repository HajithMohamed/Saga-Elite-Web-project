import { loadCart, cartTotals, loadWishlist } from "./demo-state.js";
import { DEMO_DROPS, DEMO_NOTIFICATIONS, DEMO_SESSION } from "./demo-data.js";

const notificationsState = DEMO_NOTIFICATIONS.map((notification) => ({
  ...notification,
  isRead: notification.isRead ?? !notification.unread
}));

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
  const template = document.getElementById("notification-item-template");

  if (!list || !template) {
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
      const fragment = template.content.cloneNode(true);
      const button = fragment.querySelector(".notification-item");
      const icon = fragment.querySelector(".notification-item-icon");
      const title = fragment.querySelector(".notification-item-title");
      const badgeEl = fragment.querySelector(".notification-item-badge");
      const message = fragment.querySelector(".notification-item-message");
      const date = fragment.querySelector(".notification-item-date");

      icon.innerHTML = `<span class="material-symbols-outlined text-[18px]">${notificationIcon(notification.type)}</span>`;
      title.textContent = notification.title;
      message.textContent = notification.message || notification.body || "";
      date.textContent = new Date(notification.createdAt).toLocaleString();

      if (!notification.isRead) {
        badgeEl.classList.remove("hidden");
        button.style.backgroundColor = "#111111";
      } else {
        button.style.backgroundColor = "#090909";
      }

      button.addEventListener("click", () => openNotification(notification.id));
      list.appendChild(fragment);
    });
  }

  const unreadCount = notificationsState.filter((notification) => !notification.isRead).length;
  if (badge) {
    badge.textContent = unreadCount;
    badge.classList.toggle("hidden", unreadCount === 0);
    badge.style.display = unreadCount > 0 ? "inline-flex" : "none";
  }
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

  mobileMenuBtn?.addEventListener("click", () => {
    const isHidden = mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden");
    menuOpenIcon.classList.toggle("hidden", !isHidden);
    menuCloseIcon.classList.toggle("hidden", isHidden);
  });

  userMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    userMenu.classList.toggle("hidden");
    notificationsPanel?.classList.add("hidden");
  });

  notificationsBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
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
  document.getElementById("notifications-refresh")?.addEventListener("click", () => {
    renderNotifications();
  });

  document.getElementById("notification-modal-close")?.addEventListener("click", closeNotificationModal);
  document.getElementById("notification-modal-dismiss")?.addEventListener("click", closeNotificationModal);

  document.getElementById("notification-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "notification-modal") {
      closeNotificationModal();
    }
  });

  document.getElementById("sign-out-btn")?.addEventListener("click", () => {
    const userMenu = document.getElementById("user-menu");
    const feedback = document.getElementById("elite-signup-feedback");
    userMenu?.classList.add("hidden");
    if (feedback) {
      feedback.textContent = "Signed out in demo mode.";
      feedback.classList.remove("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSessionUi();
  setupMenus();
  setupButtons();
  renderNotifications();
  updateHeader();
  updateDropUi();
  window.setInterval(updateDropUi, 1000);
});
