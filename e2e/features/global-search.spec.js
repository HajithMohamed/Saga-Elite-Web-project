const { test, expect } = require("../fixtures/auth");

test.describe("A1 — Global admin search", () => {
  test("super_admin sees all result buckets when matches exist", async ({
    page,
    loginAs,
  }) => {
    await loginAs("super_admin");

    const input = page.getByTestId("admin-global-search-input");
    await expect(input).toBeVisible();
    await input.click();
    await input.fill("e2e");

    const results = page.getByTestId("admin-global-search-results");
    await expect(results).toBeVisible({ timeout: 10_000 });
    // Seeded fixture creates two products + a drop with "E2E" in name.
    await expect(
      page.getByTestId("admin-search-result-products").first()
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-search-result-drops").first()
    ).toBeVisible();
  });

  test("query under 2 chars shows no dropdown", async ({ page, loginAs }) => {
    await loginAs("super_admin");

    const input = page.getByTestId("admin-global-search-input");
    await input.fill("a");
    await expect(
      page.getByTestId("admin-global-search-results")
    ).not.toBeVisible();
  });

  test("clicking a result navigates to the corresponding admin page", async ({
    page,
    loginAs,
  }) => {
    await loginAs("super_admin");

    await page.getByTestId("admin-global-search-input").fill("e2e");
    const firstProduct = page
      .getByTestId("admin-search-result-products")
      .first();
    await expect(firstProduct).toBeVisible({ timeout: 10_000 });
    await firstProduct.click();
    await expect(page).toHaveURL(/\/admin\/product/);
  });

  test("marketing_manager sees campaigns/coupons but NOT customer/order buckets", async ({
    page,
    loginAs,
  }) => {
    await loginAs("marketing_manager");

    // Drive backend directly to verify per-bucket permission filtering.
    // page.request inherits the cookie set by loginAs on the browser context.
    const response = await page.request.get("/api/v1/admin/search?q=sample");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    // marketing_manager perms: notifications, viewAnalytics, sendCampaigns
    // → no products / orders / users / drops bucket access
    expect(body.data.products).toEqual([]);
    expect(body.data.orders).toEqual([]);
    expect(body.data.customers).toEqual([]);
    expect(body.data.drops).toEqual([]);
    // sendCampaigns → coupons bucket allowed (will be empty array since no coupon seeded)
    expect(Array.isArray(body.data.coupons)).toBe(true);
  });
});
