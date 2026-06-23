#!/usr/bin/env bash

#############################################################################
# ExchangeKit — автоматическая установка на VPS
# Версия: 2.0.0  (нативная схема: systemd + PostgreSQL + nginx)
# Цель:   Ubuntu 24.04 LTS
#
# Что разворачивается:
#   - Node.js 20 LTS, PostgreSQL 16, nginx, certbot
#   - Бэкенд (server/, Express + tsx) как systemd-сервис exchangekit-api
#   - Фронтенд собирается в dist/ и раздаётся nginx
#   - nginx проксирует /api -> 127.0.0.1:4000, отдаёт SPA, опционально HTTPS
#
# Схема БД (таблицы users/auth_tokens/kyc_submissions) и админ-аккаунт
# создаются самим сервером при первом запуске (initSchema + seed из .env).
#############################################################################

set -euo pipefail

# ---------------------------------------------------------------------------
# Константы
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

APP_DIR="/opt/exchangekit"
SERVICE_USER="exchangekit"
SERVICE_NAME="exchangekit-api"
API_PORT=4000

DB_NAME="exchange"
DB_USER="exchange_user"

NODE_MAJOR=20

INSTALL_LOG="${SCRIPT_DIR}/installation.log"

# Цвета
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

# ---------------------------------------------------------------------------
# Хелперы
# ---------------------------------------------------------------------------
log()      { echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${INSTALL_LOG}"; }
info()     { echo -e "${CYAN}➜${NC} $*"; }
ok()       { echo -e "${GREEN}✓${NC} $*"; }
warn()     { echo -e "${YELLOW}⚠${NC} $*"; }
phase()    { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }
die()      { echo -e "${RED}✗ ОШИБКА:${NC} $*" >&2; log "ERROR: $*"; exit 1; }

require_root() {
  [[ $EUID -eq 0 ]] || die "Скрипт нужно запускать от root (sudo bash INSTALL/install.sh)."
}

# Прочитать значение ключа из существующего .env (для безопасного повторного запуска)
read_env_value() {
  local key="$1" file="${APP_DIR}/.env"
  [[ -f "$file" ]] || return 0
  sed -n "s/^${key}=//p" "$file" | head -n1
}

gen_secret() { openssl rand -hex 32; }
gen_pass()   { openssl rand -base64 24 | tr -d '/+=' | cut -c1-24; }

# ---------------------------------------------------------------------------
# Конфигурация (интерактивный ввод)
# ---------------------------------------------------------------------------
DOMAIN=""; ADMIN_EMAIL=""; ADMIN_PASSWORD=""; ADMIN_NAME="Administrator"
ENABLE_SSL="n"
SMTP_HOST=""; SMTP_PORT="587"; SMTP_USER=""; SMTP_PASSWORD=""
SMTP_FROM_EMAIL="noreply@exchangekit.io"; SMTP_FROM_NAME="ExchangeKit"
ETHERSCAN_API_KEY=""

collect_config() {
  phase "Шаг 1/10 — Конфигурация"

  read -rp "Домен сайта (например exchange.example.com): " DOMAIN
  [[ -n "$DOMAIN" ]] || die "Домен обязателен."

  read -rp "E-mail администратора: " ADMIN_EMAIL
  [[ "$ADMIN_EMAIL" == *@*.* ]] || die "Некорректный e-mail."

  while true; do
    read -rsp "Пароль администратора (мин. 8 символов): " ADMIN_PASSWORD; echo
    [[ ${#ADMIN_PASSWORD} -ge 8 ]] || { warn "Слишком короткий пароль."; continue; }
    read -rsp "Повторите пароль: " p2; echo
    [[ "$ADMIN_PASSWORD" == "$p2" ]] && break || warn "Пароли не совпадают."
  done

  echo
  read -rp "Настроить HTTPS (Let's Encrypt) сейчас? Домен должен указывать на этот сервер [y/N]: " ENABLE_SSL
  ENABLE_SSL="${ENABLE_SSL,,}"

  echo
  info "SMTP для отправки писем (верификация e-mail, сброс пароля)."
  info "Оставьте хост пустым — письма будут писаться в лог сервера вместо отправки."
  read -rp "SMTP host (Enter — пропустить): " SMTP_HOST
  if [[ -n "$SMTP_HOST" ]]; then
    read -rp "SMTP port [587]: " _p; SMTP_PORT="${_p:-587}"
    read -rp "SMTP user: " SMTP_USER
    read -rsp "SMTP password: " SMTP_PASSWORD; echo
    read -rp "From e-mail [${SMTP_FROM_EMAIL}]: " _f; SMTP_FROM_EMAIL="${_f:-$SMTP_FROM_EMAIL}"
  fi

  echo
  info "Etherscan API key — для авто-отслеживания оплаты в сети Ethereum (ETH/ERC20)."
  info "BTC/LTC/TRON отслеживаются без ключа. Без ключа ETH подтверждается вручную."
  read -rp "Etherscan API key (Enter — пропустить): " ETHERSCAN_API_KEY

  echo
  echo -e "${CYAN}─────────────────────────────────────────────${NC}"
  echo "Домен:        $DOMAIN"
  echo "Админ:        $ADMIN_EMAIL"
  echo "HTTPS:        $([[ "$ENABLE_SSL" == y* ]] && echo да || echo нет)"
  echo "SMTP:         $([[ -n "$SMTP_HOST" ]] && echo "$SMTP_HOST:$SMTP_PORT" || echo 'лог в консоль')"
  echo "Etherscan:    $([[ -n "$ETHERSCAN_API_KEY" ]] && echo задан || echo нет)"
  echo -e "${CYAN}─────────────────────────────────────────────${NC}"
  read -rp "Продолжить установку? [Y/n]: " c; c="${c,,}"
  [[ -z "$c" || "$c" == y* ]] || die "Установка отменена."
}

# ---------------------------------------------------------------------------
# Системные пакеты
# ---------------------------------------------------------------------------
install_system_packages() {
  phase "Шаг 2/10 — Системные пакеты"
  export DEBIAN_FRONTEND=noninteractive
  info "apt update / upgrade…"
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg git rsync ufw openssl \
    nginx postgresql postgresql-contrib >/dev/null
  ok "Базовые пакеты установлены"
}

install_node() {
  phase "Шаг 3/10 — Node.js ${NODE_MAJOR} LTS"
  if command -v node >/dev/null && [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ge "$NODE_MAJOR" ]]; then
    ok "Node $(node -v) уже установлен"
    return
  fi
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs >/dev/null
  ok "Установлен Node $(node -v)"
}

# ---------------------------------------------------------------------------
# Пользователь сервиса и код приложения
# ---------------------------------------------------------------------------
setup_user_and_code() {
  phase "Шаг 4/10 — Пользователь сервиса и файлы приложения"

  if ! id "$SERVICE_USER" >/dev/null 2>&1; then
    useradd --system --create-home --shell /usr/sbin/nologin "$SERVICE_USER"
    ok "Создан пользователь $SERVICE_USER"
  else
    ok "Пользователь $SERVICE_USER уже существует"
  fi

  mkdir -p "$APP_DIR"
  info "Копирую файлы проекта в ${APP_DIR}…"
  # .git сохраняем — он нужен кнопке «Обновить» (git pull). .env/секреты не трогаем.
  rsync -a --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude '.credentials' \
    --exclude 'INSTALL/installation.log' \
    "${REPO_ROOT}/" "${APP_DIR}/"

  chmod +x "${APP_DIR}/INSTALL/"*.sh 2>/dev/null || true
  chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
  ok "Файлы приложения на месте"
}

# ---------------------------------------------------------------------------
# Deploy-ключ для обновлений из приватного репозитория
# ---------------------------------------------------------------------------
REPO_SSH_URL=""
setup_deploy_key() {
  phase "Шаг 5/10 — Deploy-ключ для обновлений (приватный репозиторий)"

  local home sshdir keyfile ans
  home="$(getent passwd "$SERVICE_USER" | cut -d: -f6)"
  sshdir="${home}/.ssh"
  keyfile="${sshdir}/id_ed25519"

  # URL origin берём из исходного репозитория и приводим к SSH-форме
  REPO_SSH_URL="$(git -C "$REPO_ROOT" remote get-url origin 2>/dev/null || true)"
  if [[ "$REPO_SSH_URL" == https://github.com/* ]]; then
    REPO_SSH_URL="git@github.com:${REPO_SSH_URL#https://github.com/}"
    [[ "$REPO_SSH_URL" == *.git ]] || REPO_SSH_URL="${REPO_SSH_URL}.git"
  fi

  install -d -m 700 -o "$SERVICE_USER" -g "$SERVICE_USER" "$sshdir"

  if [[ -f "$keyfile" ]]; then
    ok "Deploy-ключ уже существует"
  else
    sudo -u "$SERVICE_USER" ssh-keygen -t ed25519 -N "" \
      -C "exchangekit-deploy@${DOMAIN}" -f "$keyfile" >/dev/null
    ok "Сгенерирован deploy-ключ (ed25519)"
  fi

  # known_hosts для github.com (чтобы git pull не спрашивал подтверждение)
  sudo -u "$SERVICE_USER" bash -c \
    "ssh-keyscan -t ed25519,rsa github.com >> '${sshdir}/known_hosts' 2>/dev/null" || true
  sudo -u "$SERVICE_USER" bash -c \
    "sort -u '${sshdir}/known_hosts' -o '${sshdir}/known_hosts' 2>/dev/null" || true
  chown -R "$SERVICE_USER:$SERVICE_USER" "$sshdir"

  # Привязываем origin к SSH-форме, чтобы кнопка «Обновить» тянула по ключу
  if [[ -d "${APP_DIR}/.git" && -n "$REPO_SSH_URL" ]]; then
    sudo -u "$SERVICE_USER" git -C "$APP_DIR" remote set-url origin "$REPO_SSH_URL"
    ok "origin → ${REPO_SSH_URL}"
  fi

  echo
  echo -e "${YELLOW}Добавьте этот публичный ключ как Deploy key в GitHub:${NC}"
  echo -e "  Репозиторий → Settings → Deploy keys → Add deploy key (read-only достаточно)"
  echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
  cat "${keyfile}.pub"
  echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
  read -rp "Enter — когда ключ добавлен, либо 's' — пропустить проверку: " ans

  if [[ "${ans,,}" != s* && -n "$REPO_SSH_URL" ]]; then
    info "Проверяю SSH-доступ к репозиторию…"
    if sudo -u "$SERVICE_USER" git -C "$APP_DIR" ls-remote origin >/dev/null 2>&1; then
      ok "Доступ подтверждён — обновление через git pull будет работать"
    else
      warn "SSH-доступ к репозиторию не получен."
      warn "Проверьте, что deploy-ключ добавлен в GitHub. Установка продолжится,"
      warn "но кнопка «Обновить» не сможет тянуть код, пока доступ не настроен."
    fi
  fi
}

# ---------------------------------------------------------------------------
# PostgreSQL
# ---------------------------------------------------------------------------
DB_PASSWORD=""
setup_database() {
  phase "Шаг 6/10 — PostgreSQL"
  systemctl enable --now postgresql >/dev/null 2>&1 || true

  # Повторно используем существующий пароль, если установка запускается заново
  DB_PASSWORD="$(read_env_value POSTGRES_PASSWORD)"
  [[ -n "$DB_PASSWORD" ]] || DB_PASSWORD="$(gen_pass)"

  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
    sudo -u postgres psql -qc "ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';"
    ok "Роль ${DB_USER} обновлена"
  else
    sudo -u postgres psql -qc "CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';"
    ok "Роль ${DB_USER} создана"
  fi

  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
    sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
    ok "База ${DB_NAME} создана"
  else
    ok "База ${DB_NAME} уже существует"
  fi
  # Схему таблиц сервер создаёт сам при старте (initSchema).
}

# ---------------------------------------------------------------------------
# .env
# ---------------------------------------------------------------------------
write_env() {
  phase "Шаг 7/10 — Файл окружения (.env)"

  local scheme="http" jwt_secret
  [[ "$ENABLE_SSL" == y* ]] && scheme="https"
  local public_url="${scheme}://${DOMAIN}"

  # Сохраняем JWT_SECRET между запусками, чтобы не разлогинивать пользователей
  jwt_secret="$(read_env_value JWT_SECRET)"
  [[ -n "$jwt_secret" ]] || jwt_secret="$(gen_secret)"

  local smtp_secure="false"
  [[ "$SMTP_PORT" == "465" ]] && smtp_secure="true"

  cat > "${APP_DIR}/.env" <<EOF
# ExchangeKit — production config
# Сгенерировано: $(date)

# ── Frontend (встраивается в сборку Vite, только VITE_*) ──────────────────
VITE_APP_ENV=production
VITE_APP_URL=${public_url}
# Фронтенд и API на одном домене, nginx проксирует /api → backend
VITE_API_BASE_URL=${public_url}
VITE_COINGECKO_API_URL=https://api.coingecko.com/api/v3
VITE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TELEGRAM=false
VITE_ENABLE_2FA=true
VITE_DEFAULT_THEME=dark
VITE_DEFAULT_LANGUAGE=ru
VITE_SESSION_TIMEOUT=30

# ── Backend (server/, в браузер не попадает) ──────────────────────────────
NODE_ENV=production
AUTH_PORT=${API_PORT}
CORS_ORIGIN=${public_url}
APP_URL=${public_url}

DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

JWT_SECRET=${jwt_secret}
JWT_ACCESS_TTL=7d
BCRYPT_ROUNDS=12
TOTP_ISSUER=ExchangeKit

MAX_FAILED_LOGINS=5
LOCK_MINUTES=15

# Seed-админ (создаётся сервером при первом запуске, если админа ещё нет)
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=${ADMIN_NAME}

# Отслеживание оплаты в Ethereum (ETH/ERC20)
ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY}

# SMTP (пустой SMTP_HOST → письма в лог)
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_SECURE=${smtp_secure}
SMTP_USER=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASSWORD}
SMTP_FROM_NAME=${SMTP_FROM_NAME}
SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL}

# Для внутреннего использования скриптами (docker-compose не используется)
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}
EOF

  chown "$SERVICE_USER:$SERVICE_USER" "${APP_DIR}/.env"
  chmod 600 "${APP_DIR}/.env"
  ok ".env создан"
}

# ---------------------------------------------------------------------------
# Сборка
# ---------------------------------------------------------------------------
build_app() {
  phase "Шаг 8/10 — Установка зависимостей и сборка фронтенда"
  info "npm install (включая devDependencies — нужны tsx и vite)…"
  sudo -u "$SERVICE_USER" bash -lc "cd '$APP_DIR' && npm install --no-audit --no-fund"
  info "npm run build…"
  sudo -u "$SERVICE_USER" bash -lc "cd '$APP_DIR' && npm run build"
  [[ -f "${APP_DIR}/dist/index.html" ]] || die "Сборка не создала dist/index.html"
  ok "Фронтенд собран в ${APP_DIR}/dist"
}

# ---------------------------------------------------------------------------
# systemd-сервис бэкенда
# ---------------------------------------------------------------------------
setup_systemd() {
  phase "Шаг 9/10 — systemd-сервис бэкенда"
  cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=ExchangeKit API server (Express)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
ExecStart=${APP_DIR}/node_modules/.bin/tsx server/index.ts
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}" >/dev/null 2>&1
  systemctl restart "${SERVICE_NAME}"

  # Ждём, пока поднимется /health
  info "Жду запуска API…"
  local ok_health="" i
  for i in $(seq 1 20); do
    if curl -fsS "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; then ok_health=1; break; fi
    sleep 1
  done
  [[ -n "$ok_health" ]] || { journalctl -u "${SERVICE_NAME}" -n 30 --no-pager || true; die "API не отвечает на /health — см. journalctl -u ${SERVICE_NAME}"; }
  ok "API запущен (systemd: ${SERVICE_NAME})"

  # Правило sudoers для кнопки «Обновить» в админке: сервис может запустить
  # триггер обновления без пароля. Триггер стартует обновление отдельным
  # systemd-юнitом (см. trigger-update.sh / run-update.sh).
  cat > "/etc/sudoers.d/exchangekit-update" <<EOF
${SERVICE_USER} ALL=(root) NOPASSWD: ${APP_DIR}/INSTALL/trigger-update.sh
EOF
  chmod 440 "/etc/sudoers.d/exchangekit-update"
}

