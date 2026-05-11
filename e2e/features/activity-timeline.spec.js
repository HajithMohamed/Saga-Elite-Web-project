const path = require("path");
const { test, expect } = require("../fixtures/auth");

const TEST_DB_URI =
  process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/saga_elite_test";

const SEED_PRODUCT_ACTION = "E2E seed: product create";
const SEED_REVIEW_ACTION = "E2E seed: review categorize";

let mongoose;
let AdminLog;
let User;

test.describe("A4 — Permission-aware activity timeline", () => {
  test.beforeAll(async () => {
    mongoose = require(path.resolve(
      __dirname,
      "../../Server-side/node_modules/mongoose"
    ));
    AdminLog = require(path.resolve(
      __dirname,
      "../../Server-side/Models/AdminLog.js"
    ));
    User = require(path.resolve(
      __dirname,
      "../../Server-side/Models/User.js"
    ));

    await mongoose.connect(TEST_DB_URI);

    // Use the seeded super-admin as the source admin so the populate() call
    // in listMyVisibleLogs has a real reference to dereference.
    const sourceAdmin = await User.findOne({
      email: "superadmin@sagaelite.com",
    }).lean();
    if (!sourceAdmin) {
      throw new Error("Seed admin not found — global-setup didn't run");
    }

    // Wipe any prior seeds so re-runs don't accumulate dupes.
    await AdminLog.deleteMany({
      action: { $in: [SEED_PRODUCT_ACTION, SEED_REVIEW_ACTION] },
    });

    await AdminLog.create([
      {
        adminId: sourceAdmin._id,
        action: SEED_PRODUCT_ACTION,
        category: "product",
        method: "POST",
        route: "/api/v1/products/add-product",
      },
      {
        adminId: sourceAdmin._id,
        action: SEED_REVIEW_ACTION,
        category: "review",
        method: "PATCH",
        route: "/api/v1/admin/reviews/abc123/category",
      },
    ]);
  });

  test.afterAll(async () => {
    if (mongoose && mongoose.connection?.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  test("support_admin sees only category-permitted logs and no admin filter", async ({
    page,
    loginAs,
  }) => {
    await loginAs("support_admin"); // perms: orders, users, manageReviews
    await page.goto("/admin/activity");

    // The review row is permitted (manageReviews → review category).
    await expect(page.getByText(SEED_REVIEW_ACTION)).toBeVisible({
      timeout: 10_000,
    });

    // The product row is forbidden (no `products` perm).
    await expect(page.getByText(SEED_PRODUCT_ACTION)).toBeHidden();

    // Admin filter is super-admin-only — must NOT be in the DOM.
    await expect(
      page.getByTestId("admin-activity-filter-admin")
    ).toHaveCount(0);
  });

  test("super_admin sees all categories and the admin filter", async ({
    page,
    loginAs,
  }) => {
    await loginAs("super_admin");
    await page.goto("/admin/activity");

    await expect(page.getByText(SEED_PRODUCT_ACTION)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(SEED_REVIEW_ACTION)).toBeVisible();
    await expect(page.getByTestId("admin-activity-filter-admin")).toBeVisible();
  });

  test("category filter narrows results", async ({ page, loginAs }) => {
    await loginAs("super_admin");
    await page.goto("/admin/activity");

    // Wait for initial load.
    await expect(page.getByText(SEED_PRODUCT_ACTION)).toBeVisible({
      timeout: 10_000,
    });

    // Filter to `order` only — both seed rows (product + review) must vanish.
    await page
      .getByTestId("admin-activity-filter-category")
      .selectOption("order");

    await expect(page.getByText(SEED_PRODUCT_ACTION)).toBeHidden({
      timeout: 5_000,
    });
    await expect(page.getByText(SEED_REVIEW_ACTION)).toBeHidden();
  });
});
