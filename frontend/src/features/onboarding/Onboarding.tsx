import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Candidate, OnboardingAnswers, WorkExperience } from "../../model";
import "./onboarding.css";

const steps = [
  [
    "С какой должности начнём?",
    "Укажите желаемую должность. Город можно добавить сейчас или позже.",
  ],
  [
    "Какую работу вы ищете?",
    "Эти параметры помогут подобрать подходящие вакансии.",
  ],
  [
    "Где вы работали?",
    "Добавьте последнее место работы. Остальной опыт можно добавить в профиле.",
  ],
  [
    "Что вы умеете?",
    "Навыки и профессиональная история помогут точнее оценить совпадение с вакансиями.",
  ],
  [
    "Проверьте свой профиль",
    "После сохранения эти данные появятся в личном кабинете. Их можно изменить в любое время.",
  ],
] as const;

const emptyExperience: WorkExperience = {
  company: "",
  role: "",
  from: "",
  to: "",
  description: "",
};

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  change: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  numeric?: boolean;
}

function Field({
  label,
  value,
  placeholder,
  change,
  required,
  multiline,
  numeric,
}: FieldProps) {
  return (
    <label className="onboarding-field">
      {label}
      {required && " *"}
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => change(event.target.value)}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          required={required}
          type={numeric ? "number" : "text"}
          min={numeric ? 0 : undefined}
          onChange={(event) => change(event.target.value)}
        />
      )}
    </label>
  );
}

