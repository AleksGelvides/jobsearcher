import { useState } from "react";
import { Chip, Heading, Metrics, Panel } from "../app/ui";
import type { Vacancy, Workspace } from "../model";
import { salary, searchVacancies, type Filter, type Sort } from "./search";

function vacancyUrl(id: string) {
  return `#/vacancies/${id}`;
}

export function Dashboard({
  data,
  active,
}: {
  data: Workspace;
  active: boolean;
}) {
  const featured = ["java-backend", "middle-plus", "kotlin"].flatMap((id) =>
    data.vacancies.filter((job) => job.id === id),
  );
  const values = data.demo ? [24, 12, 18, 4] : [0, 0, 0, 0];
  const steps = [
    ["Добавьте резюме", "Загрузите PDF и проверьте навыки", "resumes"],
    ["Выберите вакансию", "Оцените совпадение и требования", "vacancies"],
    ["Подготовьте отклик", "Получите новое резюме и письмо", "applications"],
  ];
  return (
    <>
      <Heading
        title="Добрый день!"
        description="Всё, что происходит с вашим поиском работы, в одном месте."
        mobileDescription="Поиск работы под контролем"
      />
      <div className="dashboard-status">
        <a href="#/automation">
          <Chip tone={active ? "green" : "blue"}>
            <span className="desktop-only">
              {active ? "● Автопоиск активен" : "Автопоиск остановлен"}
            </span>
            <span className="mobile-only">
              {active ? "● HH Recruiter активен" : "HH Recruiter не активен"}
            </span>
          </Chip>
        </a>
      </div>
      <Metrics
        items={[
          {
            label: "Новые вакансии",
            value: values[0],
            detail: data.demo ? "+8 за последние сутки" : "За последние сутки",
          },
          {
            label: "Подходящие вакансии",
            mobile: "Подходят",
            value: values[1],
            detail: "Совпадение от 75%",
          },
          {
            label: "Отправлено откликов",
            mobile: "Отклики",
            value: values[2],
            detail: data.demo ? "+3 за сегодня" : "За сегодня",
            green: true,
          },
          {
            label: "Ответы работодателей",
            mobile: "Приглашения",
            value: values[3],
            detail: data.demo ? "2 приглашения" : "Приглашения",
            green: true,
          },
        ]}
      />
      <div className="columns dashboard-columns">
        <Panel className="recommendations">
          <div className="panel-heading">
            <div>
              <h2>
                <span className="desktop-only">Лучшие совпадения</span>
                <span className="mobile-only">Рекомендуем сегодня</span>
              </h2>
              <p className="desktop-only">
                Вакансии, которые стоит рассмотреть
              </p>
            </div>
            <a className="action desktop-only" href="#/vacancies">
              Все вакансии&nbsp; →
            </a>
          </div>
          {featured.length === 0 && (
            <p>Подключите источник, чтобы увидеть рекомендации.</p>
          )}
          <div className="recommended-list">
            {featured.map((job, index) => (
              <a href={vacancyUrl(job.id)} className="recommended" key={job.id}>
                <span
                  className={`letter desktop-only ${index === 0 ? "accent" : ""}`}
                  aria-hidden="true"
                >
                  {["J", "S", "K"][index]}
                </span>
                <span className="recommended-name">
                  <strong>{job.title}</strong>
                  <small>{job.company} • Удалённо</small>
                </span>
                <small className="desktop-only">
                  {job.skills.slice(0, 3).join(" · ")}
                </small>
                <Chip tone={index === 0 ? "green" : "blue"}>{job.score}%</Chip>
                <span className="text-link mobile-only">Посмотреть →</span>
              </a>
            ))}
          </div>
        </Panel>
        <Panel className="automation-summary desktop-only">
          <div className="panel-heading">
            <h2>Автоматизация</h2>
            <Chip tone={active ? "green" : "blue"}>
              {active ? "Работает" : "Остановлена"}
            </Chip>
          </div>
          <div className="mt-6">
            <h3>HH Recruiter</h3>
            <p>Поиск и обработка вакансий hh.ru</p>
          </div>
          <dl className="summary-data">
            <div>
              <dt>Последний запуск</dt>
              <dd>{data.demo ? "Сегодня, 14:00" : "—"}</dd>
            </div>
            <div>
              <dt>Следующий запуск</dt>
              <dd>{active ? "Сегодня, 15:00" : "—"}</dd>
            </div>
          </dl>
          <a className="primary" href="#/automation">
            Открыть настройки
          </a>
        </Panel>
      </div>
      {active && (
        <a className="mobile-only mobile-banner" href="#/automation">
          Следующий запуск HH: через 1 час
        </a>
      )}
      <Panel className="getting-started desktop-only">
        <h2>Как начать работу</h2>
        <div className="steps">
          {steps.map(([label, description, path], i) => (
            <a href={`#/${path}`} key={path}>
              <span className={`step-number ${i === 0 ? "step-green" : ""}`}>
                0{i + 1}
              </span>
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </a>
          ))}
        </div>
      </Panel>
    </>
  );
}

