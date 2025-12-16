# License Server Setup Guide

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

Это установит все необходимые пакеты:
- `express` - веб-сервер
- `better-sqlite3` - база данных SQLite
- `jsonwebtoken` - JWT токены для аутентификации
- `cors` - поддержка CORS
- `dotenv` - переменные окружения

### 2. Конфигурация

Скопируйте файл конфигурации:

```bash
copy .env.license-server .env
```

Отредактируйте `.env` и измените важные параметры:

```env
LICENSE_SERVER_PORT=3001
LICENSE_JWT_SECRET=your-very-secret-jwt-key-change-this-in-production
ADMIN_PASSWORD=your-admin-password-change-this
```

⚠️ **ВАЖНО**: Обязательно измените `LICENSE_JWT_SECRET` и `ADMIN_PASSWORD` в продакшене!

### 3. Запуск сервера

```bash
npm run license-server
```

Сервер запустится на `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /api/health
```

Проверка работоспособности сервера.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1734364800000,
  "version": "2.0.0"
}
```

### Создание лицензии (Admin)

```
POST /api/admin/licenses
Headers: X-Admin-Password: your-admin-password
```

**Request Body:**
```json
{
  "licenseType": "standard",  // или "professional"
  "customerEmail": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "license": {
    "id": 1,
    "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
    "licenseType": "standard",
    "status": "active",
    "customerEmail": "customer@example.com",
    "issuedAt": 1734364800000,
    "expiresAt": 1765900800000,
    "maxDomains": 1,
    "canChangeDomain": false,
    "features": {
      "crypto": true,
      "telegram": true,
      "kyc": true,
      "customBranding": false,
      "prioritySupport": false,
      "api": true,
      "multiCurrency": true,
      "analytics": true
    }
  },
  "message": "License created successfully"
}
```

### Активация лицензии

```
POST /api/license/activate
```

**Request Body:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "customerEmail": "customer@example.com",
  "domain": "exchange.example.com",
  "protocol": "https",
  "termsAgreed": true
}
```

**Response:**
```json
{
  "success": true,
  "license": { /* полная информация о лицензии */ },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "License activated successfully"
}
```

### Валидация лицензии

```
POST /api/license/validate
```

**Request Body:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "domain": "exchange.example.com",
  "protocol": "https"
}
```

**Response (успех):**
```json
{
  "valid": true,
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "licenseType": "professional",
  "status": "active",
  "expiresAt": null,
  "daysRemaining": null,
  "features": { /* ... */ },
  "domainMatch": true,
  "canChangeDomain": true,
  "message": "License is valid",
  "nextCheck": 86400,
  "boundDomains": ["exchange.example.com"],
  "maxDomains": 1
}
```

### Отвязка домена (только Professional)

```
POST /api/license/unbind-domain
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "domainId": "1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Domain unbound successfully. You can now bind a new domain."
}
```

### Heartbeat

```
POST /api/license/heartbeat
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "domain": "exchange.example.com",
  "metrics": {
    "activeUsers": 45,
    "totalOrders": 1234,
    "uptime": 86400
  }
}
```

### Статус лицензии

```
GET /api/license/status
Headers: 
  Authorization: Bearer {token}
  X-License-Key: LIC-XXXX-XXXX-XXXX-XXXX
```

## Примеры использования

### 1. Создание новой лицензии

```bash
curl -X POST http://localhost:3001/api/admin/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: your-admin-password" \
  -d '{
    "licenseType": "professional",
    "customerEmail": "client@company.com"
  }'
```

### 2. Активация лицензии клиентом

```bash
curl -X POST http://localhost:3001/api/license/activate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "LIC-ABCD-1234-EFGH-5678",
    "customerEmail": "client@company.com",
    "domain": "myexchange.com",
    "protocol": "https",
    "termsAgreed": true
  }'
