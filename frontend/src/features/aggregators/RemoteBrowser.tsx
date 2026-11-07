import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  copySelection,
  readFrame,
  sendInput,
  type BrowserInput,
} from "./login";

const navigationKeys = new Set([
  "Tab",
  "Enter",
  "Backspace",
  "Delete",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

export function RemoteBrowser({ id }: { id: string }) {
  const surface = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const send = useRef<(input: BrowserInput) => void>(() => {});
  const [ready, setReady] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const lastMove = useRef(0);
  const drag = useRef<{ x: number; y: number; active: boolean } | undefined>(
    undefined,
  );
  const copy = useRef<() => void>(() => {});
  const [clipboardError, setClipboardError] = useState("");
  const touch = useRef<{ x: number; y: number; moved: boolean } | undefined>(
    undefined,
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let pending = Promise.resolve();
    let queued = 0;
    let timer: number | undefined;

    send.current = (input) => {
      if (
        (queued >= 24 && input.type !== "up") ||
        (input.type === "move" && queued > 0)
      )
        return;
      queued++;
      pending = pending
        .then(async () => {
          if (signal.aborted) return;
          const response = await sendInput(id, input, signal);
          if (!response.ok) setConnectionError(true);
        })
        .catch(() => {
          if (!signal.aborted) setConnectionError(true);
        })
        .finally(() => {
          queued--;
        });
    };

    copy.current = () => {
      setClipboardError("");
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        setClipboardError("Браузер не разрешил доступ к буферу обмена.");
        return;
      }
      // Keep the clipboard request in the user gesture. Read the remote selection
      // after any preceding click or Select All has reached Chromium.
      const data = pending.then(() => copySelection(id));
      void data.catch(() => {});
      void navigator.clipboard
        .write([new ClipboardItem({ "text/plain": data })])
        .catch(() => {
          if (!signal.aborted)
            setClipboardError("Не удалось скопировать выделение.");
        });
    };

    async function refresh() {
      try {
        const response = await readFrame(id, signal);
        if (response.status === 429 || response.status === 204) return;
        if (!response.ok) throw new Error("Frame unavailable");
        const frame = await createImageBitmap(await response.blob());
        try {
          if (!signal.aborted) {
            canvas.current?.getContext("2d")?.drawImage(frame, 0, 0);
            setReady(true);
            setConnectionError(false);
          }
        } finally {
          frame.close();
        }
      } catch {
        if (!signal.aborted) setConnectionError(true);
      } finally {
        if (!signal.aborted) timer = window.setTimeout(refresh, 180);
      }
    }

    const target = surface.current;
    function beforeInput(event: InputEvent) {
      event.preventDefault();
      if (event.inputType === "insertText" && event.data) {
        send.current({ type: "text", value: event.data });
      } else if (event.inputType === "deleteContentBackward") {
        send.current({ type: "key", value: "Backspace" });
      }
    }

    function wheel(event: WheelEvent) {
      event.preventDefault();
      const scale = event.deltaMode === 0 ? 1 : 24;
      const limit = (delta: number) =>
        Math.max(-3000, Math.min(3000, delta * scale));
      send.current({
        type: "wheel",
        ...coordinates(event),
        deltaX: limit(event.deltaX),
        deltaY: limit(event.deltaY),
      });
    }

    target?.addEventListener("beforeinput", beforeInput);
    target?.addEventListener("wheel", wheel, { passive: false });
    void refresh();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      target?.removeEventListener("beforeinput", beforeInput);
      target?.removeEventListener("wheel", wheel);
    };
  }, [id]);

  function coordinates(event: { clientX: number; clientY: number }) {
    const element = canvas.current!;
    const rect = element.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          element.width - 1,
          ((event.clientX - rect.left) * element.width) / rect.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          element.height - 1,
          ((event.clientY - rect.top) * element.height) / rect.height,
        ),
      ),
    };
  }

  function paste(text: string) {
    if (!ready || !text) return;
    if (text.length > 512) {
      setClipboardError("Можно вставить до 512 символов за раз.");
      return;
    }
    setClipboardError("");
    send.current({ type: "paste", value: text });
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    const { key, shiftKey, ctrlKey, metaKey } = event;
    if ((ctrlKey || metaKey) && key.toLowerCase() === "c") {
      event.preventDefault();
      if (ready) copy.current();
    } else if ((ctrlKey || metaKey) && key.toLowerCase() === "v") {
      // Let the platform shortcut dispatch a native paste event without a permission prompt.
      const apple = /Mac|iPhone|iPad/.test(navigator.platform);
      if (apple ? metaKey : ctrlKey) return;
      event.preventDefault();
      if (ready) {
        void navigator.clipboard
          ?.readText()
          .then(paste)
          .catch(() => {
            setClipboardError("Браузер не разрешил чтение буфера обмена.");
          });
      }
    } else if ((ctrlKey || metaKey) && key.toLowerCase() === "a") {
      event.preventDefault();
      send.current({ type: "key", value: "ControlOrMeta+a" });
    } else if (!ctrlKey && !metaKey && [...key].length === 1) {
      event.preventDefault();
      send.current({ type: "text", value: key });
    } else if (navigationKeys.has(key)) {
      // Escape leaves the viewer so the dialog can be dismissed by keyboard.
      if (key === "Escape") {
        event.currentTarget.blur();
        return;
      }
      event.preventDefault();
      send.current({
        type: "key",
        value: key === "Tab" && shiftKey ? "Shift+Tab" : key,
      });
    }
  }

  return (
    <div className="remote-browser">
      <p role="status">
        {connectionError
          ? "Восстанавливаем изображение…"
          : "Окно браузера открыто"}
      </p>
      {clipboardError && <p role="alert">{clipboardError}</p>}
      <div
        ref={surface}
        className="remote-browser-surface"
        role="application"
        aria-label="Удалённый браузер. Escape освобождает клавиатуру."
        tabIndex={0}
        contentEditable={ready}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onKeyDown={keyDown}
        onCopy={(event) => {
          event.preventDefault();
          if (ready) copy.current();
        }}
        onPaste={(event) => {
          event.preventDefault();
          paste(event.clipboardData.getData("text/plain"));
        }}
        onDrop={(event) => event.preventDefault()}
      >
        <canvas
          ref={canvas}
          width={900}
          height={640}
          contentEditable={false}
          onClick={(event) => {
            if (touch.current?.moved || drag.current?.active) return;
            surface.current?.focus();
            if (ready) send.current({ type: "click", ...coordinates(event) });
          }}
          onPointerDown={(event) => {
            drag.current = undefined;
            if (ready && event.pointerType === "mouse" && event.button === 0) {
              drag.current = { ...coordinates(event), active: false };
              event.currentTarget.setPointerCapture(event.pointerId);
              surface.current?.focus();
            }
            touch.current =
              event.pointerType === "touch"
                ? { ...coordinates(event), moved: false }
                : undefined;
          }}
          onPointerUp={(event) => {
            if (drag.current?.active)
              send.current({ type: "up", ...coordinates(event) });
          }}
          onPointerCancel={(event) => {
            if (drag.current?.active)
              send.current({ type: "up", ...coordinates(event) });
          }}
          onPointerMove={(event) => {
            if (!ready || event.timeStamp - lastMove.current <= 100) return;
            lastMove.current = event.timeStamp;
            const position = coordinates(event);
            const start = touch.current;
            if (event.pointerType !== "touch") {
              const mouse = drag.current;
              if (
                mouse &&
                !mouse.active &&
                event.buttons === 1 &&
                Math.hypot(position.x - mouse.x, position.y - mouse.y) > 4
              ) {
                send.current({ type: "down", x: mouse.x, y: mouse.y });
                mouse.active = true;
              }
              send.current({ type: "move", ...position });
            } else if (
              start &&
              (start.moved || Math.abs(start.y - position.y) > 12)
            ) {
              send.current({
                type: "wheel",
                ...position,
                deltaX: 0,
                deltaY: start.y - position.y,
              });
              touch.current = { ...position, moved: true };
            }
          }}
        />
      </div>
    </div>
  );
}
