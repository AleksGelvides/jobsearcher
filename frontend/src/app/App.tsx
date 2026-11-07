import { useEffect, useState } from "react";
import type { Workspace } from "../model";
import { Dashboard, Vacancies, VacancyDetail } from "../features/Jobs";
import { Applications, Automation, Profile } from "../features/Workspace";
import { Chip, Heading, Panel } from "./ui";

const navigation = [
  { path: "", label: "Обзор", mobile: "Главная", icon: "◫", mobileIcon: "⌂" },
  {
    path: "vacancies",
    label: "Вакансии",
    mobile: "Вакансии",
    icon: "⌕",
    mobileIcon: "⌕",
  },
  { path: "resumes", label: "Резюме", icon: "▤" },
  {
    path: "applications",
    label: "Отклики",
    mobile: "Отклики",
    icon: "✓",
    mobileIcon: "✓",
  },
  { path: "automation", label: "Автоматизация", icon: "◷" },
  { path: "settings", label: "Настройки", icon: "⚙" },
  {
    path: "profile",
    label: "Мой профиль",
    mobile: "Профиль",
    icon: "◉",
    mobileIcon: "◉",
  },
];

const readRoute = () => window.location.hash.replace(/^#\/?/, "");

export function App({ data }: { data: Workspace }) {
  const [route, setRoute] = useState(readRoute);
  const [candidate, setCandidate] = useState(data.candidate);
  const [resume, setResume] = useState<File | null>(null);
  const [active, setActive] = useState(data.demo);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    function onNavigate() {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", onNavigate);
    return () => window.removeEventListener("hashchange", onNavigate);
  }, []);

  const [page, vacancyId] = route.split("/");
  const vacancy = data.vacancies.find(({ id }) => id === vacancyId);
  const initials =
    candidate.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("") || "Я";
  const profile = {
    candidate,
    setCandidate,
    resume,
    setResume,
    original: data.resume,
    demo: data.demo,
  };
  const navLink = (item: (typeof navigation)[number], mobile = false) => (
    <a
      key={item.path}
      href={`#/${item.path}`}
      aria-current={
        page === item.path ||
        (mobile && page === "automation" && item.path === "profile")
          ? "page"
          : undefined
      }
    >
      <span className="nav-icon" aria-hidden="true">
        {mobile ? item.mobileIcon : item.icon}
      </span>
      {mobile ? item.mobile : item.label}
    </a>
  );

  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        К содержимому
      </a>
      <aside className="sidebar">
        <a href="#/" className="brand">
          <span aria-hidden="true">◉</span> JobPilot
        </a>
        <p className="workspace-label">WORKSPACE</p>
        <nav aria-label="Основная навигация">
          {navigation
            .filter(({ path }) => path !== "profile" || page === "profile")
            .map((item) => navLink(item))}
        </nav>
        <a className="sidebar-profile" href="#/profile">
          <span className="avatar">{initials}</span>
          <span>
            Мой профиль
            <small>
              {candidate.role
                ? candidate.role.replace(" Developer", "")
                : "Кабинет кандидата"}
            </small>
          </span>
        </a>
      </aside>
      <div className="topbar">
        <a href="#/" className="brand">
          <span aria-hidden="true">◉</span> JobPilot
        </a>
        <a className="avatar" aria-label="Мой профиль" href="#/profile">
          {initials}
        </a>
      </div>
      <main id="main" tabIndex={-1} className={`main page-${page || "home"}`}>
        <div className="top-actions desktop-only">
          {page !== "profile" && (
            <>
              <button
                title="Сведения о рабочем пространстве"
                aria-label="Сведения о рабочем пространстве"
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                ○
              </button>
              <a aria-label="Мой профиль" href="#/profile">
                {initials}
              </a>
            </>
          )}
        </div>
        {settingsOpen && (
          <div className="workspace-popover panel" role="status">
            {data.demo
              ? "Демонстрационное рабочее пространство"
              : "Сервер не подключён"}
          </div>
        )}
        {page === "" && <Dashboard data={data} active={active} />}
        {page === "vacancies" &&
          (vacancyId ? (
            vacancy ? (
              <VacancyDetail
                key={vacancy.id}
                vacancy={vacancy}
                demo={data.demo}
              />
            ) : (
              <Panel>
                <h1>Вакансия недоступна</h1>
                <a className="text-link" href="#/vacancies">
                  К вакансиям
                </a>
              </Panel>
            )
          ) : (
            <Vacancies vacancies={data.vacancies} demo={data.demo} />
          ))}
        {page === "applications" && (
          <Applications applications={data.applications} demo={data.demo} />
        )}
        {page === "automation" && (
          <Automation data={data} active={active} setActive={setActive} />
        )}
        {page === "profile" && (
          <>
            <Profile {...profile} />
            <a className="primary mobile-only mt-4" href="#/automation">
              Агрегаторы вакансий
            </a>
          </>
        )}
        {page === "resumes" && <Profile {...profile} resumesOnly />}
        {page === "settings" && (
          <>
            <Heading
              title="Настройки"
              description="Управление рабочим пространством JobPilot."
            />
            <Panel className="stack">
              <h2>Доступ к данным</h2>
              <p>Резюме доступно только вам и выбранным интеграциям.</p>
              <Chip tone="green">Приватный профиль</Chip>
              <a className="text-link" href="#/automation">
                Настройки автоматизации →
              </a>
            </Panel>
          </>
        )}
        {!navigation.some(({ path }) => path === page) && (
          <Panel>
            <h1>Страница не найдена</h1>
            <a className="text-link" href="#/">
              На главную
            </a>
          </Panel>
        )}
      </main>
      <nav className="bottom-nav" aria-label="Мобильная навигация">
        {navigation
          .filter(({ mobile }) => mobile)
          .map((item) => navLink(item, true))}
      </nav>
    </>
  );
}
