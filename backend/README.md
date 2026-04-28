# FastLink SaaS Backend (API-First)

FastLink is a single-tenant Laravel backend designed as an API provider for frontend applications.

Implemented core modules:
- Dashboard metrics
- CRM (leads, drives, statuses, activities, import)
- Spreadsheet/file management
- Project and task management (kanban + gantt)
- Attendance and leave requests
- User management with role-based access (`admin`, `supervisor`, `staff`)

This backend intentionally contains no organization / multi-tenant logic.

## Stack

- Laravel 13
- SQLite (development)
- Sanctum (token auth)
- Spatie Permission (RBAC)
- PhpSpreadsheet (CSV/XLSX import)
- Pest (feature testing)

## Quick Start

1. Install dependencies
```bash
composer install
```

2. Create environment and app key
```bash
cp .env.example .env
php artisan key:generate
```

3. Ensure SQLite DB file exists
```bash
touch database/database.sqlite
```

4. Run migrations and seed defaults
```bash
php artisan migrate:fresh --seed
```

5. Start API server
```bash
php artisan serve
```

6. Run tests
```bash
php artisan test
```

## Default Seeded Admin

Configured via `.env`:
- `FASTLINK_ADMIN_EMAIL` (default: `admin@fastlink.test`)
- `FASTLINK_ADMIN_PASSWORD` (default: `password123`)

## API Documentation

Complete endpoint documentation is available at:

`docs/api-reference.md`

It includes:
- endpoint URLs and methods
- auth requirements and role constraints
- request/query parameter specs
- sample request/response payloads
- error response format

## Production Database Switch (MySQL)

When moving to production, update `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fastlink_saas
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

Then run:

```bash
php artisan migrate --force
php artisan db:seed --force
```
