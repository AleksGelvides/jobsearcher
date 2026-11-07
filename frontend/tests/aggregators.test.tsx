import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Aggregators } from "../src/features/aggregators/Aggregators";
import { loginPath } from "../src/features/aggregators/catalog";

beforeEach(() => {
  for (const [method, open] of [
    ["showModal", true],
    ["close", false],
  ] as const) {
    Object.defineProperty(HTMLDialogElement.prototype, method, {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = open;
      },
    });
  }
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function stubFetch(
  mock: (url: string, options: RequestInit) => Promise<Response>,
) {
  vi.stubGlobal("fetch", (url: string, options: RequestInit) =>
    url.endsWith("/frame")
      ? Promise.resolve(new Response(null, { status: 204 }))
      : mock(url, options),
  );
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

test("choosing an aggregator starts a browser and closing the dialog releases it", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ id: "session 1" }, { status: 201 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  stubFetch(fetchMock);
  render(<Aggregators />);
  const card = screen.getByRole("button", { name: /^HeadHunter · hh\.ru/ });
  fireEvent.click(card);
  expect(screen.getByRole("status").textContent).toMatch(/Открываем/);
  expect(await screen.findByText("Окно браузера открыто")).toBeDefined();
  expect(fetchMock.mock.calls[0]).toMatchObject([
    loginPath + "/hh",
    { method: "POST" },
  ]);
  expect(screen.getByRole("application")).toBeDefined();
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(card);
  expect(fetchMock.mock.calls[1]).toMatchObject([
    loginPath + "/session%201",
    { method: "DELETE", keepalive: true },
  ]);
});

test("a launch failure can retry HeadHunter or return to the list", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockRejectedValueOnce(new Error("unavailable"))
    .mockResolvedValueOnce(Response.json({ id: "hh-session" }, { status: 201 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  stubFetch(fetchMock);
  render(<Aggregators />);
  click(/^HeadHunter · hh\.ru/);
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Не удалось подтвердить вход на HeadHunter",
  );
  expect(
    screen.getByRole("dialog", { name: "Подключение HeadHunter" }),
  ).toBeDefined();
  click("Попробовать снова");
  expect(await screen.findByRole("alert")).toBeDefined();
  click("Отмена");
  expect(screen.queryByRole("dialog")).toBeNull();
  click(/^HeadHunter · hh\.ru/);
  expect(await screen.findByText("Окно браузера открыто")).toBeDefined();
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    loginPath + "/hh",
    loginPath + "/hh",
    loginPath + "/hh",
  ]);
  click("Закрыть");
});

test("a browser that starts after dismissal is released", async () => {
  let finish: (response: Response) => void = () => {};
  const pending = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetchMock = vi
    .fn()
    .mockReturnValueOnce(pending)
    .mockRejectedValueOnce(new Error("server stopped"));
  stubFetch(fetchMock);
  render(<Aggregators />);
  click(/^HeadHunter · hh\.ru/);
  click("Закрыть");
  finish(Response.json({ id: "late" }, { status: 201 }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(fetchMock.mock.calls[1][0]).toBe(loginPath + "/late");
});

test("closing the browser externally changes the dialog to the retry state", async () => {
  vi.useFakeTimers();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ id: "active" }, { status: 201 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  stubFetch(fetchMock);
  render(<Aggregators />);
  await act(async () => click(/^HeadHunter · hh\.ru/));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
  expect(screen.getByText("Окно браузера открыто")).toBeDefined();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
  expect(screen.getByRole("alert").textContent).toMatch(
    /Сеанс браузера завершён/,
  );
  expect(
    screen.getByRole("dialog", { name: "Подключение HeadHunter" }),
  ).toBeDefined();
  click("Отмена");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: "DELETE" });
});

test("confirmed login replaces the remote browser with the Figma result", async () => {
  vi.useFakeTimers();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ id: "active" }, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ state: "confirmed" }));
  stubFetch(fetchMock);
  render(<Aggregators />);
  await act(async () => click(/^HeadHunter · hh\.ru/));
  expect(screen.getByRole("application")).toBeDefined();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
  expect(screen.queryByRole("application")).toBeNull();
  expect(screen.getByRole("status").textContent).toBe(
    "Вход на HeadHunter подтверждён",
  );
  click("Продолжить");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
