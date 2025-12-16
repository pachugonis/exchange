# Быстрое развертывание на VPS

## За 5 минут

### 1. Подключитесь к серверу
```bash
ssh root@YOUR_SERVER_IP
```

### 2. Установите Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

### 3. Загрузите файлы

**Вариант A: Через SCP (с локального компьютера)**
```bash
scp -r LICENSE/* root@YOUR_SERVER_IP:/root/license-server/
```

**Вариант B: Через Git**
```bash
cd /root
git clone YOUR_REPO_URL license-server
cd license-server
```

**Вариант C: Вручную**
Загрузите все файлы через FTP/SFTP в `/root/license-server/`

### 4. Настройте окружение
```bash
cd /root/license-server
cp .env.example .env
nano .env
```

Измените:
```env
LICENSE_JWT_SECRET=замените_на_случайную_строку_32_символа
ADMIN_PASSWORD=замените_на_сложный_пароль
```

Генерация безопасных значений:
```bash
# JWT Secret
openssl rand -base64 32

# Admin Password  
openssl rand -base64 24
```

### 5. Установите зависимости
```bash
npm install --production
```

### 6. Запустите сервер
```bash
# Установка PM2
sudo npm install -g pm2

# Запуск
pm2 start ecosystem.config.cjs

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

### 7. Проверьте работу
```bash
curl http://localhost:3001/api/health
```

### 8. Откройте порт в firewall
```bash
sudo ufw allow 3001/tcp
sudo ufw enable
```

## ✅ Готово!

Сервер работает на `http://YOUR_SERVER_IP:3001`

## Следующие шаги (опционально)

### Установка Nginx + SSL

```bash
# Установка Nginx
sudo apt install nginx

# Создание конфига
sudo nano /etc/nginx/sites-available/license-server
```

Вставьте:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Активация
sudo ln -s /etc/nginx/sites-available/license-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN.com
```

## Создание первой лицензии

```bash
curl -X POST http://YOUR_SERVER_IP:3001/api/admin/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: your-admin-password" \
  -d '{
    "licenseType": "professional",
    "customerEmail": "client@example.com"
  }'
```

Сохраните полученный `licenseKey` - это ключ лицензии!

## Полезные команды

```bash
# Статус сервера
pm2 status

# Логи
pm2 logs license-server

# Перезапуск
pm2 restart license-server

# Остановка
pm2 stop license-server

# Мониторинг
pm2 monit
```

## Проблемы?

1. **Порт занят**: измените `LICENSE_SERVER_PORT` в `.env`
2. **Нет доступа**: проверьте firewall `sudo ufw status`
3. **Ошибки**: смотрите логи `pm2 logs license-server --err`

---

Полная документация: [README.md](./README.md)
