import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { App } from "../src/app/App";
import { demoData } from "../src/mocks/data";
import { resumeError, salary, searchVacancies } from "../src/features/search";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function route(path: string) {
  window.history.replaceState({}, "", "/#/" + path);
  fireEvent(window, new HashChangeEvent("hashchange"));
}
function click(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}
function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

test("search is case insensitive, composes filters and sorts missing data last", () => {
  const jobs = demoData.vacancies;
  const localJob = {
    ...jobs[0],
    remote: false,
    score: undefined,
    source: "Другой",
    id: "local",
  };
  expect(
    searchVacancies([...jobs, localJob], " JAVA   FINTECH ", [], "match"),
  ).toEqual([]);
  expect(
    searchVacancies(
      [...jobs, localJob],
      "java финтех",
      ["remote", "source", "salary", "java"],
      "match",
    ),
  ).toEqual([jobs[0]]);
  expect(
    searchVacancies([...jobs, localJob], "kotlin", ["java"], "salary").map(
      (job) => job.id,
    ),
  ).toEqual(["java-kotlin"]);
  expect(searchVacancies([...jobs, localJob], "", [], "match").at(-1)).toEqual(
    localJob,
  );
  expect(searchVacancies(jobs, "", [], "salary")[0].salary).toBe(300000);
  expect(salary(null)).toBe("не указана");
  expect(resumeError({ name: "data.txt", size: 100 })).toMatch(/PDF/);
  expect(resumeError({ name: "data.docx", size: 0 })).toMatch(/10 МБ/);
  expect(resumeError({ name: "data.pdf", size: 11 * 1024 * 1024 })).toMatch(
    /10 МБ/,
  );
  expect(resumeError({ name: "data.PDF", size: 100 })).toBe("");
});

test("dashboard, filters, sorting and vacancy preparation are connected", () => {
  render(<App data={demoData} />);
  click("Сведения о рабочем пространстве");
  expect(screen.getByRole("status").textContent).toMatch(/Демонстрационное/);
  click("Сведения о рабочем пространстве");
  route("vacancies");
  expect(screen.getByRole("status").textContent).toBe("Найдено: 4");
  const filters = screen.getAllByRole("button", {
    name: "Удалённо",
  });
  for (const filter of filters) {
    fireEvent.click(filter);
    expect(filter.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(filter);
    expect(filter.getAttribute("aria-pressed")).toBe("false");
  }
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "нет совпадений" },
  });
  expect(screen.getByText("Вакансий пока нет")).toBeDefined();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Сортировка" }), {
    target: { value: "salary" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Сортировка" }), {
    target: { value: "match" },
  });
  fireEvent.submit(screen.getByRole("search"));
  route("vacancies/java-backend");
  expect(screen.getByText(/Kafka: нужен/)).toBeDefined();
  click("Подготовить отклик");
  type("Сопроводительное письмо", "Черновик");
  expect(screen.getByDisplayValue("Черновик")).toBeDefined();
  click("Восстановить шаблон");
  expect(screen.getByDisplayValue(/Здравствуйте/)).toBeDefined();
  expect(
    (
      screen.getByRole("button", {
        name: "Отправить отклик",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  route("vacancies/senior-java");
  expect(screen.getByText("Подробный анализ пока недоступен.")).toBeDefined();
  route("vacancies/unavailable");
  expect(screen.getByText("Вакансия недоступна")).toBeDefined();
});

test("profile edits, skill deduplication and local resume validation", () => {
  render(<App data={demoData} />);
  route("profile");
  click("Редактировать профиль");
  type("Имя", " ");
  click("Сохранить профиль");
  expect(screen.getByRole("alert").textContent).toMatch(/Введите имя/);
  type("Имя", "Тестовый Кандидат");
  click("Сохранить профиль");
  expect(screen.getByRole("status").textContent).toMatch(/Профиль обновлён/);
  for (const value of [" ", "java", "JUnit"]) {
    type("Новый навык", value);
    fireEvent.submit(
      screen.getByRole("button", { name: "+ Добавить навык" }).closest("form")!,
    );
  }
  expect(screen.getByText("JUnit")).toBeDefined();
  click("Посмотреть публичный профиль");
  expect(screen.getByText("Предпросмотр профиля")).toBeDefined();
  click("Вернуться в кабинет");
  route("resumes");
  click("Сведения о файле");
  expect(screen.getByText(/демонстрационный файл/)).toBeDefined();
  const input = screen.getByLabelText("Загрузить резюме");
  fireEvent.change(input, { target: { files: [] } });
  fireEvent.change(input, {
    target: { files: [new File(["sample"], "data.txt")] },
  });
  expect(screen.getByRole("alert").textContent).toMatch(/PDF/);
  fireEvent.change(input, {
    target: { files: [new File(["sample"], "test.pdf")] },
  });
  expect(screen.getByRole("status").textContent).toMatch(/резюме обновлено/);
  click("Сведения о файле");
  expect(screen.getByText("test.pdf · 1 КБ")).toBeDefined();
});

test("application history exposes source and automation remains a local simulation", () => {
  render(<App data={demoData} />);
  route("applications");
  const row = screen.getByText("Java Backend Developer").closest("details")!;
  expect(within(row).getByText("Источник · hh.ru")).toBeDefined();
  route("automation");
  expect(screen.getByText("Нужен вход")).toBeDefined();
  click("Изменить настройки");
  click("Отмена");
  click("Изменить настройки");
  type("Минимальная зарплата", "420000");
  type("Поиск вакансий", "Каждый день");
  click("Сохранить");
  expect(screen.getAllByText("Каждый день").length).toBe(2);
  click("Остановить демо");
  click("Запустить демо");
  route("settings");
  expect(screen.getByText("Приватный профиль")).toBeDefined();
  route("other");
  expect(screen.getByText("Страница не найдена")).toBeDefined();
});

test("disconnected workspace starts empty", () => {
  const data = {
    ...demoData,
    demo: false,
    vacancies: [],
    applications: [],
    runs: [],
    resume: "",
    candidate: {
      ...demoData.candidate,
      name: "",
      role: "",
      experience: "",
      salary: 0,
    },
  };
  render(<App data={data} />);
  fireEvent.click(screen.getByRole("link", { name: "К содержимому" }));
  expect(
    screen.getByText("Подключите источник, чтобы увидеть рекомендации."),
  ).toBeDefined();
  route("vacancies");
  expect(
    screen.getByText("Источники вакансий ещё не подключены."),
  ).toBeDefined();
  route("applications");
  expect(
    screen.getByText("Отправленные отклики появятся здесь."),
  ).toBeDefined();
  route("automation");
  expect(screen.getByText("Запусков пока нет.")).toBeDefined();
  route("profile");
  expect(screen.getByText("Добавьте опыт работы.")).toBeDefined();
});
