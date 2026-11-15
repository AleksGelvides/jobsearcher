import { useEffect, useState } from "react";
import { api } from "../lib/api/client";
import { Onboarding } from "../features/onboarding/Onboarding";
import { App } from "./App";

export function LiveApp() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.workspace>>>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api.workspace(controller.signal).then(setData, () => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [attempt]);

  if (data) {
    if (!data.candidate.role.trim()) {
      return (
        <Onboarding
          candidate={data.candidate}
          onSave={async (answers) => {
            await api.submitOnboarding(answers);
            const candidate = { ...data.candidate, ...answers };
            window.location.hash = "/profile";
            setData({ ...data, candidate });
          }}
        />
      );
    }
    return <App data={{ ...data, demo: false }} live />;
  }
  return (
    <main className="main">
      {error ? (
        <>
          <p role="alert">Не удалось загрузить рабочее пространство.</p>
          <button
            className="primary"
            onClick={() => {
              setError(false);
              setAttempt((value) => value + 1);
            }}
          >
            Попробовать снова
          </button>
        </>
      ) : (
        <p role="status">Загрузка рабочего пространства…</p>
      )}
    </main>
  );
}
