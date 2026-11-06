import type { Vacancy } from "../model";

export type Filter = "remote" | "salary" | "java" | "source";
export type Sort = "match" | "salary";

export function searchVacancies(
  vacancies: Vacancy[],
  query: string,
  filters: Filter[],
  sort: Sort,
) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return vacancies
    .filter((vacancy) => {
      const searchable = [vacancy.title, vacancy.company, ...vacancy.skills]
        .join(" ")
        .toLowerCase();
      const matches = {
        remote: vacancy.remote,
        salary: (vacancy.salary ?? 0) >= 200000,
        java: searchable.includes("java"),
        source: vacancy.source === "hh.ru",
      };
      return (
        terms.every((term) => searchable.includes(term)) &&
        filters.every((filter) => matches[filter])
      );
    })
    .sort((a, b) =>
      sort === "salary"
        ? (b.salary ?? 0) - (a.salary ?? 0)
        : (b.score ?? -1) - (a.score ?? -1),
    );
}

export const money = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value) + " ₽";
export const salary = (value: number | null) =>
  value === null ? "не указана" : "от " + money(value);

export function resumeError(file: Pick<File, "name" | "size">) {
  if (!/\.(pdf|docx)$/i.test(file.name)) return "Выберите PDF или DOCX.";
  if (!file.size || file.size > 10 * 1024 * 1024)
    return "Размер файла должен быть больше 0 и не больше 10 МБ.";
  return "";
}
