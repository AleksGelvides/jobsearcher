import { expect, test } from "@playwright/test";

test("search, review a vacancy and edit the application letter", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Добрый день!" }),
  ).toBeVisible();
  const navigation = page.getByRole("navigation", {
    name:
      info.project.name === "mobile"
        ? "Мобильная навигация"
        : "Основная навигация",
  });
  await navigation.getByRole("link", { name: "Вакансии" }).click();
  await page.getByRole("searchbox").fill("Финтех");
  await expect(page.getByRole("status")).toHaveText("Найдено: 1");
  await page
    .getByRole("link", { name: "Java Backend Developer", exact: true })
    .click();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Подготовить отклик" }).click();
  await page
    .getByRole("textbox", { name: "Сопроводительное письмо" })
    .fill("Демонстрационный черновик");
  await expect(
    page.getByRole("button", { name: "Отправить отклик" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Восстановить шаблон" }).click();
  await expect(
    page.getByRole("textbox", { name: "Сопроводительное письмо" }),
  ).toHaveValue(/Здравствуйте/);
});

test("profile changes survive navigation without horizontal overflow", async ({
  page,
}, info) => {
  await page.goto("/#/profile");
  await page.getByRole("button", { name: "Редактировать профиль" }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Тестовый Кандидат");
  await page.getByRole("button", { name: "Сохранить профиль" }).click();
  await expect(page.getByRole("status")).toHaveText(/Профиль обновлён/);
  await page.getByRole("link", { name: "JobPilot", exact: true }).click();
  if (info.project.name === "mobile") {
    await page
      .getByRole("navigation", { name: "Мобильная навигация" })
      .getByRole("link", { name: "Профиль" })
      .click();
  } else {
    await page.locator(".sidebar-profile").click();
  }
  await expect(
    page
      .getByText("Тестовый Кандидат", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("visual regression for the dashboard and vacancy analysis", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Добрый день!" }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("dashboard.png");
  await page
    .getByRole("link", { name: /Java Backend Developer Финтех/ })
    .click();
  await expect(page.locator(".detail-title")).toBeVisible();
  // Keep the pointer away from interactive elements after navigating.
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot("vacancy-analysis.png");
});
