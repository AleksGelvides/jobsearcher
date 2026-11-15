import type {
  Application,
  Candidate,
  OnboardingAnswers,
  Vacancy,
  Workspace,
} from "../../model";

export interface AutomationSettings {
  active: boolean;
  salary: number;
  schedule: string;
  mode: string;
}

export interface VacancyDetails extends Vacancy {
  analysis?: { title: string; description: string }[];
}

export interface ApplicationDraft {
  id: string;
  resumeName: string;
  coverLetter: string;
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const csrf =
    init.method && init.method !== "GET"
      ? await request<{ headerName: string; token: string }>("/csrf")
      : undefined;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (csrf) headers.set(csrf.headerName, csrf.token);
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "same-origin",
    headers,
  });
  if (!response.ok || response.redirected) {
    throw new Error(`Не удалось выполнить запрос (${response.status}).`);
  }
  return response;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init);
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error(`Не удалось выполнить запрос (${response.status}).`);
  }
  return response.json();
}

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const api = {
  workspace: (signal: AbortSignal) =>
    request<Omit<Workspace, "demo"> & { automation: AutomationSettings }>(
      "/workspace",
      { signal },
    ),
  async submitOnboarding(answers: OnboardingAnswers) {
    await send("/onboarding", json("POST", answers));
  },
  saveProfile: (candidate: Candidate) =>
    request<Candidate>("/profile", json("PUT", candidate)),
  uploadResume(file: File) {
    const body = new FormData();
    body.set("file", file);
    return request<{ fileName: string }>("/resumes", { method: "POST", body });
  },
  vacancies: (query: URLSearchParams, signal: AbortSignal) =>
    request<{ items: Vacancy[]; nextCursor?: string }>(`/vacancies?${query}`, {
      signal,
    }),
  vacancy: (id: string, signal: AbortSignal) =>
    request<VacancyDetails>(`/vacancies/${encodeURIComponent(id)}`, { signal }),
  prepare: (id: string) =>
    request<ApplicationDraft>(
      `/vacancies/${encodeURIComponent(id)}/application-draft`,
      { method: "POST" },
    ),
  submit: (id: string, coverLetter: string) =>
    request<Application>(
      `/application-drafts/${encodeURIComponent(id)}/submit`,
      json("POST", { coverLetter }),
    ),
  saveAutomation: (settings: AutomationSettings) =>
    request<AutomationSettings>("/automation", json("PUT", settings)),
};