const filterOptions: { id: Filter; label: string }[] = [
  { id: "java", label: "Java" },
  { id: "remote", label: "Удалённо" },
  { id: "salary", label: "от 200 000 ₽" },
  { id: "source", label: "hh.ru" },
];
const starterIds = [
  "java-backend",
  "senior-java",
  "java-kotlin",
  "middle-java",
];

export function Vacancies({
  vacancies,
  demo,
}: {
  vacancies: Vacancy[];
  demo: boolean;
}) {
  const [input, setInput] = useState(demo ? "Java Backend Developer" : "");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sort, setSort] = useState<Sort>("match");
  const initial = demo && !query && !filters.length && sort === "match";
  const visible = initial
    ? vacancies.filter(({ id }) => starterIds.includes(id))
    : searchVacancies(vacancies, query, filters, sort);

  return (
    <>
      <Heading
        title="Вакансии"
        description="Подбор под ваш профиль и заданные условия."
        mobileDescription="Подобраны под ваш опыт"
      />
      <form
        className="search-bar panel"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(input.trim());
        }}
      >
        <label className="search-input">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Поиск вакансий"
            placeholder="Должность или навык"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setQuery(event.target.value.trim());
            }}
          />
        </label>
        <button
          type="button"
          className="action desktop-only"
          aria-pressed={filters.includes("remote")}
          onClick={() =>
            setFilters((current) =>
              current.includes("remote")
                ? current.filter((filter) => filter !== "remote")
                : [...current, "remote"],
            )
          }
        >
          Удалённо
        </button>
        <span className="desktop-only search-level">Middle–Senior</span>
        <button className="primary desktop-only">Найти вакансии</button>
      </form>
      <div className="filter-list" aria-label="Фильтры">
        {filterOptions.map(({ id, label }) => (
          <button
            key={id}
            className={`chip chip-blue filter-${id}`}
            aria-pressed={filters.includes(id)}
            onClick={() =>
              setFilters((current) =>
                current.includes(id)
                  ? current.filter((item) => item !== id)
                  : [...current, id],
              )
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div className="search-summary">
        <strong role="status">Найдено: {visible.length}</strong>
        <label>
          <span className="desktop-only">Сортировка: </span>
          <select
            aria-label="Сортировка"
            value={sort}
            onChange={(event) =>
              setSort(event.target.value === "salary" ? "salary" : "match")
            }
          >
            <option value="match">по совпадению ↓</option>
            <option value="salary">по зарплате ↓</option>
          </select>
        </label>
      </div>
      {!visible.length && (
        <Panel>
          <h2>Вакансий пока нет</h2>
          <p>
            {demo
              ? "Измените запрос или снимите фильтры."
              : "Источники вакансий ещё не подключены."}
          </p>
        </Panel>
      )}
      <div className="vacancy-list">
        {visible.map((job) => (
          <Panel key={job.id} className="vacancy">
            <span
              className={`letter desktop-only ${job.id === "java-backend" ? "accent" : ""}`}
              aria-hidden="true"
            >
              {job.title[0]}
            </span>
            <div className="vacancy-name">
              <h2>
                <a href={vacancyUrl(job.id)}>{job.title}</a>
              </h2>
              <p>
                {job.company}
                {job.remote && " • Удалённо"}
              </p>
              <small className="desktop-only">{job.skills.join(", ")}</small>
            </div>
            <strong className="vacancy-salary">{salary(job.salary)}</strong>
            <div className="vacancy-score">
              {job.score !== undefined && (
                <Chip tone={job.score >= 90 ? "green" : "blue"}>
                  {job.score}%<span className="desktop-only"> совпадение</span>
                </Chip>
              )}
            </div>
            <a className="vacancy-more" href={vacancyUrl(job.id)}>
              Подробнее<span className="mobile-only">&nbsp;о вакансии</span>
              &nbsp; →
            </a>
          </Panel>
        ))}
      </div>
    </>
  );
}

const analysis = [
  ["Java 17, Spring Framework", "Опыт в ЛАНИТ и собственных проектах"],
  ["Микросервисная архитектура", "ЭЛТЕКС: проектирование и развитие сервисов"],
  ["PostgreSQL, Redis", "Автоматизация отказоустойчивости"],
  ["REST API, интеграции", "ЕГРЮЛ/ЕГРИП и сетевое оборудование"],
];
const exampleLetter =
  "Здравствуйте! Заинтересовала позиция в команде распределённых сервисов.\n\nБуду рад рассказать о своём опыте Java-разработки и обсудить задачи вашей команды.";

export function VacancyDetail({
  vacancy,
  demo,
}: {
  vacancy: Vacancy;
  demo: boolean;
}) {
  const [letter, setLetter] = useState(exampleLetter);
  const [prepared, setPrepared] = useState(false);
  const hasAnalysis = demo && vacancy.id === "java-backend";
  return (
    <>
      <div className="desktop-only">
        <Heading
          title="Разбор вакансии"
          description="Что совпадает с профилем и как подготовить отклик."
        />
      </div>
      <a className="text-link back-link" href="#/vacancies">
        ←&nbsp; <span className="desktop-only">Назад к вакансиям</span>
        <span className="mobile-only">К вакансиям</span>
      </a>
      <div className="columns detail-columns">
        <div className="panel detail-analysis">
          <div className="detail-title">
            <h1 className="mobile-only">{vacancy.title}</h1>
            <h2 className="desktop-only">{vacancy.title}</h2>
            <p>
              {vacancy.company}
              {vacancy.remote && " · Удалённо"} · {salary(vacancy.salary)}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {vacancy.score !== undefined && (
                <Chip tone="green">{vacancy.score}% совпадение</Chip>
              )}
              <Chip>{vacancy.source}</Chip>
            </div>
          </div>
          <section className="analysis-list">
            <h2>
              <span className="desktop-only">Почему вакансия подходит</span>
              <span className="mobile-only">Почему подходит</span>
            </h2>
            {hasAnalysis ? (
              <ul>
                {[
                  ...analysis,
                  [
                    "Kafka: нужен конкретный пример",
                    "Информации недостаточно. Стоит раскрыть опыт на интервью.",
                  ],
                ].map(([title, description], i) => (
                  <li
                    key={title}
                    className={i === 3 ? "desktop-only" : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={i === 4 ? "warning" : ""}
                    >
                      {i === 4 ? "!" : "✓"}
                    </span>
                    <div>
                      <strong className="desktop-only">{title}</strong>
                      <strong className="mobile-only">
                        {
                          [
                            "Java 17, Spring Boot",
                            "Микросервисы и REST API",
                            "PostgreSQL и Redis",
                            "",
                            "Kafka: раскрыть опыт",
                          ][i]
                        }
                      </strong>
                      <p className="desktop-only">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Подробный анализ пока недоступен.</p>
            )}
          </section>
        </div>
        <Panel className="preparation">
          <h2>Подготовка отклика</h2>
          <div
            className={
              prepared ? "letter-fields" : "letter-fields desktop-only"
            }
          >
            <h3>Персонализированное резюме</h3>
            <div className="document-box">
              <span aria-hidden="true">▤</span>
              <div>
                <strong>
                  {vacancy.title} · {vacancy.company}
                </strong>
                <small>
                  {demo
                    ? "Демонстрационная версия · предпросмотр"
                    : "Резюме ещё не создано"}
                </small>
              </div>
            </div>
            <label className="letter-label">
              Сопроводительное письмо
              <textarea
                value={letter}
                onChange={(event) => setLetter(event.target.value)}
                rows={6}
              />
            </label>
            <button className="action" onClick={() => setLetter(exampleLetter)}>
              Восстановить шаблон
            </button>
            <button className="primary" disabled>
              Отправить отклик
            </button>
            <small>Отправка доступна после подключения сервера.</small>
          </div>
          {!prepared && (
            <div className="mobile-only preparation-preview">
              <p>▤&nbsp; Резюме под вакансию</p>
              <p>✓&nbsp; Сопроводительное письмо</p>
              <small>Проверьте изменения перед отправкой</small>
            </div>
          )}
        </Panel>
      </div>
      {!prepared && (
        <button
          className="primary mobile-only prepare-mobile"
          onClick={() => setPrepared(true)}
        >
          Подготовить отклик
        </button>
      )}
    </>
  );
}
