import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RemoteBrowser } from "../src/features/aggregators/RemoteBrowser";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("draws a frame, scales clicks and forwards keyboard and scroll input", async () => {
  const drawImage = vi.fn();
  const dispose = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D);
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ close: dispose }),
  );
  const input: object[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init: RequestInit) => {
      if (url.endsWith("/frame"))
        return Promise.resolve(new Response(new Uint8Array([1, 2])));
      input.push(JSON.parse(String(init.body)));
      return Promise.resolve(new Response(null, { status: 204 }));
    }),
  );
  const { container, unmount } = render(<RemoteBrowser id="s" />);
  await waitFor(() => expect(drawImage).toHaveBeenCalled());
  expect(dispose).toHaveBeenCalled();
  const canvas = container.querySelector("canvas")!;
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(
    new DOMRect(10, 20, 450, 320),
  );
  const surface = screen.getByRole("application");
  fireEvent.click(canvas, { clientX: 60, clientY: 70 });
  expect(document.activeElement).toBe(surface);
  fireEvent.keyDown(surface, { key: "Я" });
  fireEvent.keyDown(surface, { key: "Tab", shiftKey: true });
  fireEvent.keyDown(surface, { key: "a", ctrlKey: true });
  fireEvent(
    surface,
    new InputEvent("beforeinput", {
      inputType: "insertText",
      data: "7",
      cancelable: true,
    }),
  );
  fireEvent(
    surface,
    new InputEvent("beforeinput", {
      inputType: "deleteContentBackward",
      cancelable: true,
    }),
  );
  fireEvent.wheel(surface, {
    clientX: 60,
    clientY: 70,
    deltaX: 0,
    deltaY: 100,
    deltaMode: 1,
  });
  fireEvent.keyDown(surface, { key: "Enter" });
  fireEvent.keyDown(surface, { key: "a", metaKey: true });
  fireEvent.keyDown(surface, { key: "x", isComposing: true });
  fireEvent.keyDown(surface, { key: "F5" });
  fireEvent.keyDown(surface, { key: "Escape" });
  await waitFor(() =>
    expect(input).toEqual([
      { type: "click", x: 100, y: 100 },
      { type: "text", value: "Я" },
      { type: "key", value: "Shift+Tab" },
      { type: "key", value: "ControlOrMeta+a" },
      { type: "text", value: "7" },
      { type: "key", value: "Backspace" },
      { type: "wheel", x: 100, y: 100, deltaX: 0, deltaY: 2400 },
      { type: "key", value: "Enter" },
      { type: "key", value: "ControlOrMeta+a" },
    ]),
  );
  expect(document.activeElement).not.toBe(surface);
  unmount();
});

test("recovers from a failed frame request and pauses when unmounted", async () => {
  vi.useFakeTimers();
  const mock = vi
    .fn()
    .mockRejectedValueOnce(new Error("disconnected"))
    .mockResolvedValueOnce(new Response(null, { status: 429 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", mock);
  const { unmount } = render(<RemoteBrowser id="s" />);
  await act(async () => {});
  expect(screen.getByRole("status").textContent).toBe(
    "Восстанавливаем изображение…",
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(360);
  });
  expect(mock).toHaveBeenCalledTimes(3);
  unmount();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(180);
  });
  expect(mock).toHaveBeenCalledTimes(3);
});

