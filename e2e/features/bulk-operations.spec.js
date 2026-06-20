const { test, expect } = require("../fixtures/auth");

test.describe("A2 — Bulk operations on Products", () => {
  test("super_admin selects 2 products, deactivates them, audit log captures count", async ({
    page,
    loginAs,
  }) => {
    await loginAs("super_admin");
    await page.goto("/admin/product", { waitUntil: "domcontentloaded" });
    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/api/v1/products") &&
          res.request().method() === "GET" &&
          res.status() >= 200 &&
          res.status() < 400,
        { timeout: 45_000 }
      )
      .catch(() => {});

    const rowCheckboxes = page.getByTestId("admin-bulk-row-select");
    await expect(rowCheckboxes.first()).toBeVisible({ timeout: 30_000 });

    const total = await rowCheckboxes.count();
    expect(total).toBeGreaterThanOrEqual(2);

    // Pick the first two product rows.
    await rowCheckboxes.nth(0).check();
    await rowCheckboxes.nth(1).check();

    const bar = page.getByTestId("admin-bulk-action-bar");
    await expect(bar).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("admin-bulk-count")).toHaveText("2");

    await page.getByTestId("admin-bulk-action-deactivate").click();

    // Wait for the page to refetch — the bar disappears once selection clears.
    await expect(bar).toBeHidden({ timeout: 10_000 });

    // Verify the super-admin audit log captured the bulk action with succeededCount = 2.
    await expect
      .poll(
        async () => {
          const res = await page.request.get(
            "/api/v1/super-admin/logs?category=product&limit=10"
          );
          if (!res.ok()) return null;
          const body = await res.json();
          const logs = body?.data?.logs || [];
          return logs.find(
            (l) => l.action?.startsWith("Bulk deactivated") && l.details?.succeededCount === 2
          );
        },
        { timeout: 10_000, intervals: [500, 1000, 2000] }
      )
      .toBeTruthy();
  });

  test("bulk delete shows confirm dialog and removes rows on confirm", async ({
    page,
    loginAs,
  }) => {
    await loginAs("super_admin");
    await page.goto("/admin/product", { waitUntil: "domcontentloaded" });
    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/api/v1/products") &&
          res.request().method() === "GET" &&
          res.status() >= 200 &&
          res.status() < 400,
        { timeout: 45_000 }
      )
      .catch(() => {});

    const rowCheckboxes = page.getByTestId("admin-bulk-row-select");
    await expect(rowCheckboxes.first()).toBeVisible({ timeout: 30_000 });
    const initialCount = await rowCheckboxes.count();

    // Select the first row only.
    await rowCheckboxes.nth(0).check();
    await expect(page.getByTestId("admin-bulk-action-bar")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId("admin-bulk-action-delete").click();
    const confirmBtn = page.getByTestId("admin-bulk-confirm");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // After deletion + refetch, row count must drop by exactly 1.
    await expect
      .poll(async () => rowCheckboxes.count(), {
        timeout: 10_000,
        intervals: [500, 1000, 2000],
      })
      .toBe(initialCount - 1);
  });
});
