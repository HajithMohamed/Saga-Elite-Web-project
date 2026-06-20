const { test, expect, ROLE_CREDENTIALS } = require("../fixtures/auth");

test.describe("Admin login per role", () => {
  for (const role of Object.keys(ROLE_CREDENTIALS)) {
    test(`logs in as ${role} and lands on the admin dashboard`, async ({
      page,
      loginAs,
    }) => {
      await loginAs(role);
      await expect(page).toHaveURL(/\/admin\/dashboard/);
      await expect(page.getByTestId("admin-global-search-input")).toBeVisible();
      await expect(page.getByTestId("admin-sidebar-nav")).toBeVisible();
    });
  }
});