test("both copy shortcuts use the remote selection and paste forwards plain text", async () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ close: vi.fn() }),
  );
  class TestClipboardItem {
    constructor(readonly data: Record<string, Promise<Blob>>) {}
  }
  const write = vi.fn(async ([item]: TestClipboardItem[]) => {
    await item.data["text/plain"];
  });
  vi.stubGlobal("ClipboardItem", TestClipboardItem);
  const clipboard = { write };
  vi.stubGlobal("navigator", { clipboard });
  let selection = "Remote selection";
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith("/frame"))
      return Promise.resolve(new Response(new Uint8Array([1, 2])));
    if (url.endsWith("/copy")) return Promise.resolve(new Response(selection));
    return Promise.resolve(new Response(null, { status: 204 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<RemoteBrowser id="s" />);
  const surface = screen.getByRole("application");
  await waitFor(() =>
    expect(surface.getAttribute("contenteditable")).toBe("true"),
  );
  fireEvent.paste(surface, {
    clipboardData: { getData: () => "Pasted value" },
  });
  fireEvent.keyDown(surface, { key: "c", metaKey: true });
  fireEvent.keyDown(surface, { key: "c", ctrlKey: true });
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([url]) => url.endsWith("/copy")),
    ).toHaveLength(2),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringMatching(/\/input$/),
    expect.objectContaining({
      body: JSON.stringify({ type: "paste", value: "Pasted value" }),
    }),
  );
  expect(write).toHaveBeenCalledTimes(2);
  fireEvent.paste(surface, {
    clipboardData: { getData: () => "x".repeat(513) },
  });
  expect(screen.getByRole("alert").textContent).toMatch(/512/);
  fireEvent.paste(surface, { clipboardData: { getData: () => "" } });
  selection = "";
  fireEvent.copy(surface);
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toMatch(
      /Не удалось скопировать/,
    ),
  );
  vi.stubGlobal("navigator", {});
  fireEvent.copy(surface);
  expect(screen.getByRole("alert").textContent).toMatch(/не разрешил/);
});

test("mouse drag selects remotely and a touch drag scrolls without clicking", async () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ close: vi.fn() }),
  );
  const events: object[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init: RequestInit) => {
      if (url.endsWith("/frame"))
        return Promise.resolve(new Response(new Uint8Array([1, 2])));
      events.push(JSON.parse(String(init.body)));
      return Promise.resolve(new Response(null, { status: 204 }));
    }),
  );
  const { container } = render(<RemoteBrowser id="s" />);
  await waitFor(() =>
    expect(
      screen.getByRole("application").getAttribute("contenteditable"),
    ).toBe("true"),
  );
  const canvas = container.querySelector("canvas")!;
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 900, 640),
  );
  Object.defineProperty(canvas, "setPointerCapture", { value: vi.fn() });
  function pointer(
    name: string,
    kind: "mouse" | "touch",
    y: number,
    time: number,
    buttons = 1,
  ) {
    const event = new PointerEvent(name, {
      bubbles: true,
      pointerType: kind,
      pointerId: 1,
      clientX: 50,
      clientY: y,
      buttons,
    });
    Object.defineProperty(event, "timeStamp", { value: time });
    fireEvent(canvas, event);
  }
  pointer("pointerdown", "mouse", 20, 100);
  pointer("pointermove", "mouse", 21, 150);
  pointer("pointermove", "mouse", 80, 350);
  pointer("pointermove", "mouse", 95, 500);
  pointer("pointerup", "mouse", 100, 550, 0);
  fireEvent.click(canvas, { clientX: 50, clientY: 100 });
  await waitFor(() =>
    expect(events).toEqual([
      { type: "move", x: 50, y: 21 },
      { type: "down", x: 50, y: 20 },
      { type: "up", x: 50, y: 100 },
    ]),
  );
  pointer("pointerdown", "touch", 180, 600);
  pointer("pointermove", "touch", 178, 650);
  pointer("pointermove", "touch", 140, 800);
  pointer("pointermove", "touch", 125, 1000);
  pointer("pointerup", "touch", 125, 1010, 0);
  fireEvent.click(canvas, { clientX: 50, clientY: 125 });
  await waitFor(() =>
    expect(events.slice(3)).toEqual([
      { type: "wheel", x: 50, y: 140, deltaX: 0, deltaY: 40 },
      { type: "wheel", x: 50, y: 125, deltaX: 0, deltaY: 15 },
    ]),
  );
});
