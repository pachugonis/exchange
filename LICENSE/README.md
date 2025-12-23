# ExchangeKit License Server

Сервер валидации лицензий для платформы обмена криптовалют ExchangeKit.

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Развертывание на VPS](#развертывание-на-vps)
- [API Endpoints](#api-endpoints)
- [Типы лицензий](#типы-лицензий)
- [Безопасность](#безопасность)
- [Мониторинг](#мониторинг)

## 🚀 Быстрый старт

### Локальная установка

```bash
# 1. Установка зависимостей
npm install

# 2. Настройка окружения
cp .env.example .env
# Отредактируйте .env и установите свои значения

# 3. Запуск сервера
npm start
```

Сервер будет доступен на `http://localhost:3001`

### Проверка работоспособности

```bash
curl http://localhost:3001/api/health
```

## 🌐 Развертывание на VPS

### Требования

- **Node.js**: >= 18.0.0
- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: минимум 512MB
- **Диск**: минимум 1GB свободного места

### Пошаговая инструкция

#### 1. Подключение к серверу

```bash
ssh root@your-server-ip
```

#### 2. Установка Node.js

```bash
# Установка Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version
npm --version
```

#### 3. Создание пользователя (рекомендуется)

```bash
# Создание пользователя для приложения
sudo adduser license-server
sudo usermod -aG sudo license-server

# Переключение на нового пользователя
su - license-server
```

#### 4. Загрузка файлов сервера

```bash
# Создание директории
mkdir -p ~/license-server
cd ~/license-server

# Загрузка файлов (используйте SCP, FTP или Git)
# Пример с SCP (выполнить на локальном компьютере):
scp -r LICENSE/* user@your-server-ip:~/license-server/
```

#### 5. Установка зависимостей

```bash
cd ~/license-server
npm install --production
```

#### 6. Конфигурация

```bash
# Создание .env файла
cp .env.example .env
nano .env
```

Установите следующие значения:

```env
LICENSE_SERVER_PORT=3001
LICENSE_JWT_SECRET=ваш-очень-секретный-ключ-минимум-32-символа
ADMIN_PASSWORD=сложный-админ-пароль
```

**Генерация безопасных ключей:**

```bash
# JWT Secret
openssl rand -base64 32

# Или для Admin Password
openssl rand -base64 24
```

#### 7. Установка PM2 (менеджер процессов)

```bash
sudo npm install -g pm2
```

#### 8. Запуск сервера с PM2

```bash
# Запуск
pm2 start ecosystem.config.cjs

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save

# Проверка статуса
pm2 status
```

#### 9. Настройка Firewall

```bash
# Открытие порта 3001
sudo ufw allow 3001/tcp

# Если используете nginx (рекомендуется)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включение firewall
sudo ufw enable
```

#### 10. Настройка Nginx (опционально, но рекомендуется)

```bash
# Установка Nginx
sudo apt install nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/license-server
```

Содержимое файла:

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/license-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 11. Установка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d licenses.yourdomain.com

# Автообновление сертификата
sudo certbot renew --dry-run
```

### Обновление сервера

```bash
cd ~/license-server

# Остановка сервера
pm2 stop license-server

# Обновление файлов (загрузите новые файлы)
# ...

# Установка зависимостей
npm install --production

# Запуск сервера
pm2 restart license-server
```

## 📚 API Endpoints

### Health Check

```bash
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1734364800000,
  "version": "2.0.0",
  "totalLicenses": 5,
  "activeLicenses": 4
}
```

### Создание лицензии (Admin)

```bash
POST /api/admin/licenses
Headers: X-Admin-Password: your-admin-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "licenseType": "professional",
  "customerEmail": "client@company.com"
}
```

**Пример (curl):**
```bash
curl -X POST http://your-server/api/admin/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: your-admin-password" \
  -d '{"licenseType":"professional","customerEmail":"client@company.com"}'
```

### Активация лицензии

```bash
POST /api/license/activate
Content-Type: application/json
```

**Request Body:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "customerEmail": "client@company.com",
  "domain": "exchange.example.com",
  "protocol": "https",
  "termsAgreed": true
}
```

### Валидация лицензии

```bash
POST /api/license/validate
Content-Type: application/json
```

**Request Body:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "domain": "exchange.example.com",
  "protocol": "https"
}
```

### Отвязка домена (Professional только)

```bash
POST /api/license/unbind-domain
Headers: Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "domainId": "1"
}
```

## 💎 Типы лицензий

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

## 🔒 Безопасность

### Обязательные действия

1. **Измените все пароли и секреты в .env**
2. **Используйте HTTPS в продакшене**
3. **Ограничьте доступ через firewall**
4. **Регулярно делайте backup базы данных**
5. **Мониторьте логи на подозрительную активность**

### Рекомендации

- Используйте сложные пароли (минимум 32 символа)
- Храните .env в безопасном месте
- Не коммитьте .env в Git
- Используйте PM2 для автоперезапуска
- Настройте rate limiting для API

### Backup базы данных

```bash
# Ручной backup
cp license-database.json license-database.backup.json

# Автоматический backup (cron)
crontab -e
```

Добавьте:
```cron
# Backup каждый день в 3:00
0 3 * * * cp ~/license-server/license-database.json ~/license-server/backups/license-$(date +\%Y\%m\%d).json
```

## 📊 Мониторинг

### PM2 команды

```bash
# Статус всех процессов
pm2 status

# Логи в реальном времени
pm2 logs license-server

# Мониторинг ресурсов
pm2 monit

# Перезапуск
pm2 restart license-server

# Остановка
pm2 stop license-server

# Удаление из PM2
pm2 delete license-server
```

### Просмотр логов

```bash
# PM2 логи
pm2 logs license-server --lines 100

# Файлы логов
tail -f ~/license-server/logs/out.log
tail -f ~/license-server/logs/error.log
```

### Проверка базы данных

```bash
# Просмотр содержимого
cat license-database.json | jq

# Подсчет лицензий
cat license-database.json | jq '.licenses | length'

# Активные лицензии
cat license-database.json | jq '.licenses[] | select(.status=="active")'
```

## 🛠️ Troubleshooting

### Сервер не запускается

```bash
# Проверка порта
sudo netstat -tlnp | grep 3001

# Проверка логов
pm2 logs license-server --err

# Проверка .env файла
cat .env
```

### База данных повреждена

```bash
# Восстановление из backup
cp backups/license-YYYYMMDD.json license-database.json

# Перезапуск сервера
pm2 restart license-server
```

### Высокая нагрузка

```bash
# Проверка ресурсов
pm2 monit

# Увеличение лимита памяти в ecosystem.config.cjs
max_memory_restart: '1G'  # вместо 500M
```

## 📞 Поддержка

- **Email**: support@exchangekit.io
- **Telegram**: @exchangekit_support

## 📄 Лицензия

Проприетарное ПО. Все права защищены.  
© 2025 ExchangeKit Development Team

---

**Версия**: 2.0.0  
**Дата обновления**: 16 декабря 2025
