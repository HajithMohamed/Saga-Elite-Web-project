import { DEMO_HOME_ASSETS, DEMO_PRODUCTS } from "./demo-data.js";
import { computeCountdown, getUpcomingDrops } from "./common.js";

const heroImages = DEMO_HOME_ASSETS.heroImages || [];
let currentHeroIndex = 0;

function setHeroImage(index, immediate = false) {
  const heroImage = document.getElementById("hero-image");
  if (!heroImage || heroImages.length === 0) {
    return;
  }

  const nextImage = heroImages[index];
  if (immediate) {
    heroImage.src = nextImage.url;
    return;
  }

  heroImage.style.opacity = "0";
  heroImage.style.transform = "scale(1.05)";
  window.setTimeout(() => {
    heroImage.src = nextImage.url;
  }, 250);
  window.setTimeout(() => {
    heroImage.style.opacity = "0.6";
    heroImage.style.transform = "scale(1)";
  }, 300);
}

function startHeroRotation() {
  if (heroImages.length === 0) {
    return;
  }

  setHeroImage(0, true);
  window.setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
    setHeroImage(currentHeroIndex);
  }, 5000);
}

function setupBranding() {
  const heroLogoImage = document.getElementById("hero-logo-image");
  const heroLogoFallback = document.getElementById("hero-logo-fallback");
  const logoSrc = DEMO_HOME_ASSETS.logoImage?.url;

  if (heroLogoImage && heroLogoFallback) {
    if (logoSrc) {
      heroLogoImage.src = logoSrc;
      heroLogoImage.classList.remove("hidden");
      heroLogoFallback.classList.add("hidden");
    } else {
      heroLogoImage.classList.add("hidden");
      heroLogoFallback.classList.remove("hidden");
    }
  }

  const categoryImages = DEMO_HOME_ASSETS.categoryLogos || {};
  const categoryMap = {
    boys: categoryImages.Boys?.url,
    girls: categoryImages.Girls?.url,
    unisex: categoryImages.Unisex?.url
  };

  Object.entries(categoryMap).forEach(([key, src]) => {
    const element = document.getElementById(`category-image-${key}`);
    if (element && src) {
      element.src = src;
    }
  });

  const ethosImage = document.getElementById("ethos-image");
  if (ethosImage && DEMO_HOME_ASSETS.adImage?.url) {
    ethosImage.src = DEMO_HOME_ASSETS.adImage.url;
  }
}

function renderGridCards() {
  const cardsContainer = document.getElementById("home-grid-cards");
  const status = document.getElementById("home-grid-status");
  const title = document.getElementById("home-grid-title");

  if (!cardsContainer || !status || !title) {
    return;
  }

  cardsContainer.innerHTML = "";
  status.classList.add("hidden");

  const validDrops = getUpcomingDrops().filter((drop) => !drop.endDate || new Date(drop.endDate) > new Date());
  const hasValidDrops = validDrops.length > 0;
  const displayedProducts = DEMO_PRODUCTS.slice(0, 4);

  title.textContent = hasValidDrops ? "Current Drops" : "Latest Arrivals";

  if (hasValidDrops) {
    const template = document.getElementById("drop-card-template");
    validDrops.forEach((drop) => {
      const fragment = template.content.cloneNode(true);
      const link = fragment.querySelector("a");
      const image = fragment.querySelector(".drop-card-image");
      const cardTitle = fragment.querySelector(".drop-card-title");
      const date = fragment.querySelector(".drop-card-date");

      link.href = `product-listing.html?category=drops&drop=${encodeURIComponent(drop.slug)}`;
      image.src = drop.images?.[0]?.url || "LOGO.png";
      image.alt = drop.name;
      cardTitle.textContent = drop.name;
      date.textContent = drop.releaseDate
        ? `Releases ${new Date(drop.releaseDate).toLocaleDateString()}`
        : "Drop available";

      cardsContainer.appendChild(fragment);
    });
    return;
  }

  if (displayedProducts.length > 0) {
    const template = document.getElementById("product-card-template");
    displayedProducts.forEach((product) => {
      const fragment = template.content.cloneNode(true);
      const link = fragment.querySelector("a");
      const image = fragment.querySelector(".product-card-image");
      const label = fragment.querySelector(".product-card-label");
      const cardTitle = fragment.querySelector(".product-card-title");
      const price = fragment.querySelector(".product-card-price");

      link.href = `product-details.html?slug=${encodeURIComponent(product.slug)}`;
      image.src = product.images?.[0]?.url || product.image || "LOGO.png";
      image.alt = product.name;
      label.textContent = product.isLimited ? "Limited 1 of 50" : "Limited Release";
      cardTitle.textContent = product.name;
      price.textContent = `$${product.basePrice}`;

      cardsContainer.appendChild(fragment);
    });
    return;
  }

  status.textContent = "No products currently available.";
  status.className = "rounded-3xl border border-[#4d4635]/30 p-12 text-center text-[#99907c]";
}

function setupDropStrip() {
  const upcomingDrops = getUpcomingDrops();
  const nextDrop = upcomingDrops[0] || null;
  const strip = document.getElementById("home-drop-strip");
  const title = document.getElementById("home-drop-title");
  const days = document.getElementById("home-drop-days");
  const hours = document.getElementById("home-drop-hours");
  const minutes = document.getElementById("home-drop-minutes");

  if (!strip || !title || !days || !hours || !minutes) {
    return;
  }

  if (!nextDrop || new Date(nextDrop.releaseDate) <= new Date()) {
    strip.classList.add("hidden");
    return;
  }

  const update = () => {
    const countdown = computeCountdown(new Date(nextDrop.releaseDate));
    title.textContent = nextDrop.name;
    days.textContent = countdown.days;
    hours.textContent = countdown.hours;
    minutes.textContent = countdown.minutes;
  };

  update();
  strip.classList.remove("hidden");
  window.setInterval(update, 1000);
}

function setupSignupForm() {
  const form = document.getElementById("elite-signup-form");
  const input = document.getElementById("elite-email-input");
  const feedback = document.getElementById("elite-signup-feedback");
  const button = document.getElementById("elite-submit-btn");

  if (!form || !input || !feedback || !button) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = input.value.trim();

    if (!email) {
      feedback.textContent = "Enter an email address to join the ledger.";
      feedback.classList.remove("hidden");
      return;
    }

    feedback.textContent = "Access request recorded for demo preview.";
    feedback.classList.remove("hidden");
    button.textContent = "Joined";
    input.value = "";

    window.setTimeout(() => {
      button.textContent = "Join the Elite";
    }, 1800);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupBranding();
  startHeroRotation();
  setupDropStrip();
  renderGridCards();
  setupSignupForm();
});
