#!/usr/bin/env bash

#############################################################################
# ExchangeKit — обновление установленного приложения
# Версия: 2.0.0  (нативная схема)
#
# Шаги: бэкап → git pull → npm install → npm run build → рестарт API.
# Фронтенд (dist/) подхватывается nginx сразу, без рестарта.
#
# Используется в т.ч. кнопкой «Обновить» в админке через sudoers-правило:
#   exchangekit ALL=(root) NOPASSWD: /opt/exchangekit/INSTALL/update.sh
#############################################################################

set -euo pipefail

APP_DIR="/opt/exchangekit"
SERVICE_USER="exchangekit"
SERVICE_NAME="exchangekit-api"
API_PORT=4000
BACKUP_DIR="/opt/exchangekit-backups"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${CYAN}➜${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
die()  { echo -e "${RED}✗ ОШИБКА:${NC} $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Запуск только от root (sudo)."
[[ -d "$APP_DIR" ]] || die "Приложение не найдено в ${APP_DIR}."
[[ -f "${APP_DIR}/.env" ]] || die ".env не найден — приложение не установлено."

# ── Бэкап (.env, .credentials, текущая сборка, дамп БД) ────────────────────
backup() {
  local ts; ts="$(date +%Y%m%d_%H%M%S)"
  local dst="${BACKUP_DIR}/backup_${ts}"
  info "Бэкап в ${dst}…"
  mkdir -p "$dst"
  cp -a "${APP_DIR}/.env" "$dst/" 2>/dev/null || true
  cp -a "${APP_DIR}/.credentials" "$dst/" 2>/dev/null || true
  # Дамп БД
  local dburl; dburl="$(sed -n 's/^DATABASE_URL=//p' "${APP_DIR}/.env" | head -n1)"
  if [[ -n "$dburl" ]]; then
    sudo -u postgres pg_dump exchange > "${dst}/exchange.sql" 2>/dev/null \
      && ok "Дамп БД сохранён" || warn "Не удалось сделать дамп БД (продолжаю)"
  fi
  # Чистим старые бэкапы — оставляем 5 последних
  ls -1dt "${BACKUP_DIR}"/backup_* 2>/dev/null | tail -n +6 | xargs -r rm -rf
  ok "Бэкап готов"
}

# ── Обновление кода ────────────────────────────────────────────────────────
pull_code() {
  if [[ -d "${APP_DIR}/.git" ]]; then
    info "git pull…"
    local branch
    branch="$(sudo -u "$SERVICE_USER" git -C "$APP_DIR" rev-parse --abbrev-ref HEAD)"
    sudo -u "$SERVICE_USER" git -C "$APP_DIR" fetch --quiet origin "$branch"
    # reset --hard трогает только отслеживаемые файлы; .env, node_modules,
    # .credentials и дампы БД не в git и сохраняются.
    sudo -u "$SERVICE_USER" git -C "$APP_DIR" reset --hard "origin/${branch}" --quiet
    ok "Код обновлён до $(git -C "$APP_DIR" rev-parse --short HEAD)"
  else
    warn "Каталог не является git-репозиторием — пропускаю git pull."
    warn "Залейте новые файлы в ${APP_DIR} вручную и запустите скрипт снова."
  fi
}

# ── Зависимости и сборка ───────────────────────────────────────────────────
rebuild() {
  info "npm install…"
  sudo -u "$SERVICE_USER" bash -lc "cd '$APP_DIR' && npm install --no-audit --no-fund"
  info "npm run build…"
  sudo -u "$SERVICE_USER" bash -lc "cd '$APP_DIR' && npm run build"
  [[ -f "${APP_DIR}/dist/index.html" ]] || die "Сборка не создала dist/index.html"
  chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
  ok "Зависимости обновлены, фронтенд пересобран"
}

# ── Рестарт и проверка ─────────────────────────────────────────────────────
restart() {
  info "Перезапуск API…"
  systemctl restart "$SERVICE_NAME"
  local i
  for i in $(seq 1 20); do
    if curl -fsS "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; then
      ok "API работает после обновления"
      return
    fi
    sleep 1
  done
  journalctl -u "$SERVICE_NAME" -n 30 --no-pager || true
  die "API не отвечает после обновления — см. journalctl -u ${SERVICE_NAME}"
}

echo -e "${CYAN}━━━ Обновление ExchangeKit ━━━${NC}"
backup
pull_code
rebuild
restart
echo -e "${GREEN}═══ Обновление завершено ═══${NC}"
