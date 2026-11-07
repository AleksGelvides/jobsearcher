import { loginPath } from "./catalog";

const headers = { "X-JobPilot-Launcher": "1" };

export async function openLogin(): Promise<string> {
  const response = await fetch(`${loginPath}/hh`, {
    method: "POST",
    headers,
  });
  if (response.status !== 201) throw new Error("Remote browser unavailable");
  const result: { id: string } = await response.json();
  return result.id;
}

export async function loginStatus(id: string) {
  const response = await fetch(`${loginPath}/${encodeURIComponent(id)}`, {
    headers,
    cache: "no-store",
  });
  if (response.status === 200) {
    const result: { state?: string } = await response.json();
    if (result.state === "confirmed") return "confirmed";
  }
  if (response.status === 204 || response.status === 429) return "open";
  return response.status === 404 ? "expired" : "error";
}

export async function closeLogin(id: string) {
  await fetch(`${loginPath}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers,
    keepalive: true,
  }).catch(() => {});
}

export type BrowserInput =
  | { type: "text" | "key" | "paste"; value: string }
  | { type: "click" | "down" | "up" | "move"; x: number; y: number }
  | { type: "wheel"; x: number; y: number; deltaX: number; deltaY: number };

export function readFrame(id: string, signal: AbortSignal) {
  return fetch(`${loginPath}/${encodeURIComponent(id)}/frame`, {
    headers,
    signal,
    cache: "no-store",
  });
}

export function sendInput(
  id: string,
  input: BrowserInput,
  signal: AbortSignal,
) {
  return fetch(`${loginPath}/${encodeURIComponent(id)}/input`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}

export async function copySelection(id: string): Promise<Blob> {
  const response = await fetch(`${loginPath}/${encodeURIComponent(id)}/copy`, {
    method: "POST",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Selection unavailable");
  const text = await response.text();
  if (!text) throw new Error("No copyable selection");
  return new Blob([text], { type: "text/plain" });
}
