import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { App } from "../src/app/App";
import { LiveApp } from "../src/app/LiveApp";
import { api } from "../src/lib/api/client";
import { demoData } from "../src/mocks/data";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

test("loads the workspace from the server and retries a failed request", async () => {
  const workspace = {
    ...demoData,
    automation: {
      active: true,
      salary: 200000,
      schedule: "Каждый час",
      mode: "После проверки",
    },
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response("Ошибка", { status: 503 }))
    .mockResolvedValueOnce(Response.json(workspace));
  vi.stubGlobal("fetch", fetch);

  render(<LiveApp />);
  expect(screen.getByText("Загрузка рабочего пространства…")).toBeDefined();
  fireEvent.click(
    await screen.findByRole("button", { name: "Попробовать снова" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Добрый день!" }),
  ).toBeDefined();
  expect(fetch).toHaveBeenCalledWith(
    "/api/v1/workspace",
    expect.objectContaining({
      credentials: "same-origin",
    }),
  );
});

test("sends a multipart resume with the token named by the server", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ headerName: "X-CSRF-TOKEN", token: "test-token" }),
    )
    .mockResolvedValueOnce(
      Response.json({ fileName: "resume.pdf" }, { status: 201 }),
    );
  vi.stubGlobal("fetch", fetch);
  const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });

  await expect(api.uploadResume(file)).resolves.toEqual({
    fileName: file.name,
  });
  const [url, init] = fetch.mock.calls[1];
  expect(url).toBe("/api/v1/resumes");
  expect(init.headers.get("X-CSRF-TOKEN")).toBe("test-token");
  expect(init.headers.has("Content-Type")).toBe(false);
  expect(init.body.get("file")).toBe(file);
});

test("rejects a successful HTML response from a login redirect", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response("<html>Login</html>", {
        headers: { "Content-Type": "text/html" },
      }),
    ),
  );
  await expect(api.workspace(new AbortController().signal)).rejects.toThrow();
});

test("searches the server and requests the next page using its cursor", async () => {
  window.history.replaceState({}, "", "/#/vacancies");
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
    .mockResolvedValueOnce(
      Response.json({
        items: demoData.vacancies.slice(0, 1),
        nextCursor: "next-page",
      }),
    )
    .mockResolvedValueOnce(Response.json({ items: [] }));
  vi.stubGlobal("fetch", fetch);

  render(<App data={{ ...demoData, demo: false }} live />);
  fireEvent.click(await screen.findByRole("button", { name: "Повторить" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Следующая страница" }),
  );
  expect(await screen.findByText("Вакансий пока нет")).toBeDefined();
  expect(fetch.mock.calls[2][0]).toBe(
    "/api/v1/vacancies?q=&sort=match&cursor=next-page",
  );
});

test("prepares an application and waits for the server to confirm submission", async () => {
  const vacancy = demoData.vacancies[0];
  window.history.replaceState({}, "", `/#/vacancies/${vacancy.id}`);
  const token = { headerName: "X-CSRF-TOKEN", token: "test-token" };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        ...vacancy,
        analysis: [{ title: "Java", description: "Подтверждено" }],
      }),
    )
    .mockResolvedValueOnce(Response.json(token))
    .mockResolvedValueOnce(
      Response.json(
        { id: "draft-1", resumeName: "tailored.pdf", coverLetter: "Черновик" },
        { status: 201 },
      ),
    )
    .mockResolvedValueOnce(Response.json(token))
    .mockResolvedValueOnce(Response.json(demoData.applications[0]));
  vi.stubGlobal("fetch", fetch);

  render(<App data={{ ...demoData, demo: false }} live />);
  expect(await screen.findByText("Подтверждено")).toBeDefined();
  fireEvent.click(
    screen.getAllByRole("button", { name: "Подготовить отклик" })[0],
  );
  expect(await screen.findByText("tailored.pdf")).toBeDefined();
  fireEvent.change(screen.getByLabelText("Сопроводительное письмо"), {
    target: { value: "Проверенный текст" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Отправить отклик" }));
  expect(await screen.findByText("Отклик подтверждён сервером.")).toBeDefined();
  expect(fetch.mock.calls[4][0]).toBe(
    "/api/v1/application-drafts/draft-1/submit",
  );
  expect(JSON.parse(fetch.mock.calls[4][1].body)).toEqual({
    coverLetter: "Проверенный текст",
  });
});

test("keeps profile edits open when saving fails", async () => {
  window.history.replaceState({}, "", "/#/profile");
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ headerName: "X-CSRF-TOKEN", token: "test-token" }),
    )
    .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }));
  vi.stubGlobal("fetch", fetch);
  render(<App data={{ ...demoData, demo: false }} live />);
  fireEvent.click(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  );
  fireEvent.change(screen.getByLabelText("Имя"), {
    target: { value: "Новое имя" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить профиль" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "Не удалось сохранить",
    ),
  );
  expect(screen.getByDisplayValue("Новое имя")).toBeDefined();
  expect(fetch.mock.calls[1][0]).toBe("/api/v1/profile");
});

