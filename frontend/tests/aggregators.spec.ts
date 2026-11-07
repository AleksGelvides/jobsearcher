import { expect, test } from "@playwright/test";

test("HeadHunter opens the sign-in dialog and calls the launcher", async ({
  page,
}) => {
  let started = 0;
  await page.route("**/__jobpilot/aggregator-login/**", async (route) => {
    const request = route.request();
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/hh")
    ) {
      started++;
      await route.fulfill({ status: 201, json: { id: "hh-session" } });
      return;
    }
    await route.fulfill({ status: 204 });
  });

  await page.goto("/#/automation");
  const card = page.getByRole("button", { name: /^HeadHunter · hh\.ru/ });
  await card.click();
  const login = page.getByRole("dialog", { name: "Подключение HeadHunter" });
  await expect(login.getByRole("status")).toHaveText("Окно браузера открыто");
  await expect(login.getByRole("textbox")).toHaveCount(0);
  await login.getByRole("button", { name: "Закрыть" }).click();
  await expect(card).toBeFocused();
  expect(started).toBe(1);
});

test("HeadHunter is the only test aggregator in the list", async ({ page }) => {
  await page.goto("/#/automation");
  await expect(
    page.getByRole("heading", { name: "Агрегаторы вакансий" }),
  ).toBeVisible();
  const cards = page.locator(".aggregator-list").getByRole("button");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("HeadHunter · hh.ru");
  await expect(cards.first()).toContainText("Тестовая площадка");
});
