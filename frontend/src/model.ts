export interface Vacancy {
  id: string;
  title: string;
  company: string;
  salary: number | null;
  skills: string[];
  score?: number;
  source: string;
  remote: boolean;
}

export interface Candidate {
  name: string;
  role: string;
  city: string;
  arrangement: string;
  salary: number;
  level: string;
  skills: string[];
  experience: string;
}

export type Status = "Приглашение" | "На рассмотрении" | "Отказ" | "Отправлено";
export interface Application {
  title: string;
  company: string;
  status: Status;
  date: string;
  source: string;
  resume: string;
}
export interface Run {
  time: string;
  found: string;
  sent: string;
  result: "Успешно" | "Без новых" | "Нужен вход";
}
export interface Workspace {
  demo: boolean;
  candidate: Candidate;
  vacancies: Vacancy[];
  applications: Application[];
  runs: Run[];
  resume: string;
}
