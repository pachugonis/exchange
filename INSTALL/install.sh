#!/usr/bin/env bash

#############################################################################
# ExchangeKit — автоматическая установка на VPS
# Версия: 3.0.0  (модель: лицензия + подписанный артефакт релиза)
# Цель:   Ubuntu 24.04 LTS
#
# Что разворачивается:
#   - Node.js 20 LTS, PostgreSQL 16, nginx, certbot
#   - Бэкенд — самодостаточный бандл server.mjs как systemd-сервис exchangekit-api
#   - Фронтенд (dist/) раздаётся nginx; API проксируется на 127.0.0.1:4000
#
# Откуда берётся код:
#   Клиенту НЕ выдаётся git-доступ. Установщик активирует лицензию на
#   лицензионном сервере, скачивает подписанный архив релиза, проверяет sha256
#   и ed25519-подпись и распаковывает его в /opt/exchangekit.
#
# Схема БД и админ-аккаунт создаются самим сервером при первом запуске.
#############################################################################

set -euo pipefail

# ---------------------------------------------------------------------------
# Константы
# ---------------------------------------------------------------------------
APP_DIR="/opt/exchangekit"
SERVICE_USER="exchangekit"
SERVICE_NAME="exchangekit-api"
API_PORT=4000

DB_NAME="exchange"
DB_USER="exchange_user"

NODE_MAJOR=20

# Адрес вашего лицензионного сервера (можно переопределить переменной окружения).
LICENSE_SERVER_URL="${LICENSE_SERVER_URL:-https://license.exchangekit.io}"
RELEASE_CHANNEL="${RELEASE_CHANNEL:-stable}"

INSTALL_LOG="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/installation.log"

# Публичный ключ ed25519 для проверки подписи релизов (см. INSTALL/release.sh keygen).
# Должен соответствовать приватному ключу, которым подписываются артефакты.
read -r -d '' RELEASE_PUBLIC_KEY <<'PUBKEY' || true
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQb+I+iNsZxNIR2KU3zNJ+YYnKRAXgnV/AR9iLm9efeQ=
-----END PUBLIC KEY-----
PUBKEY

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

read_env_value() {
  local key="$1" file="${APP_DIR}/.env"
  [[ -f "$file" ]] || return 0
  sed -n "s/^${key}=//p" "$file" | head -n1
}

gen_secret() { openssl rand -hex 32; }
gen_pass()   { openssl rand -base64 24 | tr -d '/+=' | cut -c1-24; }

# Достать строковое поле из JSON (через node — он ставится на шаге 3).
json_get() { # $1=json  $2=key
  printf '%s' "$1" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const v=j[process.argv[1]];process.stdout.write(v==null?"":String(v));}catch(e){process.exit(1);}})' "$2"
}

# Проверить ed25519-подпись файла. $1=файл $2=подпись(base64)
verify_signature() {
  local file="$1" sig_b64="$2" pub sig rc
  pub="$(mktemp)"; sig="$(mktemp)"
  printf '%s\n' "$RELEASE_PUBLIC_KEY" > "$pub"
  printf '%s' "$sig_b64" | base64 -d > "$sig" 2>/dev/null || { rm -f "$pub" "$sig"; return 1; }
  openssl pkeyutl -verify -pubin -inkey "$pub" -rawin -in "$file" -sigfile "$sig" >/dev/null 2>&1
  rc=$?
  rm -f "$pub" "$sig"
  return $rc
}

# ---------------------------------------------------------------------------
# Конфигурация (интерактивный ввод)
# ---------------------------------------------------------------------------
DOMAIN=""; ADMIN_EMAIL=""; ADMIN_PASSWORD=""; ADMIN_NAME="Administrator"
LICENSE_KEY=""; LICENSE_EMAIL=""; LICENSE_TOKEN=""
ENABLE_SSL="n"
SMTP_HOST=""; SMTP_PORT="587"; SMTP_USER=""; SMTP_PASSWORD=""
SMTP_FROM_EMAIL="noreply@exchangekit.io"; SMTP_FROM_NAME="ExchangeKit"
ETHERSCAN_API_KEY=""

