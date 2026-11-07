import { Aggregators } from "./aggregators/Aggregators";
import { useState, type SubmitEvent } from "react";
import { Chip, Heading, Metrics, Panel } from "../app/ui";
import type { Application, Candidate, Status, Workspace } from "../model";
import { money, resumeError } from "./search";

const statusTone: Record<Status, "green" | "blue" | "orange"> = {
  Приглашение: "green",
  "На рассмотрении": "blue",
  Отказ: "orange",
  Отправлено: "blue",
};

export function Applications({
  applications,
  demo,
}: {
  applications: Application[];
  demo: boolean;
}) {
  return (
    <>
      <Heading
        title="Отклики"
        mobile="Мои отклики"
        description="Отслеживайте все этапы найма без таблиц и заметок."
        mobileDescription="История заявок и ответы компаний"
      />
      <Metrics
        items={[
          {
            label: "Всего откликов",
            mobile: "Всего",
            value: demo ? 18 : 0,
            detail: "За последние 30 дней",
          },
          {
            label: "На рассмотрении",
            value: demo ? 11 : 0,
            detail: "Ожидаем ответа",
            desktop: true,
          },
          {
            label: "Приглашения",
            value: demo ? 4 : 0,
            detail: "Требуют внимания",
            green: true,
          },
          {
            label: "Отказы",
            value: demo ? 3 : 0,
            detail: "История сохранена",
            desktop: true,
          },
        ]}
      />
      <Panel className="history">
        <h2>
          <span className="desktop-only">История откликов</span>
          <span className="mobile-only">Последние события</span>
        </h2>
        {applications.length ? (
          <div className="application-table">
            <div
              className="application-row table-head desktop-only"
              aria-hidden="true"
            >
              <span>Вакансия</span>
              <span>Компания</span>
              <span>Статус</span>
              <span>Отправлено</span>
            </div>
            {applications.map((item) => (
              <details className="application" key={item.title}>
                <summary className="application-row">
                  <strong>{item.title}</strong>
                  <span>{item.company}</span>
                  <Chip tone={statusTone[item.status]}>{item.status}</Chip>
                  <span className="desktop-only">{item.date}</span>
                </summary>
                <div className="application-details">
                  <span>Источник · {item.source}</span>
                  <span>Резюме · {item.resume}</span>
                  <span>Отправлено · {item.date}</span>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p>Отправленные отклики появятся здесь.</p>
        )}
      </Panel>
    </>
  );
}

export function Automation({
  data,
  active,
  setActive,
}: {
  data: Workspace;
  active: boolean;
  setActive: (active: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState({
    salary: 200000,
    schedule: "Каждый час",
    mode: "После проверки",
  });
  const lastRun = data.runs[0]?.time ?? "—";

  function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setSettings({
      salary: Number(fields.get("salary")),
      schedule: String(fields.get("schedule")),
      mode: settings.mode,
    });
    setEditing(false);
  }

  return (
    <>
      <div className="desktop-only">
        <Heading
          title="Автоматизация"
          description="Подключённые площадки, расписание и результаты работы агента."
        />
      </div>
      <Panel className="connector desktop-only">
        <div className="panel-heading">
          <div>
            <h2>HH Recruiter</h2>
            <p>Автоматически ищет подходящие вакансии и формирует отклики</p>
          </div>
          <Chip tone={active ? "green" : "blue"}>
            {active ? "● Активен" : "Остановлен"}
          </Chip>
        </div>
        <dl className="connector-grid">
          <div>
            <dt>Периодичность</dt>
            <dd>{settings.schedule}</dd>
          </div>
          <div>
            <dt>Источник</dt>
            <dd>hh.ru</dd>
          </div>
          <div>
            <dt>Последний запуск</dt>
            <dd>{lastRun}</dd>
          </div>
        </dl>
      </Panel>
      <Aggregators />
      <div className="columns automation-columns desktop-only">
        <Panel className="run-history">
          <h2>История запусков</h2>
          {data.runs.length ? (
            <table>
              <thead>
                <tr>
                  <th>Дата и время</th>
                  <th>Найдено</th>
                  <th>Отправлено</th>
                  <th>Результат</th>
                </tr>
              </thead>
              <tbody>
                {data.runs.map((run) => (
                  <tr key={run.time}>
                    <td>{run.time}</td>
                    <td>{run.found}</td>
                    <td>{run.sent}</td>
                    <td>
                      <Chip
                        tone={
                          run.result === "Успешно"
                            ? "green"
                            : run.result === "Нужен вход"
                              ? "orange"
                              : "blue"
                        }
                      >
                        {run.result}
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Запусков пока нет.</p>
          )}
        </Panel>
        <Panel className="automation-settings">
          <h2>Параметры поиска</h2>
          {editing ? (
            <form className="stack" onSubmit={save}>
              <label>
                Минимальная зарплата
                <input
                  name="salary"
                  type="number"
                  min="0"
                  required
                  defaultValue={settings.salary}
                />
              </label>
              <label>
                Поиск вакансий
                <select name="schedule" defaultValue={settings.schedule}>
                  <option>Каждый час</option>
                  <option>Каждый день</option>
                </select>
              </label>
              <div className="actions">
                <button className="primary">Сохранить</button>
                <button
                  type="button"
                  className="action"
                  onClick={() => setEditing(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <>
              <dl className="settings-list">
                <div>
                  <dt>Уровень</dt>
                  <dd>Middle — Senior</dd>
                </div>
                <div>
                  <dt>Формат работы</dt>
                  <dd>Удалённо</dd>
                </div>
                <div>
                  <dt>Минимальная зарплата</dt>
                  <dd>{money(settings.salary)}</dd>
                </div>
                <div>
                  <dt>Поиск вакансий</dt>
                  <dd>{settings.schedule}</dd>
                </div>
                <div>
                  <dt>Создание резюме</dt>
                  <dd>Под каждую вакансию</dd>
                </div>
                <div>
                  <dt>Отправка отклика</dt>
                  <dd>{settings.mode}</dd>
                </div>
              </dl>
              <button className="primary" onClick={() => setEditing(true)}>
                Изменить настройки
              </button>
              <button
                className="action"
                disabled={!data.demo}
                onClick={() => setActive(!active)}
              >
                {active ? "Остановить демо" : "Запустить демо"}
              </button>
              {!data.demo && (
                <small>Запуск доступен после подключения сервера.</small>
              )}
            </>
          )}
        </Panel>
      </div>
    </>
  );
}

interface ProfileProps {
  candidate: Candidate;
  setCandidate: (candidate: Candidate) => void;
  resume: File | null;
  setResume: (file: File) => void;
  original: string;
  demo: boolean;
  resumesOnly?: boolean;
}
const candidateFields = [
  ["name", "Имя"],
  ["role", "Желаемая должность"],
  ["city", "Город"],
  ["arrangement", "Формат работы"],
  ["level", "Уровень"],
] as const;

export function Profile({
  candidate,
  setCandidate,
  resume,
  setResume,
  original,
  demo,
  resumesOnly,
}: ProfileProps) {
  const [editing, setEditing] = useState(false);
  const [publicView, setPublicView] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [skill, setSkill] = useState("");
  const initials =
    candidate.name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("") || "Я";
  const fileName = resume?.name ?? original;

  function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const updated = { ...candidate };
    for (const [key] of candidateFields)
      updated[key] = String(fields.get(key)).trim();
    if (!updated.name || !updated.role) {
      setError("Введите имя и желаемую должность.");
      return;
    }
    updated.salary = Number(fields.get("salary"));
    updated.experience = String(fields.get("experience")).trim();
    setCandidate(updated);
    setEditing(false);
    setError("");
    setMessage("Профиль обновлён в этой сессии.");
  }

  function upload(file?: File) {
    if (!file) return;
    const issue = resumeError(file);
    setError(issue);
    if (issue) {
      setMessage("");
      return;
    }
    setResume(file);
    setMessage("Основное резюме обновлено в этой сессии.");
    setPreview(false);
  }

  function addSkill(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = skill.trim();
    if (
      !value ||
      candidate.skills.some(
        (item) => item.toLowerCase() === value.toLowerCase(),
      )
    )
      return;
    setCandidate({ ...candidate, skills: [...candidate.skills, value] });
    setSkill("");
  }

  const resumePanel = (
    <Panel className="resume-panel">
      <h2>
        <span className="desktop-only">Моё резюме</span>
        <span className="mobile-only">Основное резюме</span>
      </h2>
      <p className="desktop-only">
        Базовый документ для персонализации откликов
      </p>
      {fileName ? (
        <div className="document-box">
          <span aria-hidden="true">▤</span>
          <div>
            <strong>{fileName}</strong>
            <small>
              {fileName.split(".").at(-1)?.toUpperCase()} · Основное резюме
            </small>
          </div>
          <span className="desktop-only">
            <Chip tone="green">Активно</Chip>
          </span>
        </div>
      ) : (
        <p>Добавьте основное резюме.</p>
      )}
      <div className="actions">
        <label className="primary upload">
          <span className="desktop-only">Загрузить новое</span>
          <span className="mobile-only">Обновить</span>
          <input
            type="file"
            aria-label="Загрузить резюме"
            accept=".pdf,.docx"
            onChange={(event) => {
              upload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        {fileName && (
          <button className="action" onClick={() => setPreview(!preview)}>
            Сведения о файле
          </button>
        )}
      </div>
      {preview && (
        <p>
          {fileName}
          {resume
            ? ` · ${Math.ceil(resume.size / 1024)} КБ`
            : " · демонстрационный файл"}
        </p>
      )}
    </Panel>
  );

  return (
    <>
      <Heading
        title={resumesOnly ? "Резюме" : "Личный кабинет"}
        mobile={resumesOnly ? "Резюме" : "Мой профиль"}
        description={
          resumesOnly
            ? "Документы для подготовки откликов."
            : "Профиль кандидата, резюме и настройки поиска работы."
        }
        mobileDescription={
          resumesOnly ? undefined : "Ваш опыт и настройки поиска"
        }
      />
      {!resumesOnly && (
        <button
          className="action profile-public desktop-only"
          onClick={() => setPublicView(!publicView)}
        >
          {publicView ? "Вернуться в кабинет" : "Посмотреть публичный профиль"}
        </button>
      )}
      {message && (
        <p className="feedback" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="feedback feedback-error" role="alert">
          {error}
        </p>
      )}
      {resumesOnly ? (
        resumePanel
      ) : (
        <>
          <Panel className="candidate">
            <div className="candidate-intro">
              <span className="profile-avatar">{initials}</span>
              <div>
                <h2 className="desktop-only">
                  {candidate.role || "Заполните профиль"}
                </h2>
                <h2 className="mobile-only">
                  {candidate.name || "Заполните профиль"}
                </h2>
                <p className="desktop-only candidate-name">{candidate.name}</p>
                <p className="mobile-only">{candidate.role}</p>
                <p className="desktop-only">
                  {[candidate.city, candidate.arrangement, candidate.level]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {demo && (
                  <Chip tone="green">
                    <span className="desktop-only">
                      Профиль заполнен на 85%
                    </span>
                    <span className="mobile-only">Профиль 85%</span>
                  </Chip>
                )}
              </div>
            </div>
            <div className="candidate-actions">
              {!publicView && (
                <button
                  className="action"
                  onClick={() => {
                    setEditing(!editing);
                    setError("");
                  }}
                >
                  {editing ? "Закрыть форму" : "Редактировать профиль"}
                </button>
              )}
              {demo && (
                <small className="desktop-only">
                  Последнее обновление: 6 ноября 2026
                </small>
              )}
            </div>
            <p className="mobile-only candidate-location">
              {[candidate.city, candidate.arrangement]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Panel>
          {editing && !publicView && (
            <Panel>
              <h2>Редактирование профиля</h2>
              <form className="profile-form stack" onSubmit={save}>
                <div className="form-grid">
                  {candidateFields.map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        name={key}
                        required={key === "name" || key === "role"}
                        defaultValue={candidate[key]}
                      />
                    </label>
                  ))}
                  <label>
                    Зарплата от, ₽
                    <input
                      type="number"
                      name="salary"
                      min="0"
                      required
                      defaultValue={candidate.salary}
                    />
                  </label>
                </div>
                <label>
                  Опыт работы
                  <textarea
                    name="experience"
                    rows={5}
                    defaultValue={candidate.experience}
                  />
                </label>
                <button className="primary">Сохранить профиль</button>
              </form>
            </Panel>
          )}
          {publicView ? (
            <Panel className="stack">
              <h2>Предпросмотр профиля</h2>
              <p>{candidate.experience || "Опыт работы пока не добавлен."}</p>
              <div className="filter-list">
                {candidate.skills.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            </Panel>
          ) : (
            <>
              <div className="profile-grid">
                {resumePanel}
                <Panel className="preferences">
                  <div className="panel-heading">
                    <h2>
                      <span className="desktop-only">
                        Предпочтения по работе
                      </span>
                      <span className="mobile-only">Предпочтения</span>
                    </h2>
                    <button
                      className="action desktop-only"
                      onClick={() => setEditing(true)}
                    >
                      Изменить
                    </button>
                  </div>
                  <dl className="settings-list">
                    <div>
                      <dt>Желаемая должность</dt>
                      <dd>{candidate.role || "—"}</dd>
                    </div>
                    <div>
                      <dt>Формат</dt>
                      <dd>{candidate.arrangement || "—"}</dd>
                    </div>
                    <div>
                      <dt>Зарплата от</dt>
                      <dd>
                        {candidate.salary ? money(candidate.salary) : "—"}
                      </dd>
                    </div>
                    <div className="desktop-only">
                      <dt>Уровень</dt>
                      <dd>{candidate.level || "—"}</dd>
                    </div>
                  </dl>
                </Panel>
                <Panel className="skills">
                  <h2>
                    <span className="desktop-only">Навыки</span>
                    <span className="mobile-only">Ключевые навыки</span>
                  </h2>
                  <p className="desktop-only">
                    Используются для оценки соответствия вакансиям
                  </p>
                  <div className="filter-list">
                    {candidate.skills.map((item) => (
                      <Chip key={item}>{item}</Chip>
                    ))}
                  </div>
                  <form className="actions" onSubmit={addSkill}>
                    <input
                      aria-label="Новый навык"
                      placeholder="Новый навык"
                      required
                      value={skill}
                      onChange={(event) => setSkill(event.target.value)}
                    />
                    <button className="action">+ Добавить навык</button>
                  </form>
                </Panel>
                <Panel className="experience">
                  <div className="panel-heading">
                    <h2>Опыт работы</h2>
                    <button className="action" onClick={() => setEditing(true)}>
                      Редактировать
                    </button>
                  </div>
                  {candidate.experience ? (
                    <ul>
                      {candidate.experience
                        .split(/\n\n/)
                        .map((entry, index) => {
                          const [title, ...description] = entry.split("\n");
                          return (
                            <li key={index}>
                              <strong>{title}</strong>
                              {description.length > 0 && (
                                <p>{description.join(" ")}</p>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  ) : (
                    <p>Добавьте опыт работы.</p>
                  )}
                </Panel>
                <Panel className="privacy desktop-only">
                  <h2>Доступ к данным</h2>
                  <p>Резюме доступно только вам и выбранным интеграциям.</p>
                  <Chip tone="green">Приватный профиль</Chip>
                </Panel>
              </div>
              {demo && (
                <div className="profile-next desktop-only">
                  <strong>Следующий шаг</strong>
                  <p>
                    Проверьте профиль и добавьте примеры работы с Kafka — это
                    улучшит анализ вакансий.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
