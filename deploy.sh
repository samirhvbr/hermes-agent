#!/bin/bash
# versão 1.0 - 2026-07-11
#
# Deploy idempotente do gateway do Hermes (fork samirhvbr) via docker compose.
# - Sai cedo se nada novo no branch.
# - Preflight de ambiente ANTES de mexer em qualquer coisa: ABORTA se faltar
#   requisito OBRIGATÓRIO (docker/compose, ~/.hermes) e AVISA se faltar
#   RECOMENDADO — mata o "falso negativo" (deploy verde com degradação
#   silenciosa: sem notificação, API server exposto sem chave).
# - fast-forward --ff-only; nunca reescreve histórico.
# - Reconstrói a imagem (docker compose build) e sobe (up -d).
# - HERMES_UID/GID derivados de id -u/id -g (dono de ~/.hermes) para os arquivos
#   criados no container ficarem consistentes no host.
# - Lock impede dois deploys simultâneos. Notifica no Telegram (se configurado).
#
# Segredos do AGENTE vivem em ~/.hermes (geridos por `hermes setup`/`hermes config`),
# NUNCA neste repositório. O .env da raiz guarda só variáveis de DEPLOY (notificação,
# overrides de UID/GID) e está no .gitignore.
#
# Runbook completo: docs/fork/deploy.md.

set -euo pipefail

# ── Config (ajuste ao seu servidor) ──────────────────────────────────────────
DIR="${HERMES_DEPLOY_DIR:-$(cd "$(dirname "$0")" && pwd)}"
BRANCH="${DEPLOY_BRANCH:-main}"
REMOTE="${DEPLOY_REMOTE:-origin}"
LOCK="/tmp/hermes-deploy.lock"
HERMES_DATA="${HERMES_HOME:-$HOME/.hermes}"

# ── Helpers ──────────────────────────────────────────────────────────────────
log() { printf '[%(%H:%M:%S)T] %s\n' -1 "$*"; }

# Lê uma chave do .env (sem 'source', evita quebra com quoting). Ausente => vazio.
get_env() {
    local key=$1
    [ -f "$DIR/.env" ] || return 0
    { grep -E "^${key}=" "$DIR/.env" 2>/dev/null || true; } | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

# Valor efetivo: .env primeiro, senão ambiente do processo. Vazio => "não configurado".
env_value() {
    local key=$1 val
    val=$(get_env "$key")
    if [ -n "$val" ]; then printf '%s' "$val"; else printf '%s' "${!key:-}"; fi
}

# Envia mensagem no Telegram (silencioso se credenciais ausentes).
notify() {
    [ -n "${TG_BOT:-}" ] && [ -n "${TG_CHAT:-}" ] || return 0
    curl -fsS -m 5 -X POST "https://api.telegram.org/bot${TG_BOT}/sendMessage" \
        --data-urlencode "chat_id=${TG_CHAT}" \
        --data-urlencode "text=$1" \
        --data-urlencode "parse_mode=HTML" \
        >/dev/null 2>&1 || log "(notify Telegram falhou; ignorando)"
}

# Preflight de plataforma: docker + compose + ~/.hermes. ABORTA se faltar.
check_platform() {
    local fail=0
    if ! command -v docker >/dev/null 2>&1; then
        log "❌ 'docker' não encontrado no PATH."; fail=1
    elif ! docker compose version >/dev/null 2>&1; then
        log "❌ 'docker compose' (plugin v2) indisponível."; fail=1
    fi
    if [ ! -d "$HERMES_DATA" ] || [ -z "$(ls -A "$HERMES_DATA" 2>/dev/null)" ]; then
        log "❌ '$HERMES_DATA' ausente/vazio — rode 'hermes setup' antes do 1º deploy (config/segredos do agente)."
        fail=1
    fi
    if [ "$fail" = "1" ]; then
        notify "❌ <b>Deploy Hermes abortado no preflight de plataforma</b>"
        exit 1
    fi
    log "✓ Plataforma OK — docker/compose presentes, config em $HERMES_DATA."
}

# Preflight de variáveis: OBRIGATÓRIAS abortam, RECOMENDADAS avisam. Coleta todas
# as ausentes de uma vez (não para na primeira). Antídoto do "falso negativo".
check_env() {
    local key missing_req=() missing_opt=()
    for key in "${REQUIRED_ENV[@]:-}"; do
        [ -n "$key" ] || continue
        [ -z "$(env_value "$key")" ] && missing_req+=("$key")
    done
    for key in "${OPTIONAL_ENV[@]:-}"; do
        [ -n "$key" ] || continue
        [ -z "$(env_value "$key")" ] && missing_opt+=("$key")
    done
    if [ "${#missing_opt[@]}" -gt 0 ]; then
        log "⚠️  Variáveis recomendadas ausentes (deploy segue): ${missing_opt[*]}"
    fi
    if [ "${#missing_req[@]}" -gt 0 ]; then
        log "❌ Variáveis OBRIGATÓRIAS ausentes: ${missing_req[*]}"
        log "   Configure no .env (ou ambiente) e rode de novo — nada foi alterado."
        notify "❌ <b>Deploy Hermes abortado no preflight</b> — faltam: <code>${missing_req[*]}</code>"
        exit 1
    fi
    log "✓ Preflight de env OK — ${#REQUIRED_ENV[@]} obrigatória(s), ${#OPTIONAL_ENV[@]} recomendada(s)."
}

cleanup_on_failure() {
    log "❌ Deploy falhou."
    notify "❌ <b>Deploy Hermes falhou</b> em <code>$(git -C "$DIR" rev-parse --short HEAD 2>/dev/null || echo '?')</code>"
}
fail() { log "❌ $*"; cleanup_on_failure; exit 1; }

# ── Lock ─────────────────────────────────────────────────────────────────────
exec 9>"$LOCK"
flock -n 9 || { printf '❌ outro deploy já está rodando (lock: %s)\n' "$LOCK" >&2; exit 1; }

cd "$DIR" || { printf '❌ %s não existe\n' "$DIR" >&2; exit 1; }

# Variáveis de notificação do .env.
TG_BOT=$(get_env DEPLOY_TELEGRAM_BOT_TOKEN)
TG_CHAT=$(get_env DEPLOY_TELEGRAM_CHAT_ID)

# ── 1. Fetch e checagem de mudanças ─────────────────────────────────────────
log "==> Buscando alterações em $REMOTE/$BRANCH..."
git fetch --quiet "$REMOTE" "$BRANCH" || fail "git fetch falhou"

LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse "$REMOTE/$BRANCH")

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
    log "✓ Nada novo em $REMOTE/$BRANCH. Saindo."
    exit 0
