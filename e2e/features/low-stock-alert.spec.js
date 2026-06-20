const path = require("path");
const { test, expect, waitForAdminShell } = require("../fixtures/auth");

const TEST_DB_URI =
  process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/saga_elite_test";

const TRIGGER_PRODUCT_NAME = "E2E LowStock Trigger";
const TRIGGER_ART_NO = "E2E-LOW-001";

let mongoose;
let Product;
let SmartAlert;

test.describe("A3 — Low-stock alert + sidebar badge", () => {
  test.beforeAll(async () => {
    mongoose = require("mongoose");
    Product = require(path.resolve(
      __dirname,
      "../../Server-side/Models/Product.js"
    ));
    SmartAlert = require(path.resolve(
      __dirname,
      "../../Server-side/Models/SmartAlert.js"
    ));

    await mongoose.connect(TEST_DB_URI);

    // Wipe any prior trigger product + low-stock alerts so the dedup window
    // (24h on the same kind) doesn't suppress a fresh alert from this run.
    await Product.deleteMany({ artNo: TRIGGER_ART_NO });
    await SmartAlert.deleteMany({
      kind: { $in: ["low_stock_warning", "low_stock_critical"] },
    });

    // Seed a product right at the threshold with active demand so the cron
    // fires `low_stock_warning` on the next run.
    await Product.create({
      name: TRIGGER_PRODUCT_NAME,
      artNo: TRIGGER_ART_NO,
      brand: "Saga Elite",
      category: "Unisex",
      basePrice: 5500,
      lowStockThreshold: 5,
      cartAddCount: 3,
      isActive: true,
      variants: [
        { sku: `${TRIGGER_ART_NO}-S-BLK`, size: "S", color: "Black", stock: 2 },
      ],
    });
  });

  test.afterAll(async () => {
    if (mongoose && mongoose.connection?.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  test("manual cron trigger fires low_stock_warning alert", async ({
    page,
    loginAs,
  }) => {
    await loginAs("super_admin");

    // Fire-and-forget endpoint: 202 immediately, work happens in background.
    const trigger = await page.request.post("/api/v1/admin/alerts/run");
    expect(trigger.status()).toBe(202);

    // Poll the alerts endpoint until the warning shows up.
    await expect
      .poll(
        async () => {
          const res = await page.request.get(
            "/api/v1/admin/alerts?kind=low_stock_warning&includeAcknowledged=false"
          );
          if (!res.ok()) return null;
          const body = await res.json();
          const alerts = body?.data?.alerts || [];
          return alerts.find((a) =>
            (a.message || "").includes(TRIGGER_PRODUCT_NAME)
          );
        },
        { timeout: 15_000, intervals: [500, 1000, 2000, 3000] }
      )
      .toBeTruthy();
  });

  test("Products sidebar entry shows a low-stock badge after refetch", async ({
    page,
    loginAs,
  }) => {
    await loginAs("super_admin");

    // Make sure the alert exists before reloading the dashboard.
    await page.request.post("/api/v1/admin/alerts/run");

    await expect
      .poll(
        async () => {
          const res = await page.request.get(
            "/api/v1/admin/alerts?countOnly=true&kind=low_stock_warning,low_stock_critical"
          );
          const body = await res.json();
          return body?.data?.count || 0;
        },
        { timeout: 15_000, intervals: [500, 1000, 2000] }
      )
      .toBeGreaterThan(0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/auth/check-auth") &&
          res.status() >= 200 &&
          res.status() < 400,
        { timeout: 45_000 }
      )
      .catch(() => {});
    await waitForAdminShell(page);
    // Sidebar polls every 30s; wait for it to pick up at least one badge.
    const productsLink = page
      .getByTestId("admin-sidebar-nav")
      .locator('a[href="/admin/product"]')
      .first();
    await expect(productsLink).toBeVisible({ timeout: 10_000 });
    // The badge renders as a numeric span inside the link. Wait up to 35s
    // (one polling cycle + slack).
    await expect(productsLink).toContainText(/\d+/, { timeout: 35_000 });
  });
});
