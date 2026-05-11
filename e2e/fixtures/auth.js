const { test: baseTest, expect } = require("@playwright/test");

const ROLE_CREDENTIALS = {
  super_admin: {
    email: "superadmin@sagaelite.com",
    password: "SuperSecret123!",
  },
  admin: {
    email: "admin@sagaelite.com",
    password: "AdminSecret123!",
  },
  order_manager: {
    email: "orders.admin@sagaelite.com",
    password: "OrderAdmin123!",
  },
  product_manager: {
    email: "products.admin@sagaelite.com",
    password: "ProductAdmin123!",
  },
  marketing_manager: {
    email: "marketing.admin@sagaelite.com",
    password: "MarketingAdmin123!",
  },
  support_admin: {
    email: "support.admin@sagaelite.com",
    password: "SupportAdmin123!",
  },
  inventory_manager: {
    email: "inventory.admin@sagaelite.com",
    password: "InventoryAdmin123!",
  },
};

const BACKEND_URL =
  process.env.E2E_BACKEND_URL ||
  `http://localhost:${process.env.E2E_BACKEND_PORT || 5001}`;

/**
 * Logs in as a seeded role by hitting the auth endpoint directly and
 * attaching the session cookie to the test's browser context. Avoids
 * driving the login UI in every test (slow and noisy).
 */
const loginAs = async ({ context, request }, role) => {
  const creds = ROLE_CREDENTIALS[role];
  if (!creds) throw new Error(`Unknown role for loginAs: ${role}`);

  const response = await request.post(`${BACKEND_URL}/api/v1/auth/login`, {
    data: creds,
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Login failed for ${role}: ${response.status()} ${body.slice(0, 200)}`
    );
  }

  const setCookieHeader = response.headers()["set-cookie"];
  if (!setCookieHeader) {
    throw new Error(`Login for ${role} returned no Set-Cookie header`);
  }

  const tokenMatch = /token=([^;]+)/.exec(setCookieHeader);
  if (!tokenMatch) {
    throw new Error(`Login for ${role} returned no token cookie`);
  }

  // Add cookie under the frontend origin so the SPA picks it up.
  const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: "token",
      value: tokenMatch[1],
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
};

const test = baseTest.extend({
  loginAs: async ({ context, request }, use) => {
    await use((role) => loginAs({ context, request }, role));
  },
});

module.exports = { test, expect, ROLE_CREDENTIALS, loginAs };
