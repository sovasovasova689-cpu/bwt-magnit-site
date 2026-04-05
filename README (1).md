# BWT Swimming Management System

Система управления пловцами с QR-кодами на базе Cloudflare Workers + KV.

## Структура файлов

```
bwt-swimmers/
├── public/
│   ├── index.html            ← Главная страница + регистрация
│   └── swimmer-profile.html  ← Профиль пловца (при сканировании QR)
├── src/
│   └── worker.js             ← Cloudflare Worker (роутинг + API)
├── wrangler.toml             ← Конфигурация Cloudflare
└── README.md
```

## Установка и деплой

### 1. Установить Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. Создать KV Namespace

```bash
wrangler kv:namespace create SWIMMERS_KV
# Скопируйте полученный id в wrangler.toml
```

### 3. Задеплоить

```bash
wrangler deploy
```

После деплоя сайт будет доступен по адресу:
`https://bwt-swimming.<ваш-аккаунт>.workers.dev`

---

## Функционал

### Главная страница (`/`)
- Регистрация нового пловца (форма)
- Автоматическая генерация QR-кода
- Скачивание QR-кода
- Список всех пловцов с поиском
- Кнопки: просмотр профиля, показать QR

### Профиль пловца (`/swimmer/:id`)
- Открывается при сканировании QR-кода
- Личные данные спортсмена
- Статус верификации
- QR-код для повторного сканирования

### API (`/api/swimmers`)
| Метод | URL | Описание |
|-------|-----|----------|
| GET | /api/swimmers | Список всех пловцов |
| POST | /api/swimmers | Создать пловца |
| GET | /api/swimmers/:id | Один пловец |
| DELETE | /api/swimmers/:id | Удалить пловца |

---

## Важно

Текущая версия `index.html` использует `localStorage` для хранения данных в браузере.
После деплоя на Cloudflare Workers, обновите `index.html` чтобы использовать `/api/swimmers` вместо localStorage.

Для полной интеграции с Worker API замените в `index.html`:
- `saveSwimmers()` → `fetch('/api/swimmers', { method: 'POST', body: JSON.stringify(swimmer) })`
- `renderTable()` → `fetch('/api/swimmers').then(r => r.json()).then(renderTable)`