test("keeps automation stopped after a failed start and displays confirmed status after retry", async () => {
  window.history.replaceState({}, "", "/#/automation");
  const automation = {
    active: false,
    salary: 250000,
    schedule: "Каждый день",
    mode: "После проверки",
  };
  const token = { headerName: "X-CSRF-TOKEN", token: "test-token" };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(token))
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json(token))
    .mockResolvedValueOnce(Response.json({ ...automation, active: true }));
  vi.stubGlobal("fetch", fetch);

  render(<App data={{ ...demoData, demo: false, automation }} live />);
  fireEvent.click(screen.getByRole("button", { name: "Запустить" }));
  expect(await screen.findByRole("alert")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Запустить" }));
  expect(
    await screen.findByRole("button", { name: "Остановить" }),
  ).toBeDefined();
  expect(fetch.mock.calls[3][0]).toBe("/api/v1/automation");
  expect(JSON.parse(fetch.mock.calls[3][1].body)).toEqual({
    ...automation,
    active: true,
  });
});

test("shows a missing vacancy when the server rejects a direct link", async () => {
  window.history.replaceState({}, "", "/#/vacancies/unknown");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
  );
  render(<App data={{ ...demoData, demo: false }} live />);
  expect(
    await screen.findByRole("heading", { name: "Вакансия недоступна" }),
  ).toBeDefined();
});

test("commits profile changes only after the server returns the saved profile", async () => {
  window.history.replaceState({}, "", "/#/profile");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ headerName: "X-CSRF-TOKEN", token: "test-token" }),
      )
      .mockResolvedValueOnce(
        Response.json({ ...demoData.candidate, name: "Сохранённое имя" }),
      ),
  );
  render(<App data={{ ...demoData, demo: false }} live />);
  fireEvent.click(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  );
  fireEvent.change(screen.getByLabelText("Имя"), {
    target: { value: "Новое имя" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить профиль" }));
  expect(await screen.findByText("Профиль сохранён.")).toBeDefined();
  expect(screen.getAllByText("Сохранённое имя").length).toBeGreaterThan(0);
});

test("does not send a write when the session cannot provide a CSRF token", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetch);
  await expect(api.saveProfile(demoData.candidate)).rejects.toThrow("401");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe("/api/v1/csrf");
});

test("reports a failed preparation and lets the user retry", async () => {
  const vacancy = demoData.vacancies[0];
  window.history.replaceState({}, "", `/#/vacancies/${vacancy.id}`);
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(vacancy))
    .mockResolvedValueOnce(
      Response.json({ headerName: "X-CSRF-TOKEN", token: "test-token" }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetch);
  render(<App data={{ ...demoData, demo: false }} live />);
  expect(
    await screen.findByText("Подробный анализ пока недоступен."),
  ).toBeDefined();
  fireEvent.click(
    screen.getAllByRole("button", { name: "Подготовить отклик" })[0],
  );
  expect(await screen.findByRole("alert")).toBeDefined();
  expect(
    screen
      .getByRole("button", { name: "Отправить отклик" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