```

### 3. Проверка лицензии

```bash
curl -X POST http://localhost:3001/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "LIC-ABCD-1234-EFGH-5678",
    "domain": "myexchange.com",
    "protocol": "https"
  }'
```

## Типы лицензий

### Standard (Стандартная)
- **Цена**: 70,000 ₽
- **Срок**: 1 год
- **Домены**: 1 (фиксированный)
- **Изменение домена**: ❌ Нет
- **Функции**: Полный функционал

### Professional (Профессиональная)
- **Цена**: 800,000 ₽
- **Срок**: Бессрочная
- **Домены**: 1 (с возможностью изменения)
- **Изменение домена**: ✅ Да
- **Функции**: Полный + брендинг + приоритетная поддержка

## База данных

Сервер использует SQLite базу данных `license-server.db`.

### Таблицы:

1. **licenses** - хранит информацию о лицензиях
2. **domain_bindings** - привязки доменов к лицензиям
3. **validation_logs** - логи всех проверок лицензий

### Просмотр базы данных:

```bash
# Установите sqlite3
npm install -g sqlite3

# Подключитесь к БД
sqlite3 license-server.db

# Просмотр лицензий
SELECT * FROM licenses;

# Просмотр привязок доменов
SELECT * FROM domain_bindings;

# Просмотр логов
SELECT * FROM validation_logs ORDER BY validated_at DESC LIMIT 10;
```

## Безопасность

### Важные моменты:

1. **JWT Secret**: Измените `LICENSE_JWT_SECRET` на уникальное значение
2. **Admin Password**: Используйте сложный пароль для `ADMIN_PASSWORD`
3. **HTTPS**: В продакшене используйте только HTTPS
4. **Firewall**: Ограничьте доступ к серверу только для доверенных IP
5. **Backup**: Регулярно делайте резервные копии `license-server.db`

### Генерация безопасных ключей:

```bash
# Для JWT Secret (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Для Admin Password
[System.Web.Security.Membership]::GeneratePassword(32, 10)
```

## Развертывание в продакшене

### 1. Настройка переменных окружения

```env
LICENSE_SERVER_PORT=3001
LICENSE_JWT_SECRET=ваш-очень-секретный-ключ-минимум-32-символа
ADMIN_PASSWORD=сложный-админ-пароль
```

### 2. Использование PM2 для автозапуска

```bash
npm install -g pm2

# Запуск сервера
pm2 start license-server.mjs --name license-server

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Просмотр логов
pm2 logs license-server

# Мониторинг
pm2 monit
```

### 3. Nginx прокси (опционально)

```nginx
server {
    listen 80;
    server_name licenses.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Мониторинг

### Проверка работоспособности:

```bash
curl http://localhost:3001/api/health
```

### Просмотр логов валидации:

```sql
SELECT 
  l.license_key,
  vl.domain,
  vl.success,
  vl.error_message,
  datetime(vl.validated_at/1000, 'unixepoch') as validated_at
FROM validation_logs vl
JOIN licenses l ON l.id = vl.license_id
ORDER BY vl.validated_at DESC
LIMIT 20;
```

## Troubleshooting

### Сервер не запускается

```bash
# Проверьте порт
netstat -ano | findstr :3001

# Проверьте логи
npm run license-server
```

### База данных заблокирована

```bash
# Остановите все процессы
pm2 stop license-server

# Удалите lock файл
rm license-server.db-wal
rm license-server.db-shm

# Перезапустите
pm2 start license-server
```

### Ошибки валидации

Проверьте логи в таблице `validation_logs`:
```sql
SELECT * FROM validation_logs WHERE success = 0 ORDER BY validated_at DESC LIMIT 10;
```

## Поддержка

- **Email**: support@4ex.com
- **Документация**: См. LICENSE_IMPLEMENTATION.md
- **Issues**: GitHub Issues

---

**Версия**: 2.0.0  
**Дата обновления**: 16 декабря 2025
