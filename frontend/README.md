# JobPilot

Адаптивный интерфейс для поиска работы на React, TypeScript, Vite и Tailwind CSS.

## Локальный запуск

Для сборки и тестов нужен Node.js 22.13+ в ветке 22.x, Node.js 24.x или Node.js 26+.

```sh
npm ci
npm run dev
```

Режим разработки показывает демонстрационные вакансии, отклики, оценки совпадения и историю запусков. Изменения профиля и выбранное резюме остаются в памяти вкладки до перезагрузки. Production-сборка показывает пустое рабочее пространство.

## Проверки

```sh
npm run typecheck
npm run lint
npm run format
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Playwright использует отдельные эталоны для macOS и Linux. Эталоны Linux записаны в образе `mcr.microsoft.com/playwright:v1.64.1-noble` для `linux/amd64`, который использует GitHub Actions. При обновлении Playwright обновляйте версию образа вместе с пакетом `@playwright/test`.

## Дизайн и интеграция

- Обзор, вакансии, разбор вакансии, отклики и профиль используют desktop- и mobile-макеты. Для автоматизации использован адаптивный вариант desktop-макета. Разделы настроек и резюме переиспользуют блоки кабинета.
- Счётчик результатов поиска отражает фактическое число записей в демонстрационной выборке. В профиле используется синтетическое имя. В редакторах добавлены доступные поля и сообщения об ошибках.
- Загрузка в демо ограничена выбором PDF или DOCX до 10 МБ и просмотром сведений о файле. История резюме, обработка документов, генерация, публикация профиля, отправка откликов и выполнение задач автоматизации требуют серверной интеграции.
- Для подключения сервера нужны согласованные контракты профиля и документов, идентификаторы и ссылки публикаций, результаты анализа, статусы и ошибки откликов, а также статусы подключений и запусков автоматизации.

## Запуск JobPilot в Docker

Запустите frontend и backend из корня репозитория.

```sh
mvn -f backend/pom.xml -pl application -am package
docker compose -f deploy/docker/docker-compose.yaml up --build -d frontend backend keycloak
```

Для разработки запустите backend и выполните `npm run dev` в `frontend`. Vite направляет запросы на `http://localhost:8080`. Другой адрес backend можно задать через `JOBPILOT_BACKEND_URL`.

## Вход в JobPilot через Keycloak

В Docker откройте `http://localhost/login`. Перед запуском задайте SMTP через переменные окружения `JOBPILOT_SMTP_HOST`, `JOBPILOT_SMTP_PORT`, `JOBPILOT_SMTP_FROM`, а для SMTP с авторизацией также `JOBPILOT_SMTP_AUTH=true`, `JOBPILOT_SMTP_USER` и `JOBPILOT_SMTP_PASSWORD`. Для защищённого соединения включите `JOBPILOT_SMTP_STARTTLS` или `JOBPILOT_SMTP_SSL` согласно настройкам SMTP-сервера.

```bash
mvn -f backend/pom.xml -pl application -am package
docker compose -f deploy/docker/docker-compose.yaml up --build -d frontend backend keycloak
```

При первом запуске образ Keycloak импортирует realm `jobpilot` из `../deploy/keycloak/jobpilot-realm.json`. На форме Keycloak можно войти по email и паролю, зарегистрироваться и восстановить пароль. При регистрации Keycloak присылает ссылку для подтверждения email.

Если realm уже существует, Keycloak пропускает импорт. Перед переходом со старого расширения в админке привяжите штатный поток `browser` к Browser flow, выберите тему входа `jobpilot` и включите регистрацию, email как имя пользователя и подтверждение email. Существующие пользователи, пароли, настройки SMTP и клиент OIDC остаются в PostgreSQL. При наличии старых потоков `jobpilot-browser` и `jobpilot-email` их можно удалить после переключения.

Для Vite запустите бэкенд на `localhost:8080` с callback по умолчанию и откройте `http://localhost:5173/login`. С Docker-бэкендом для этого задайте `JOBPILOT_OIDC_CALLBACK=http://localhost:5173/login/oauth2/code/keycloak` перед запуском. Vite использует `JOBPILOT_BACKEND_URL`, если бэкенд работает на другом порту.

Для развёртывания за HTTPS задайте публичные `JOBPILOT_KEYCLOAK_URL` и `JOBPILOT_OIDC_CALLBACK`, включите `JOBPILOT_SECURE_SESSION_COOKIE=true` и внесите точный callback в клиент Keycloak. Текущий Compose запускает Keycloak в режиме локальной разработки.

Для существующего realm обновите **Authentication → Policies → Password policy** по полю `passwordPolicy` в `../deploy/keycloak/jobpilot-realm.json`. Правило действует при регистрации и смене пароля. Ранее созданные пароли продолжают работать.

Для локального подтверждения почты через Mailpit подключите его к той же сети Docker, что и Keycloak. В существующем realm `jobpilot` откройте **Realm settings → Email** и укажите хост `mailpit` и порт `1025`. Письма появятся в Mailpit на `http://127.0.0.1:8025`. Для первого импорта realm те же значения можно передать через `JOBPILOT_SMTP_HOST` и `JOBPILOT_SMTP_PORT`. При перезапуске Keycloak пропускает импорт уже существующего realm.

## REST-контракт JobPilot

[OpenAPI 3.1](openapi.json) описывает операции для обзора, профиля и опыта,
резюме, вакансий и анализа, подготовки и отправки отклика, истории и
автоматизации. Операции `/api/v1` имеют пометку `proposed` до реализации в
Spring. Вход, регистрация и восстановление пароля остаются в Keycloak.
Подключение hh.ru использует существующий протокол браузерного launcher.

Для проверки интеграции запустите фронтенд с
`VITE_JOBPILOT_API=live npm run dev`. Vite отправляет запросы на
`JOBPILOT_BACKEND_URL` (по умолчанию `http://localhost:8080`). Для Docker
передайте `--build-arg VITE_JOBPILOT_API=live`. В режиме live сервер должен
реализовать `/api/v1/workspace`, отдавать JSON и предоставлять
`/api/v1/csrf` для запросов записи в сессии Spring Security. Повторный запрос
отправки с тем же ID черновика должен возвращать исходный результат.

Мок-режим остаётся доступен для разработки и тестов макетов.
