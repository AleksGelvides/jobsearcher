import { useEffect, useRef, useState } from "react";
import { Panel } from "../../app/ui";
import { headHunter } from "./catalog";
import { closeLogin, loginStatus, openLogin } from "./login";
import { RemoteBrowser } from "./RemoteBrowser";
import "./aggregators.css";

type DialogState = "opening" | "open" | "error" | "expired" | "confirmed";

export function Aggregators() {
  const [state, setState] = useState<DialogState>();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const session = useRef<string | undefined>(undefined);
  const attempt = useRef(0);
  const visible = state !== undefined;

  useEffect(() => {
    if (!visible) return;
    const element = dialog.current;
    const opener = trigger.current;
    element?.showModal();
    return () => {
      element?.close();
      opener?.focus();
    };
  }, [visible]);

  function stop() {
    attempt.current += 1;
    if (session.current) void closeLogin(session.current);
    session.current = undefined;
  }

  useEffect(() => stop, []);

  useEffect(() => {
    if (state !== "open") return;
    const id = session.current;
    if (!id) return;
    const current = attempt.current;
    async function check(browserId: string) {
      const step = await loginStatus(browserId).catch(() => "error" as const);
      if (current !== attempt.current) return;
      if (step === "open") {
        timer = window.setTimeout(() => void check(browserId), 1500);
        return;
      }
      if (step === "confirmed") session.current = undefined;
      stop();
      setState(step);
    }

    let timer = window.setTimeout(() => void check(id), 1500);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function launch() {
    const current = ++attempt.current;
    setState("opening");
    try {
      const id = await openLogin();
      if (current !== attempt.current) {
        void closeLogin(id);
        return;
      }
      session.current = id;
      setState("open");
    } catch {
      if (current === attempt.current) setState("error");
    }
  }

  function dismiss() {
    stop();
    setState(undefined);
  }

  const confirmed = state === "confirmed";
  const terminal = confirmed || state === "error" || state === "expired";

  return (
    <Panel className="aggregators">
      <h2 className="desktop-only">Агрегаторы вакансий</h2>
      <h1 className="mobile-only">Агрегаторы вакансий</h1>
      <p>AI ищет вакансии на подключённых площадках.</p>
      <div className="aggregator-list">
        <button
          className="aggregator-card"
          aria-haspopup="dialog"
          onClick={(event) => {
            trigger.current = event.currentTarget;
            void launch();
          }}
        >
          <strong>{headHunter.label}</strong>
          <span>Тестовая площадка · Требуется вход</span>
          <span>Войдите в аккаунт HH.ru, чтобы подключить поиск вакансий.</span>
        </button>
      </div>

      {state && (
        <dialog
          ref={dialog}
          className={`aggregator-dialog ${terminal ? "aggregator-result" : "aggregator-login"}`}
          aria-labelledby="aggregator-title"
          onCancel={(event) => {
            event.preventDefault();
            dismiss();
          }}
        >
          <div className="aggregator-dialog-content">
            <div className="panel-heading">
              <h2 id="aggregator-title">Подключение {headHunter.name}</h2>
              {!terminal && (
                <button
                  className="aggregator-option aggregator-close"
                  onClick={dismiss}
                >
                  Закрыть
                </button>
              )}
            </div>
            {confirmed ? (
              <>
                <p role="status">Вход на {headHunter.name} подтверждён</p>
                <button
                  className="primary aggregator-result-continue"
                  onClick={dismiss}
                >
                  Продолжить
                </button>
              </>
            ) : terminal ? (
              <>
                <p role="alert">
                  {state === "expired"
                    ? "Сеанс браузера завершён. Откройте новый сеанс, чтобы продолжить."
                    : `Не удалось подтвердить вход на ${headHunter.name}`}
                </p>
                <div className="actions aggregator-result-actions">
                  <button className="aggregator-option" onClick={dismiss}>
                    Отмена
                  </button>
                  <button className="primary" onClick={() => void launch()}>
                    Попробовать снова
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  Войдите в аккаунт на сайте площадки в удалённом браузере ниже.
                </p>
                <div className="aggregator-browser">
                  <div className="aggregator-address">{headHunter.url}</div>
                  {state === "open" && session.current ? (
                    <RemoteBrowser id={session.current} />
                  ) : (
                    <div className="aggregator-browser-content">
                      <span className="aggregator-hh" aria-hidden="true">
                        hh
                      </span>
                      <h3>Вход</h3>
                      <p role="status">Открываем окно браузера…</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </dialog>
      )}
    </Panel>
  );
}
