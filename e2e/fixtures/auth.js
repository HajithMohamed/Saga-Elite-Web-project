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
  `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || 5001}`;

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

  const payload = await response.json().catch(() => ({}));
  const setCookieHeader = response.headers()["set-cookie"] || "";
  const tokenMatch = /token=([^;]+)/.exec(setCookieHeader);
  const token = payload?.token || (tokenMatch ? tokenMatch[1] : null);

  if (!token || token === "loggedout") {
    throw new Error(`Login for ${role} returned no session token`);
  }

  const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";
  await context.addCookies([
    {
      name: "token",
      value: token,
      url: baseURL,
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  await context.addInitScript((authToken) => {
    window.localStorage.setItem("authToken", authToken);
  }, token);

  // Bearer header for page.request calls to the backend origin (cookies are
  // scoped to the Vite dev-server host, not 127.0.0.1:PORT).
  await context.setExtraHTTPHeaders({ Authorization: `Bearer ${token}` });

  return { token, baseURL };
};

const waitForAdminShell = async (page) => {
  await page.getByTestId("admin-global-search-input").waitFor({
    state: "visible",
    timeout: 45_000,
  });
};

/** Wait until the SPA has finished check-auth and rendered the admin layout. */
const gotoAdmin = async (page, path = "/admin/dashboard", { baseURL, token } = {}) => {
  if (token && baseURL) {
    await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate((authToken) => {
      window.localStorage.setItem("authToken", authToken);
    }, token);
  }

  const authReady = page.waitForResponse(
    (res) =>
      res.url().includes("/auth/check-auth") &&
      res.status() >= 200 &&
      res.status() < 400,
    { timeout: 45_000 }
  );
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await authReady.catch(() => {});
  await page
    .getByText("Opening the atelier")
    .waitFor({ state: "hidden", timeout: 45_000 })
    .catch(() => {});
  await waitForAdminShell(page);
};

const test = baseTest.extend({
  loginAs: async ({ context, request, page }, use) => {
    await use(async (role) => {
      const session = await loginAs({ context, request }, role);
      await gotoAdmin(page, "/admin/dashboard", session);
    });
  },
});

module.exports = {
  test,
  expect,
  ROLE_CREDENTIALS,
  loginAs,
  waitForAdminShell,
  gotoAdmin,
};