fi

# ── 2. Preflight (só quando há algo novo pra subir) ─────────────────────────
check_platform

# Editar conforme o servidor. Segredos do AGENTE ficam em ~/.hermes (não aqui).
REQUIRED_ENV=()
OPTIONAL_ENV=(DEPLOY_TELEGRAM_BOT_TOKEN DEPLOY_TELEGRAM_CHAT_ID)
# Se você expõe o API server OpenAI-compatível, a chave de auth é obrigatória:
if [ -n "$(env_value API_SERVER_HOST)" ]; then REQUIRED_ENV+=(API_SERVER_KEY); fi
check_env

if ! git diff --quiet || ! git diff --cached --quiet; then
    log "⚠️  Working tree tem mudanças locais não commitadas."
fi

# Daqui pra frente, qualquer falha dispara cleanup.
trap cleanup_on_failure ERR

# ── 3. Fast-forward ─────────────────────────────────────────────────────────
log "==> Trazendo $(git rev-parse --short "$LOCAL_SHA") → $(git rev-parse --short "$REMOTE_SHA")..."
git merge --ff-only "$REMOTE/$BRANCH" \
    || fail "fast-forward falhou (working tree divergiu? resolva manual e rode de novo)"

# ── 4. Build + up ───────────────────────────────────────────────────────────
export HERMES_UID="${HERMES_UID:-$(id -u)}"
export HERMES_GID="${HERMES_GID:-$(id -g)}"
log "==> docker compose build (HERMES_UID=$HERMES_UID HERMES_GID=$HERMES_GID)..."
docker compose build || fail "docker compose build falhou"

log "==> docker compose up -d..."
docker compose up -d || fail "docker compose up falhou"

# ── 5. Health check ─────────────────────────────────────────────────────────
log "==> Estado dos serviços:"
docker compose ps
if ! docker compose ps --status running --services 2>/dev/null | grep -q '^gateway$'; then
    fail "serviço 'gateway' não está 'running' após o up"
fi

# Sucesso — desarma o trap e notifica.
trap - ERR
SHORT_SHA=$(git rev-parse --short HEAD)
SUBJECT=$(git log -1 --pretty=%s | head -c 80)
log "✅ Deploy concluído: $SHORT_SHA ($SUBJECT)"
notify "✅ <b>Deploy Hermes concluído</b>: <code>$SHORT_SHA</code> — $SUBJECT"