collect_config() {
  phase "Шаг 1/9 — Конфигурация"

  read -rp "Домен сайта (например exchange.example.com): " DOMAIN
  [[ -n "$DOMAIN" ]] || die "Домен обязателен."

  echo
  info "Лицензия (выдаётся после оплаты)."
  read -rp "Лицензионный ключ (LIC-XXXX-XXXX-XXXX-XXXX): " LICENSE_KEY
  [[ "$LICENSE_KEY" == LIC-* ]] || die "Некорректный формат лицензионного ключа."
  read -rp "E-mail, на который оформлена лицензия: " LICENSE_EMAIL
  [[ "$LICENSE_EMAIL" == *@*.* ]] || die "Некорректный e-mail лицензии."

  echo
  read -rp "E-mail администратора сайта: " ADMIN_EMAIL
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
  echo "Лицензия:     $LICENSE_KEY ($LICENSE_EMAIL)"
  echo "Лиц-сервер:   $LICENSE_SERVER_URL"
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
  phase "Шаг 2/9 — Системные пакеты"
  export DEBIAN_FRONTEND=noninteractive
  info "apt update / установка пакетов…"
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg tar rsync ufw openssl \
    nginx postgresql postgresql-contrib >/dev/null
  ok "Базовые пакеты установлены"
}

install_node() {
  phase "Шаг 3/9 — Node.js ${NODE_MAJOR} LTS"
  if command -v node >/dev/null && [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ge "$NODE_MAJOR" ]]; then
    ok "Node $(node -v) уже установлен"
    return
  fi
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs >/dev/null
  ok "Установлен Node $(node -v)"
}

# ---------------------------------------------------------------------------
# Пользователь сервиса
# ---------------------------------------------------------------------------
setup_user() {
  phase "Шаг 4/9 — Пользователь сервиса"
  if ! id "$SERVICE_USER" >/dev/null 2>&1; then
    useradd --system --create-home --shell /usr/sbin/nologin "$SERVICE_USER"
    ok "Создан пользователь $SERVICE_USER"
  else
    ok "Пользователь $SERVICE_USER уже существует"
  fi
  mkdir -p "$APP_DIR"
  chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
}

# ---------------------------------------------------------------------------
# Активация лицензии
# ---------------------------------------------------------------------------
activate_license() {
  phase "Шаг 5/9 — Активация лицензии"
  local proto="http"; [[ "$ENABLE_SSL" == y* ]] && proto="https"
  local payload resp
  payload="$(node -e 'console.log(JSON.stringify({licenseKey:process.argv[1],customerEmail:process.argv[2],domain:process.argv[3],protocol:process.argv[4],termsAgreed:true}))' \
    "$LICENSE_KEY" "$LICENSE_EMAIL" "$DOMAIN" "$proto")"

  resp="$(curl -fsS -X POST "${LICENSE_SERVER_URL}/api/license/activate" \
    -H 'Content-Type: application/json' -d "$payload" 2>/dev/null)" \
    || die "Не удалось активировать лицензию. Проверьте ключ, e-mail, домен и доступность ${LICENSE_SERVER_URL}."

  LICENSE_TOKEN="$(json_get "$resp" token)"
  [[ -n "$LICENSE_TOKEN" ]] || die "Активация отклонена сервером: $(json_get "$resp" message)"
  ok "Лицензия активирована, домен ${DOMAIN} привязан"
}

# ---------------------------------------------------------------------------
# Скачивание и распаковка подписанного релиза
# ---------------------------------------------------------------------------
RELEASE_VERSION=""
fetch_release() {
  phase "Шаг 6/9 — Загрузка релиза"
  local meta version sha sig dl tmp got

  meta="$(curl -fsS "${LICENSE_SERVER_URL}/api/release/latest?licenseKey=${LICENSE_KEY}&domain=${DOMAIN}&channel=${RELEASE_CHANNEL}" 2>/dev/null)" \
    || die "Не удалось получить сведения о релизе (лицензия не даёт доступ или сервер недоступен)."

  version="$(json_get "$meta" version)"
  sha="$(json_get "$meta" sha256)"
  sig="$(json_get "$meta" signature)"
  [[ -n "$version" && -n "$sha" && -n "$sig" ]] || die "Некорректный ответ лиц-сервера: $meta"
  RELEASE_VERSION="$version"
  info "Версия релиза: ${version}"

  tmp="$(mktemp)"
  info "Скачиваю архив…"
  curl -fsS -o "$tmp" "${LICENSE_SERVER_URL}/api/release/download/${version}?licenseKey=${LICENSE_KEY}&domain=${DOMAIN}" \
    || { rm -f "$tmp"; die "Не удалось скачать архив релиза."; }

  got="$(sha256sum "$tmp" | awk '{print $1}')"
  [[ "$got" == "$sha" ]] || { rm -f "$tmp"; die "Контрольная сумма не совпала (ожидалось ${sha}, получено ${got})."; }
  verify_signature "$tmp" "$sig" || { rm -f "$tmp"; die "Подпись релиза неверна — архив отвергнут."; }
  ok "sha256 и подпись проверены"

  info "Распаковываю в ${APP_DIR}…"
  tar -xzf "$tmp" -C "$APP_DIR"
  rm -f "$tmp"
  chmod +x "${APP_DIR}/INSTALL/"*.sh 2>/dev/null || true
  chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
  [[ -f "${APP_DIR}/server.mjs" && -f "${APP_DIR}/dist/index.html" ]] \
    || die "В архиве нет server.mjs или dist/index.html."
  ok "Релиз ${version} распакован"
}

