#!/usr/bin/env bash
#############################################################################
# ExchangeKit — обёртка обновления для админки.
#
# Запускает update.sh и записывает статус в .update-status.json, который
# читает эндпоинт GET /api/system/update/status. Вывод update.sh пишется
# в .update.log. Скрипт выполняется как отдельный systemd-юнит (см.
# trigger-update.sh), поэтому переживает перезапуск exchangekit-api.
#############################################################################
set -uo pipefail

APP_DIR="/opt/exchangekit"
SERVICE_USER="exchangekit"
STATUS="${APP_DIR}/.update-status.json"
LOG="${APP_DIR}/.update.log"

write_status() {
  printf '%s\n' "$1" > "$STATUS"
  chown "${SERVICE_USER}:${SERVICE_USER}" "$STATUS" 2>/dev/null || true
  chmod 644 "$STATUS"
}

write_status "{\"state\":\"running\",\"startedAt\":\"$(date -Iseconds)\"}"

# Создаём лог с правами на чтение для сервиса (редирект ниже только усечёт его,
# сохранив владельца и права).
: > "$LOG"
chown "${SERVICE_USER}:${SERVICE_USER}" "$LOG" 2>/dev/null || true
chmod 644 "$LOG"

if bash "${APP_DIR}/INSTALL/update.sh" > "$LOG" 2>&1; then
  write_status "{\"state\":\"success\",\"finishedAt\":\"$(date -Iseconds)\"}"
else
  code=$?
  write_status "{\"state\":\"error\",\"finishedAt\":\"$(date -Iseconds)\",\"code\":${code}}"
fi
