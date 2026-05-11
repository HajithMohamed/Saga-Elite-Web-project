const { test, expect } = require("../fixtures/auth");

const ACCESS_DENIED_TEXT = /Access Restricted/i;

test.describe("Permission gating on admin routes", () => {
  test("marketing_manager is blocked from /admin/order (orders perm)", async ({
    page,
    loginAs,
  }) => {
    await loginAs("marketing_manager");
    await page.goto("/admin/order");
    await expect(page.getByText(ACCESS_DENIED_TEXT)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("marketing_manager is blocked from /admin/super-admin (super-only)", async ({
    page,
    loginAs,
  }) => {
    await loginAs("marketing_manager");
    await page.goto("/admin/super-admin");
    await expect(page.getByText(ACCESS_DENIED_TEXT)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("marketing_manager can access /admin/notifications (has notifications perm)", async ({
    page,
    loginAs,
  }) => {
    await loginAs("marketing_manager");
    await page.goto("/admin/notifications");
    await expect(page.getByText(ACCESS_DENIED_TEXT)).not.toBeVisible();
    await expect(page).toHaveURL(/\/admin\/notifications/);
  });

  test("order_manager is blocked from /admin/product (no products perm)", async ({
    page,
    loginAs,
  }) => {
    await loginAs("order_manager");
    await page.goto("/admin/product");
    await expect(page.getByText(ACCESS_DENIED_TEXT)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("super_admin can access /admin/super-admin", async ({
    page,
    loginAs,
  }) => {
    await loginAs("super_admin");
    await page.goto("/admin/super-admin");
    await expect(page.getByText(ACCESS_DENIED_TEXT)).not.toBeVisible();
    await expect(page).toHaveURL(/\/admin\/super-admin/);
  });

  test("support_admin can access /admin/reviews (has manageReviews perm)", async ({
    page,
    loginAs,
  }) => {
    await loginAs("support_admin");
    await page.goto("/admin/reviews");
    await expect(page.getByText(ACCESS_DENIED_TEXT)).not.toBeVisible();
  });
});
