#!/usr/bin/env bash
#############################################################################
# ExchangeKit — триггер обновления из админки.
#
# Запускается сервисом через sudo (правило в /etc/sudoers.d/exchangekit-update)
# и стартует обновление как отдельный transient systemd-юнит. Благодаря этому
# перезапуск exchangekit-api в процессе обновления НЕ убивает само обновление
# (оно живёт в собственном cgroup).
#############################################################################
set -euo pipefail

APP_DIR="/opt/exchangekit"

exec systemd-run \
  --unit=exchangekit-update \
  --collect \
  --description="ExchangeKit self-update" \
  "${APP_DIR}/INSTALL/run-update.sh"
