const { test, expect, ROLE_CREDENTIALS } = require("../fixtures/auth");

test.describe("Admin login per role", () => {
  for (const role of Object.keys(ROLE_CREDENTIALS)) {
    test(`logs in as ${role} and lands on the admin dashboard`, async ({
      page,
      loginAs,
    }) => {
      await loginAs(role);
      await page.goto("/admin/dashboard");
      // Sidebar is the most reliable signal that the admin shell rendered.
      await expect(page.locator("aside, nav").first()).toBeVisible({
        timeout: 10_000,
      });
      // Auth cookie must round-trip — the dashboard fetches data on mount.
      // A non-admin would have been redirected to /auth/login.
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });
  }
});