# ---------------------------------------------------------------------------
# nginx + SSL + firewall
# ---------------------------------------------------------------------------
setup_nginx() {
  phase "Шаг 10/10 — nginx и брандмауэр"

  cat > "/etc/nginx/sites-available/exchangekit" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${APP_DIR}/dist;
    index index.html;

    # KYC-документы передаются base64 через /api — поднимаем лимит тела запроса
    client_max_body_size 15m;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /health {
        proxy_pass http://127.0.0.1:${API_PORT}/health;
        access_log off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)\$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

  ln -sf /etc/nginx/sites-available/exchangekit /etc/nginx/sites-enabled/exchangekit
  rm -f /etc/nginx/sites-enabled/default
  nginx -t >/dev/null 2>&1 || die "Ошибка в конфигурации nginx (nginx -t)"
  systemctl enable nginx >/dev/null 2>&1
  systemctl restart nginx
  ok "nginx настроен (раздаёт SPA, проксирует /api → :${API_PORT})"

  # Брандмауэр
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
  yes | ufw enable >/dev/null 2>&1 || true
  ok "UFW: разрешены SSH, HTTP, HTTPS"

  # SSL
  if [[ "$ENABLE_SSL" == y* ]]; then
    info "Получаю сертификат Let's Encrypt…"
    apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
    if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${ADMIN_EMAIL}" --redirect; then
      ok "HTTPS включён для ${DOMAIN}"
    else
      warn "Не удалось получить сертификат. Сайт работает по HTTP."
      warn "Повторить позже: certbot --nginx -d ${DOMAIN}"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Финал
# ---------------------------------------------------------------------------
finish() {
  local scheme="http"
  [[ "$ENABLE_SSL" == y* ]] && scheme="https"

  cat > "${APP_DIR}/.credentials" <<EOF
ExchangeKit — учётные данные администратора
Дата установки: $(date)

URL:           ${scheme}://${DOMAIN}
Админ-панель:  ${scheme}://${DOMAIN}/admin/login
E-mail:        ${ADMIN_EMAIL}
Пароль:        ${ADMIN_PASSWORD}

ВАЖНО: сохраните эти данные и удалите файл .credentials.
EOF
  chmod 600 "${APP_DIR}/.credentials"

  echo
  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Установка завершена${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo -e "  Сайт:         ${CYAN}${scheme}://${DOMAIN}${NC}"
  echo -e "  Админ-панель: ${CYAN}${scheme}://${DOMAIN}/admin/login${NC}"
  echo -e "  E-mail:       ${ADMIN_EMAIL}"
  echo -e "  Пароль:       ${ADMIN_PASSWORD}"
  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo
  echo "Полезные команды:"
  echo "  Логи API:      journalctl -u ${SERVICE_NAME} -f"
  echo "  Рестарт API:   systemctl restart ${SERVICE_NAME}"
  echo "  Статус:        systemctl status ${SERVICE_NAME}"
  echo "  Логи nginx:    tail -f /var/log/nginx/error.log"
  echo "  Обновление:    bash ${APP_DIR}/INSTALL/update.sh"
  echo
  [[ "$ENABLE_SSL" == y* ]] || echo -e "${YELLOW}HTTPS не настроен. Включить: certbot --nginx -d ${DOMAIN}${NC}"
  log "=== Установка успешно завершена ==="
}

# ---------------------------------------------------------------------------
main() {
  require_root
  : > "${INSTALL_LOG}"
  log "=== Запуск установки ExchangeKit ==="
  collect_config
  install_system_packages
  install_node
  setup_user_and_code
  setup_deploy_key
  setup_database
  write_env
  build_app
  setup_systemd
  setup_nginx
  finish
}

main "$@"