# ---------------------------------------------------------------------------
# PostgreSQL
# ---------------------------------------------------------------------------
DB_PASSWORD=""
setup_database() {
  phase "Шаг 7/9 — PostgreSQL"
  systemctl enable --now postgresql >/dev/null 2>&1 || true

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
}

# ---------------------------------------------------------------------------
# .env
# ---------------------------------------------------------------------------
write_env() {
  phase "Шаг 8/9 — Файл окружения (.env)"

  local scheme="http" jwt_secret
  [[ "$ENABLE_SSL" == y* ]] && scheme="https"
  local public_url="${scheme}://${DOMAIN}"

  jwt_secret="$(read_env_value JWT_SECRET)"
  [[ -n "$jwt_secret" ]] || jwt_secret="$(gen_secret)"

  local smtp_secure="false"
  [[ "$SMTP_PORT" == "465" ]] && smtp_secure="true"

  cat > "${APP_DIR}/.env" <<EOF
# ExchangeKit — production config
# Сгенерировано: $(date)

# ── Backend (server.mjs) ──────────────────────────────────────────────────
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

# ── Лицензия и обновления ─────────────────────────────────────────────────
LICENSE_KEY=${LICENSE_KEY}
LICENSE_EMAIL=${LICENSE_EMAIL}
LICENSE_TOKEN=${LICENSE_TOKEN}
LICENSE_SERVER_URL=${LICENSE_SERVER_URL}
LICENSE_DOMAIN=${DOMAIN}
RELEASE_CHANNEL=${RELEASE_CHANNEL}

# Внутреннее (для скриптов)
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}
EOF

  chown "$SERVICE_USER:$SERVICE_USER" "${APP_DIR}/.env"
  chmod 600 "${APP_DIR}/.env"
  ok ".env создан"
}

# ---------------------------------------------------------------------------
# systemd-сервис бэкенда
# ---------------------------------------------------------------------------
setup_systemd() {
  phase "Шаг 9/9 — systemd, nginx и брандмауэр"
  local node_bin; node_bin="$(command -v node)"

  cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=ExchangeKit API server (bundled)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
ExecStart=${node_bin} ${APP_DIR}/server.mjs
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

  info "Жду запуска API…"
  local ok_health="" i
  for i in $(seq 1 20); do
    if curl -fsS "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; then ok_health=1; break; fi
    sleep 1
  done
  [[ -n "$ok_health" ]] || { journalctl -u "${SERVICE_NAME}" -n 30 --no-pager || true; die "API не отвечает на /health — см. journalctl -u ${SERVICE_NAME}"; }
  ok "API запущен (systemd: ${SERVICE_NAME})"

  # Правило sudoers для кнопки «Обновить» в админке.
  cat > "/etc/sudoers.d/exchangekit-update" <<EOF
${SERVICE_USER} ALL=(root) NOPASSWD: ${APP_DIR}/INSTALL/trigger-update.sh
EOF
  chmod 440 "/etc/sudoers.d/exchangekit-update"
}

# ---------------------------------------------------------------------------
# nginx + SSL + firewall
# ---------------------------------------------------------------------------
setup_nginx() {
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

  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
  yes | ufw enable >/dev/null 2>&1 || true
  ok "UFW: разрешены SSH, HTTP, HTTPS"

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
Версия релиза:  ${RELEASE_VERSION}

URL:           ${scheme}://${DOMAIN}
Админ-панель:  ${scheme}://${DOMAIN}/admin/login
E-mail:        ${ADMIN_EMAIL}
Пароль:        ${ADMIN_PASSWORD}

ВАЖНО: сохраните эти данные и удалите файл .credentials.
EOF
  chmod 600 "${APP_DIR}/.credentials"

  echo
  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Установка завершена (релиз ${RELEASE_VERSION})${NC}"
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
  echo "  Обновление:    bash ${APP_DIR}/INSTALL/update.sh"
  echo
  [[ "$ENABLE_SSL" == y* ]] || echo -e "${YELLOW}HTTPS не настроен. Включить: certbot --nginx -d ${DOMAIN}${NC}"
  log "=== Установка успешно завершена (релиз ${RELEASE_VERSION}) ==="
}

# ---------------------------------------------------------------------------
main() {
  require_root
  : > "${INSTALL_LOG}"
  log "=== Запуск установки ExchangeKit ==="
  collect_config
  install_system_packages
  install_node
  setup_user
  activate_license
  fetch_release
  setup_database
  write_env
  setup_systemd
  setup_nginx
  finish
}

main "$@"
