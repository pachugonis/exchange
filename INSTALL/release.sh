#!/usr/bin/env bash
#############################################################################
# ExchangeKit — сборка и подпись релиза (запускается У ВАС, не у клиента).
#
# Делает:
#   1. собирает фронтенд (vite → dist/);
#   2. бандлит бэкенд в один самодостаточный build/server.mjs (esbuild);
#   3. упаковывает артефакт exchangekit-<version>.tar.gz
#      (БЕЗ исходников сервера, БЕЗ каталога LICENSE/, БЕЗ node_modules);
#   4. считает sha256 и подписывает архив ключом ed25519;
#   5. обновляет локальное зеркало релизов (dist-releases/) и releases.json;
#   6. опционально заливает зеркало на лиц-сервер (RELEASE_SSH_TARGET).
#
# Использование:
#   INSTALL/release.sh keygen                 # один раз: создать пару ключей
#   INSTALL/release.sh <version> [channel]    # собрать релиз (channel=stable)
#
# Переменные окружения:
#   RELEASE_PRIVATE_KEY  путь к приватному ключу (по умолч. release-keys/release-private.pem)
#   RELEASE_SSH_TARGET   куда залить зеркало: user@host:/path
#                        боевой сервер: root@license.exchangekit.cc:/opt/license-server/releases
#   RELEASE_SSH_SUDO     auto (по умолч.) — для root без sudo, иначе через `sudo rsync`.
#                        Можно задать явно 0/1.
#   RELEASE_OWNER        владелец файлов на сервере (по умолч. license:license) —
#                        выставляется всегда, чтобы сервис (юзер license) их прочитал.
#############################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

