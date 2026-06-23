#!/usr/bin/env bash

#############################################################################
# ExchangeKit — обновление установленного приложения
# Версия: 3.0.0  (модель: лицензия + подписанный артефакт релиза)
#
# Шаги: бэкап → проверка версии у лиц-сервера → скачивание подписанного
# архива → проверка sha256/подписи → атомарная подмена → рестарт API.
#
# Используется кнопкой «Обновить» в админке через sudoers-правило:
#   exchangekit ALL=(root) NOPASSWD: /opt/exchangekit/INSTALL/trigger-update.sh
#############################################################################

set -uo pipefail

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

# Публичный ключ ed25519 для проверки подписи релизов
# (тот же, что в install.sh; см. INSTALL/release.sh keygen).
read -r -d '' RELEASE_PUBLIC_KEY <<'PUBKEY' || true
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQb+I+iNsZxNIR2KU3zNJ+YYnKRAXgnV/AR9iLm9efeQ=
-----END PUBLIC KEY-----
PUBKEY

# ── Чтение настроек из .env ───────────────────────────────────────────────
env_get() { sed -n "s/^$1=//p" "${APP_DIR}/.env" | head -n1; }
LICENSE_KEY="$(env_get LICENSE_KEY)"
LICENSE_SERVER_URL="$(env_get LICENSE_SERVER_URL)"
LICENSE_DOMAIN="$(env_get LICENSE_DOMAIN)"
RELEASE_CHANNEL="$(env_get RELEASE_CHANNEL)"; RELEASE_CHANNEL="${RELEASE_CHANNEL:-stable}"
[[ -n "$LICENSE_KEY" && -n "$LICENSE_SERVER_URL" && -n "$LICENSE_DOMAIN" ]] \
  || die "В .env нет LICENSE_KEY / LICENSE_SERVER_URL / LICENSE_DOMAIN."

json_get() { # $1=json $2=key
  printf '%s' "$1" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const v=j[process.argv[1]];process.stdout.write(v==null?"":String(v));}catch(e){process.exit(1);}})' "$2"
}

verify_signature() { # $1=файл $2=подпись(base64)
  local pub sig rc
  pub="$(mktemp)"; sig="$(mktemp)"
  printf '%s\n' "$RELEASE_PUBLIC_KEY" > "$pub"
  printf '%s' "$2" | base64 -d > "$sig" 2>/dev/null || { rm -f "$pub" "$sig"; return 1; }
  openssl pkeyutl -verify -pubin -inkey "$pub" -rawin -in "$1" -sigfile "$sig" >/dev/null 2>&1
  rc=$?; rm -f "$pub" "$sig"; return $rc
}

# ── Бэкап (.env, .credentials, дамп БД) ────────────────────────────────────
backup() {
  local ts dst dburl
  ts="$(date +%Y%m%d_%H%M%S)"; dst="${BACKUP_DIR}/backup_${ts}"
  info "Бэкап в ${dst}…"
  mkdir -p "$dst"
  cp -a "${APP_DIR}/.env" "$dst/" 2>/dev/null || true
  cp -a "${APP_DIR}/.credentials" "$dst/" 2>/dev/null || true
  cp -a "${APP_DIR}/VERSION" "$dst/" 2>/dev/null || true
  dburl="$(env_get DATABASE_URL)"
  if [[ -n "$dburl" ]]; then
    sudo -u postgres pg_dump exchange > "${dst}/exchange.sql" 2>/dev/null \
      && ok "Дамп БД сохранён" || warn "Не удалось сделать дамп БД (продолжаю)"
  fi
  ls -1dt "${BACKUP_DIR}"/backup_* 2>/dev/null | tail -n +6 | xargs -r rm -rf
  ok "Бэкап готов"
}

# ── Загрузка и подмена релиза ──────────────────────────────────────────────
fetch_release() {
  local meta version sha sig tmp got stage current
  meta="$(curl -fsS "${LICENSE_SERVER_URL}/api/release/latest?licenseKey=${LICENSE_KEY}&domain=${LICENSE_DOMAIN}&channel=${RELEASE_CHANNEL}" 2>/dev/null)" \
    || die "Не удалось получить сведения о релизе (лицензия не даёт доступ или сервер недоступен)."

  version="$(json_get "$meta" version)"
  sha="$(json_get "$meta" sha256)"
  sig="$(json_get "$meta" signature)"
  [[ -n "$version" && -n "$sha" && -n "$sig" ]] || die "Некорректный ответ лиц-сервера: $meta"

  current="$(cat "${APP_DIR}/VERSION" 2>/dev/null || echo '')"
  if [[ "$version" == "$current" ]]; then
    ok "Уже установлена последняя версия (${version}) — обновление не требуется"
    return 1
  fi
  info "Доступна версия ${version} (текущая: ${current:-неизвестна})"

  tmp="$(mktemp)"
  info "Скачиваю архив…"
  curl -fsS -o "$tmp" "${LICENSE_SERVER_URL}/api/release/download/${version}?licenseKey=${LICENSE_KEY}&domain=${LICENSE_DOMAIN}" \
    || { rm -f "$tmp"; die "Не удалось скачать архив релиза."; }

  got="$(sha256sum "$tmp" | awk '{print $1}')"
  [[ "$got" == "$sha" ]] || { rm -f "$tmp"; die "Контрольная сумма не совпала."; }
  verify_signature "$tmp" "$sig" || { rm -f "$tmp"; die "Подпись релиза неверна — архив отвергнут."; }
  ok "sha256 и подпись проверены"

  # Распаковка в staging, затем атомарная подмена (чтобы не повредить работающий сайт).
  stage="$(mktemp -d)"
  tar -xzf "$tmp" -C "$stage"; rm -f "$tmp"
  [[ -f "$stage/server.mjs" && -f "$stage/dist/index.html" ]] \
    || { rm -rf "$stage"; die "В архиве нет server.mjs или dist/index.html."; }

  info "Подмена файлов…"
  cp -f "$stage/server.mjs" "${APP_DIR}/server.mjs"
  cp -f "$stage/.env.example" "${APP_DIR}/.env.example" 2>/dev/null || true
  cp -f "$stage/VERSION" "${APP_DIR}/VERSION"
  cp -f "$stage/INSTALL/"*.sh "${APP_DIR}/INSTALL/" 2>/dev/null || true
  # dist целиком: новый каталог рядом, затем мгновенная замена
  rm -rf "${APP_DIR}/dist.new"
  cp -R "$stage/dist" "${APP_DIR}/dist.new"
  rm -rf "${APP_DIR}/dist.old"
  mv "${APP_DIR}/dist" "${APP_DIR}/dist.old" 2>/dev/null || true
  mv "${APP_DIR}/dist.new" "${APP_DIR}/dist"
  rm -rf "${APP_DIR}/dist.old" "$stage"

  chmod +x "${APP_DIR}/INSTALL/"*.sh 2>/dev/null || true
  chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
  ok "Релиз ${version} установлен"
  return 0
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
if fetch_release; then
  restart
  echo -e "${GREEN}═══ Обновление завершено ═══${NC}"
else
  echo -e "${GREEN}═══ Обновление не требовалось ═══${NC}"
fi