export function Onboarding({
  candidate,
  onSave,
}: {
  candidate: Candidate;
  onSave: (answers: OnboardingAnswers) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [profile, setProfile] = useState(candidate);
  const [salary, setSalary] = useState(
    candidate.salary ? String(candidate.salary) : "",
  );
  const [skills, setSkills] = useState(candidate.skills.join(", "));
  const [experience, setExperience] = useState(
    candidate.workExperience?.[0] ?? emptyExperience,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  function setProfileField(
    key: "role" | "city" | "arrangement" | "level" | "experience",
    value: string,
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function navigate(next: number) {
    setError("");
    setStep(next);
  }

  function advance() {
    navigate(reviewing ? 4 : step + 1);
    setReviewing(false);
  }

  const skillList = [
    ...new Set(
      skills
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  const workEntry = {
    company: experience.company.trim(),
    role: experience.role.trim(),
    from: experience.from.trim(),
    to: experience.to.trim(),
    description: experience.description.trim(),
  };
  const hasExperience = Object.values(workEntry).some(Boolean);
  const salaryValue = Number(salary);
  const summary = [
    [
      "Должность и город",
      [profile.role, profile.city].filter(Boolean).join(" · "),
    ],
    [
      "Цели",
      [
        profile.arrangement,
        profile.level,
        salaryValue > 0 ? `от ${salaryValue.toLocaleString("ru-RU")} ₽` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    [
      "Опыт",
      [
        workEntry.company,
        workEntry.role,
        workEntry.from,
        workEntry.to,
        workEntry.description,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    [
      "Навыки и история",
      [...skillList, profile.experience].filter(Boolean).join(" · "),
    ],
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0 && !profile.role.trim()) {
      setError("Укажите желаемую должность.");
      return;
    }
    if (
      step === 2 &&
      hasExperience &&
      (!workEntry.company || !workEntry.role)
    ) {
      setError("Укажите компанию и должность или пропустите этот шаг.");
      return;
    }
    if (step < 4) {
      advance();
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave({
        role: profile.role.trim(),
        city: profile.city.trim(),
        arrangement: profile.arrangement.trim(),
        level: profile.level.trim(),
        experience: profile.experience.trim(),
        salary: salaryValue,
        skills: skillList,
        workExperience: [
          ...(hasExperience ? [workEntry] : []),
          ...(candidate.workExperience?.slice(1) ?? []),
        ],
      });
    } catch {
      setError("Не удалось сохранить профиль. Попробуйте снова.");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  function skip() {
    if (step === 2) setExperience(emptyExperience);
    if (step === 3) {
      setSkills("");
      setProfileField("experience", "");
    }
    advance();
  }

  const [title, description] = steps[step];
  return (
    <main className="onboarding">
      <p className="onboarding-brand">JobPilot</p>
      <form className="onboarding-card" onSubmit={submit}>
        <header className="onboarding-intro">
          <p className="onboarding-step">
            Первое знакомство · Шаг {step + 1} из {steps.length}
          </p>
          <div className="onboarding-progress" aria-hidden="true">
            {steps.map(([label], index) => (
              <span
                key={label}
                className={index <= step ? "complete" : undefined}
              />
            ))}
          </div>
          <h1 tabIndex={-1} ref={heading}>
            {title}
          </h1>
          <p>{description}</p>
        </header>
        <div className="onboarding-fields">
          {step === 0 && (
            <>
              <Field
                label="Желаемая должность"
                value={profile.role}
                placeholder="Например, Java Backend Developer"
                required
                change={(value) => setProfileField("role", value)}
              />
              <Field
                label="Город"
                value={profile.city}
                placeholder="Например, Новосибирск"
                change={(value) => setProfileField("city", value)}
              />
            </>
          )}
          {step === 1 && (
            <>
              <Field
                label="Формат работы"
                value={profile.arrangement}
                placeholder="Например, удалённо"
                change={(value) => setProfileField("arrangement", value)}
              />
              <Field
                label="Уровень"
                value={profile.level}
                placeholder="Например, Middle"
                change={(value) => setProfileField("level", value)}
              />
              <Field
                label="Зарплата от, ₽"
                value={salary}
                placeholder="Например, 200 000"
                numeric
                change={setSalary}
              />
            </>
          )}
          {step === 2 &&
            (
              [
                ["company", "Компания", "Название компании"],
                ["role", "Должность", "Ваша роль"],
                ["from", "Период с", "ММ.ГГГГ"],
                ["to", "Период по", "ММ.ГГГГ или по настоящее время"],
                ["description", "Описание", "Задачи и результаты"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <Field
                key={key}
                label={label}
                value={experience[key]}
                placeholder={placeholder}
                multiline={key === "description"}
                change={(value) =>
                  setExperience((current) => ({ ...current, [key]: value }))
                }
              />
            ))}
          {step === 3 && (
            <>
              <Field
                label="Навыки"
                value={skills}
                placeholder="Например, Java, Spring Boot, PostgreSQL"
                change={setSkills}
              />
              <Field
                label="Моя профессиональная история"
                value={profile.experience}
                placeholder="Расскажите, какие задачи вы решали"
                multiline
                change={(value) => setProfileField("experience", value)}
              />
            </>
          )}
          {step === 4 &&
            summary.map(([label, value], index) => (
              <div className="onboarding-summary" key={label}>
                <div>
                  <strong>{label}</strong>
                  <p>{value || "Не заполнено"}</p>
                </div>
                <button
                  type="button"
                  className="action"
                  disabled={saving}
                  aria-label={`Изменить: ${label}`}
                  onClick={() => {
                    setReviewing(true);
                    navigate(index);
                  }}
                >
                  Изменить
                </button>
              </div>
            ))}
        </div>
        {error && (
          <p role="alert" className="onboarding-error">
            {error}
          </p>
        )}
        <div className="onboarding-actions">
          {step > 0 && (
            <button
              type="button"
              className="action"
              disabled={saving}
              onClick={() => {
                navigate(reviewing ? 4 : step - 1);
                setReviewing(false);
              }}
            >
              Назад
            </button>
          )}
          <button className="primary" disabled={saving}>
            {step === 4
              ? saving
                ? "Сохранение…"
                : "Сохранить профиль"
              : "Далее"}
          </button>
        </div>
        {(step === 2 || step === 3) && (
          <button type="button" className="action self-start" onClick={skip}>
            Пропустить шаг
          </button>
        )}
      </form>
    </main>
  );
}
