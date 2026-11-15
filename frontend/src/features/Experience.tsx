import { useState, type SubmitEvent } from "react";
import { Panel } from "../app/ui";
import type { WorkExperience } from "../model";

const empty: WorkExperience = {
  company: "",
  role: "",
  from: "",
  to: "",
  description: "",
};

export function Experience({
  entries,
  onSave,
}: {
  entries: WorkExperience[];
  onSave: (entries: WorkExperience[]) => void | Promise<boolean>;
}) {
  const [editing, setEditing] = useState<number | null>(null);

  async function save(event: SubmitEvent<HTMLFormElement>, index: number) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const read = (key: keyof WorkExperience) => String(form.get(key)).trim();
    const entry = {
      company: read("company"),
      role: read("role"),
      from: read("from"),
      to: read("to"),
      description: read("description"),
    };
    const next = [...entries];
    next[index] = entry;
    const result = onSave(next);
    if (result && !(await result)) return;
    setEditing(null);
  }

  function editor(entry: WorkExperience, index: number) {
    return (
      <form className="stack gap-4" onSubmit={(event) => save(event, index)}>
        <h3>Редактирование опыта работы</h3>
        <label>
          Название компании
          <input
            name="company"
            defaultValue={entry.company}
            required
            pattern=".*\S.*"
          />
        </label>
        <label>
          Должность
          <input
            name="role"
            defaultValue={entry.role}
            required
            pattern=".*\S.*"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            С<input name="from" defaultValue={entry.from} />
          </label>
          <label>
            По
            <input name="to" defaultValue={entry.to} />
          </label>
        </div>
        <label>
          Описание
          <textarea
            name="description"
            rows={4}
            defaultValue={entry.description}
          />
        </label>
        <div className="actions">
          <button className="action">Сохранить</button>
          <button
            type="button"
            className="action"
            onClick={() => setEditing(null)}
          >
            Отмена
          </button>
        </div>
      </form>
    );
  }

  return (
    <Panel className="experience">
      <div className="panel-heading">
        <h2>Опыт работы</h2>
        <button
          type="button"
          className="action"
          onClick={() => setEditing(entries.length)}
        >
          Добавить
        </button>
      </div>
      {entries.length === 0 && editing === null && <p>Добавьте опыт работы.</p>}
      {entries.map((entry, index) => (
        <details
          key={index}
          className="mt-4 border-b border-[var(--color-line)] pb-4"
        >
          <summary className="cursor-pointer font-semibold [overflow-wrap:anywhere]">
            {entry.company}
          </summary>
          <div className="mt-4 grid gap-4 [overflow-wrap:anywhere]">
            {editing === index ? (
              editor(entry, index)
            ) : (
              <>
                <strong>{entry.role}</strong>
                <p>{[entry.from, entry.to].filter(Boolean).join(" — ")}</p>
                <strong>Описание</strong>
                <p className="whitespace-pre-wrap">{entry.description}</p>
                <div>
                  <button
                    type="button"
                    className="action"
                    onClick={() => setEditing(index)}
                  >
                    Редактировать
                  </button>
                </div>
              </>
            )}
          </div>
        </details>
      ))}
      {editing === entries.length && (
        <div className="mt-4">{editor(empty, editing)}</div>
      )}
    </Panel>
  );
}
