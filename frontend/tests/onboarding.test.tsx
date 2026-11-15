import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { App } from "../src/app/App";
import { LiveApp } from "../src/app/LiveApp";
import { Onboarding } from "../src/features/onboarding/Onboarding";
import { demoData } from "../src/mocks/data";
import type { Candidate } from "../src/model";

const blank: Candidate = {
  name: "",
  role: "",
  city: "",
  arrangement: "",
  level: "",
  salary: 0,
  skills: [],
  experience: "",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

test("validates input, keeps answers when going back and allows editing from review", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <Onboarding candidate={{ ...blank, name: "Алексей" }} onSave={save} />,
  );

  expect(screen.queryByLabelText(/^Имя/)).toBeNull();
  fill(/^Желаемая должность/, " ");
  click("Далее");
  expect(screen.getByRole("alert").textContent).toContain(
    "Укажите желаемую должность",
  );
  fill(/^Желаемая должность/, "Java Developer");
  click("Далее");
  fill(/^Зарплата/, "200000");
  click("Назад");
  expect(screen.getByDisplayValue("Java Developer")).toBeDefined();
  click("Далее");
  expect(screen.getByDisplayValue("200000")).toBeDefined();
  click("Далее");
  fill(/^Компания/, "Компания");
  click("Далее");
  expect(screen.getByRole("alert").textContent).toContain(
    "компанию и должность",
  );
  fill(/^Должность/, "Инженер");
  click("Далее");
  fill(/^Навыки/, "Java, Spring, Java");
  fill(/^Моя профессиональная история/, "Разрабатываю API");
  click("Далее");
  expect(screen.getByText("Компания · Инженер")).toBeDefined();
  click("Изменить: Должность и город");
  fill(/^Город/, "Новосибирск");
  click("Далее");
  expect(screen.getByText("Java Developer · Новосибирск")).toBeDefined();
  click("Сохранить профиль");
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      role: "Java Developer",
      city: "Новосибирск",
      salary: 200000,
      skills: ["Java", "Spring"],
      experience: "Разрабатываю API",
      workExperience: [
        {
          company: "Компания",
          role: "Инженер",
          from: "",
          to: "",
          description: "",
        },
      ],
    }),
  );
  await screen.findByRole("button", { name: "Сохранить профиль" });
});

test("keeps answers if saving fails and displays the persisted profile after retry", async () => {
  window.history.replaceState({}, "", "/#/profile");
  const candidate = { ...blank, name: "Алексей", role: "Java Developer" };
  const csrf = { token: "token", headerName: "X-CSRF-TOKEN" };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ ...demoData, candidate: { ...blank, name: "Алексей" } }),
    )
    .mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json(csrf))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetch);
  render(<LiveApp />);
  expect(
    await screen.findByRole("heading", { name: "С какой должности начнём?" }),
  ).toBeDefined();
  expect(screen.queryByLabelText(/^Имя/)).toBeNull();
  fill(/^Желаемая должность/, candidate.role);
  click("Далее");
  click("Далее");
  click("Пропустить шаг");
  click("Пропустить шаг");
  click("Сохранить профиль");
  expect(await screen.findByRole("alert")).toBeDefined();
  expect(screen.getByText("Java Developer")).toBeDefined();
  click("Сохранить профиль");
  expect((await screen.findAllByText("Алексей")).length).toBeGreaterThan(0);
  expect(window.location.hash).toBe("#/profile");
  expect(fetch.mock.calls[4][0]).toBe("/api/v1/onboarding");
  const { name, ...answers } = candidate;
  expect(name).toBe("Алексей");
  expect(fetch.mock.calls[4][1].method).toBe("POST");
  expect(JSON.parse(fetch.mock.calls[4][1].body)).toEqual({
    ...answers,
    workExperience: [],
  });
});

test("opens onboarding in the ordinary frontend and uses completed answers in the profile", async () => {
  window.history.replaceState({}, "", "/#/profile");
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ token: "token", headerName: "X-CSRF-TOKEN" }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetch);
  render(
    <App data={{ ...demoData, demo: false, candidate: blank }} firstRun />,
  );
  expect(
    screen.getByRole("heading", { name: "С какой должности начнём?" }),
  ).toBeDefined();
  fill(/^Желаемая должность/, "Java Developer");
  fill(/^Город/, "Новосибирск");
  click("Далее");
  click("Далее");
  click("Пропустить шаг");
  click("Пропустить шаг");
  click("Сохранить профиль");
  await screen.findByText("Личный кабинет");
  expect(screen.getAllByText(/Java Developer/).length).toBeGreaterThan(0);
  expect(fetch.mock.calls[1][0]).toBe("/api/v1/onboarding");
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
    role: "Java Developer",
    city: "Новосибирск",
  });
});
