import { expect, test } from "@playwright/test";

test("renders the Colegio El Bosque landing page", async ({ page }) => {
  await page.goto("/");

  // Hero heading
  await expect(
    page.getByRole("heading", {
      name: /educación con excelencia/i,
      level: 1,
    }),
  ).toBeVisible();

  // Navbar CTA (from the shared Button primitive)
  await expect(page.getByRole("button", { name: /inscríbete/i })).toBeVisible();

  // A few key sections render
  await expect(
    page.getByRole("heading", { name: /misión y visión/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /un camino educativo completo/i }),
  ).toBeVisible();

  // Anchor navigation target exists
  await expect(page.locator("#inscripciones")).toBeAttached();
});
