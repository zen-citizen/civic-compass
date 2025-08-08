import { test, expect } from "@playwright/test";

test("homepage loads and has expected title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Bangalore Civic Compass/i);
});