KEY_DIR="${REPO_ROOT}/release-keys"
PRIV_KEY="${RELEASE_PRIVATE_KEY:-${KEY_DIR}/release-private.pem}"
PUB_KEY="${KEY_DIR}/release-public.pem"
BUILD_DIR="${REPO_ROOT}/build"
MIRROR_DIR="${REPO_ROOT}/dist-releases"   # локальное зеркало того, что лежит на лиц-сервере

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${CYAN}➜${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
die()  { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

sha256() { # portable sha256 → hex
  if command -v sha256sum >/dev/null; then sha256sum "$1" | awk '{print $1}';
  else shasum -a 256 "$1" | awk '{print $1}'; fi
}

# --- keygen ----------------------------------------------------------------
if [[ "${1:-}" == "keygen" ]]; then
  mkdir -p "$KEY_DIR"
  [[ -f "$PRIV_KEY" ]] && die "Ключ уже существует: $PRIV_KEY (удалите вручную, если хотите перевыпустить)"
  openssl genpkey -algorithm ed25519 -out "$PRIV_KEY"
  openssl pkey -in "$PRIV_KEY" -pubout -out "$PUB_KEY"
  chmod 600 "$PRIV_KEY"
  ok "Создана пара ключей в ${KEY_DIR}"
  echo
  echo "Публичный ключ (он зашит в install.sh/update.sh, можно коммитить):"
  echo "─────────────────────────────────────────────"
  cat "$PUB_KEY"
  echo "─────────────────────────────────────────────"
  warn "ПРИВАТНЫЙ ключ ($PRIV_KEY) НИКОМУ не передавать и НЕ коммитить."
  exit 0
fi

# --- build release ---------------------------------------------------------
VERSION="${1:?Использование: release.sh <version> [channel]  (или: release.sh keygen)}"
CHANNEL="${2:-stable}"
[[ -f "$PRIV_KEY" ]] || die "Нет приватного ключа ($PRIV_KEY). Сначала: INSTALL/release.sh keygen"

ESBUILD_BANNER="import{createRequire as __cr}from'module';import{fileURLToPath as __fu}from'url';import{dirname as __dn}from'path';const require=__cr(import.meta.url);const __filename=__fu(import.meta.url);const __dirname=__dn(__filename);"

info "Версия: ${VERSION}  канал: ${CHANNEL}"

info "1/6 Сборка фронтенда (npm ci && npm run build)…"
npm ci --no-audit --no-fund
# Пустой VITE_API_BASE_URL → фронтенд ходит по относительным /api (см. src/api/base.ts),
# поэтому один и тот же dist/ работает на любом домене клиента.
VITE_API_BASE_URL="" npm run build
[[ -f dist/index.html ]] || die "vite build не создал dist/index.html"

info "2/6 Бандл бэкенда (esbuild → build/server.mjs)…"
mkdir -p "$BUILD_DIR"
npx esbuild server/index.ts \
  --bundle --platform=node --format=esm --minify --packages=bundle \
  --banner:js="$ESBUILD_BANNER" \
  --outfile="$BUILD_DIR/server.mjs"
[[ -s "$BUILD_DIR/server.mjs" ]] || die "esbuild не создал server.mjs"

info "3/6 Сборка дерева артефакта…"
STAGE="$BUILD_DIR/stage"
rm -rf "$STAGE"; mkdir -p "$STAGE/INSTALL"
cp "$BUILD_DIR/server.mjs" "$STAGE/server.mjs"
cp -R dist "$STAGE/dist"
cp INSTALL/update.sh INSTALL/run-update.sh INSTALL/trigger-update.sh "$STAGE/INSTALL/"
cp .env.example "$STAGE/.env.example"
printf '%s\n' "$VERSION" > "$STAGE/VERSION"

# Инвариант безопасности: в артефакте не должно быть исходников и кода лиц-сервера.
if find "$STAGE" -path '*/LICENSE/*' -o -name '*.ts' | grep -q .; then
  die "В артефакте найдены .ts или LICENSE/ — сборка прервана"
fi

ART="exchangekit-${VERSION}.tar.gz"
tar -czf "$BUILD_DIR/$ART" -C "$STAGE" .
ok "Архив: build/$ART"

info "4/6 Подпись (ed25519) и контрольная сумма…"
SHA="$(sha256 "$BUILD_DIR/$ART")"
openssl pkeyutl -sign -inkey "$PRIV_KEY" -rawin -in "$BUILD_DIR/$ART" -out "$BUILD_DIR/$ART.sig"
SIG="$(base64 < "$BUILD_DIR/$ART.sig" | tr -d '\n')"
SIZE="$(wc -c < "$BUILD_DIR/$ART" | tr -d ' ')"
ok "sha256=${SHA:0:16}…  size=${SIZE}"

info "5/6 Обновление зеркала релизов и releases.json…"
mkdir -p "$MIRROR_DIR"
cp "$BUILD_DIR/$ART" "$MIRROR_DIR/$ART"
node - "$MIRROR_DIR/releases.json" "$CHANNEL" "$VERSION" "$ART" "$SHA" "$SIG" "$SIZE" <<'NODE'
const [file, channel, version, art, sha256, signature, size] = process.argv.slice(2);
const fs = require('fs');
let m = {};
try { m = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
m[channel] = { version, file: art, sha256, signature, size: Number(size), publishedAt: Date.now() };
fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n');
console.log(`  manifest: ${channel} → ${version}`);
NODE
ok "Зеркало обновлено: ${MIRROR_DIR}"

info "6/6 Публикация на боевой лиц-сервер…"
if [[ -n "${RELEASE_SSH_TARGET:-}" ]]; then
  REMOTE_HOST="${RELEASE_SSH_TARGET%%:*}"   # user@host
  REMOTE_PATH="${RELEASE_SSH_TARGET#*:}"    # /opt/license-server/releases
  [[ "$REMOTE_HOST" != "$RELEASE_SSH_TARGET" ]] || die "RELEASE_SSH_TARGET должен быть в формате user@host:/path"
  REMOTE_OWNER="${RELEASE_OWNER:-license:license}"

  # Под root sudo не нужен; под обычным ssh-пользователем — нужен, т.к. каталог
  # релизов принадлежит системному юзеру license (shell=nologin).
  REMOTE_USER="${REMOTE_HOST%@*}"
  if [[ "${RELEASE_SSH_SUDO:-auto}" == "auto" ]]; then
    [[ "$REMOTE_USER" == "root" ]] && RELEASE_SSH_SUDO=0 || RELEASE_SSH_SUDO=1
  fi
  if [[ "$RELEASE_SSH_SUDO" == "1" ]]; then SUDO="sudo "; else SUDO=""; fi

  # Заливаем зеркало и ВСЕГДА возвращаем владельца на license:license,
  # иначе сервис (работает под license) не прочитает свежий релиз.
  ssh "$REMOTE_HOST" "${SUDO}mkdir -p '$REMOTE_PATH'"
  rsync -av --rsync-path="${SUDO}rsync" "$MIRROR_DIR/" "$RELEASE_SSH_TARGET/"
  ssh "$REMOTE_HOST" "${SUDO}chown -R '$REMOTE_OWNER' '$REMOTE_PATH'"
  ok "Залито на ${RELEASE_SSH_TARGET} (владелец ${REMOTE_OWNER})"
else
  warn "RELEASE_SSH_TARGET не задан — пропускаю заливку."
  echo "    Залейте на боевой сервер так:"
  echo "    RELEASE_SSH_TARGET=root@license.exchangekit.cc:/opt/license-server/releases \\"
  echo "      INSTALL/release.sh ${VERSION} ${CHANNEL}"
fi

echo
ok "Релиз ${VERSION} (${CHANNEL}) готов."
