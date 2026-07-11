# Deploy do gateway (fork `samirhvbr`)

Runbook do [`deploy.sh`](../../deploy.sh) — sobe/atualiza o **gateway do Hermes** em produção
via `docker compose`. Idempotente: sai cedo se não há nada novo, faz preflight de ambiente
antes de tocar em qualquer coisa, reconstrói a imagem e sobe os serviços.

> **Por que Docker?** O único boundary de segurança contra um LLM adversário é o SO
> (ver [SECURITY_GUIDELINES.md](../../SECURITY_GUIDELINES.md) §2). Rodar o gateway em container,
> como usuário dedicado, é a postura de isolamento que adotamos.

## Modelo

- `docker-compose.yml` define dois serviços sobre a imagem `hermes-agent`:
  - **`gateway`** — `command: ["gateway", "run"]`, `restart: unless-stopped`, `network_mode: host`.
  - **`dashboard`** — `command: ["dashboard", "--host", "127.0.0.1", "--no-open"]` (só localhost).
- **Config e segredos** vivem em **`~/.hermes`** (montado em `/opt/data`), geridos por
  `hermes setup` / `hermes config`. **Nada** de segredo no repositório.
- `HERMES_UID` / `HERMES_GID` devem ser o dono de `~/.hermes` para os arquivos criados no
  container ficarem legíveis no host. O `deploy.sh` deriva isso de `id -u`/`id -g`.

## Primeiro deploy (uma vez)

```bash
# 1. Usuário dedicado, sem privilégio (recomendado), com Docker disponível.
# 2. Clonar o fork no servidor:
git clone git@github.com:samirhvbr/hermes-agent.git /srv/hermes && cd /srv/hermes

# 3. Popular a config/segredos do agente (interativo — provider, tokens de plataforma):
hermes setup                 # ou: hermes config set ...  (grava em ~/.hermes)

# 4. Ajustar o topo do deploy.sh se necessário (DIR, BRANCH).
# 5. Subir:
./deploy.sh
```

## Deploys seguintes

```bash
cd /srv/hermes && ./deploy.sh
```

O script: `git fetch` → se nada novo, sai; senão faz **preflight de ambiente**, `--ff-only`,
`docker compose build`, `docker compose up -d` e um health check em `docker compose ps`.

## Preflight de ambiente

Antes de mexer em qualquer coisa, o `deploy.sh` **ABORTA** se faltar algo **obrigatório** e
**AVISA** se faltar algo **recomendado** — mata o "falso negativo" (deploy verde com degradação
silenciosa). Listas editáveis no corpo do script (`REQUIRED_ENV` / `OPTIONAL_ENV`) e as checagens
de plataforma (`check_platform`):

| Checagem | Classe | Motivo |
|---|---|---|
| `docker` + `docker compose` no PATH | **obrigatória** | sem eles não há deploy |
| `~/.hermes` (ou `$HERMES_HOME`) existe e não-vazio | **obrigatória** | config/segredos do agente |
| `DEPLOY_TELEGRAM_BOT_TOKEN` / `DEPLOY_TELEGRAM_CHAT_ID` | recomendada | notificação de deploy |
| `API_SERVER_KEY` (se você expõe o API server) | recomendada | auth obrigatória se exposto |

Variáveis de deploy (notificação, `HERMES_UID/GID` override) podem ficar num `.env` na raiz —
**fora do versionamento** (já no `.gitignore`). Segredos do **agente** ficam em `~/.hermes`, nunca no `.env`.

## Rollback

O compose usa `restart: unless-stopped`. Para voltar a uma versão anterior:

```bash
cd /srv/hermes
git log --oneline -10
git checkout <sha-anterior>          # ou: git reset --hard <sha> (com cuidado)
HERMES_UID=$(id -u) HERMES_GID=$(id -g) docker compose up -d --build
```

## Acesso ao dashboard (remoto)

Nunca exponha o dashboard direto — ele guarda chaves. Use túnel SSH:

```bash
ssh -L 9119:localhost:9119 usuario@servidor
# depois abra http://localhost:9119 no seu navegador local
```

## Notas de segurança

- Rode como **usuário dedicado e sem sudo**; o agente alcança tudo que essa conta alcança.
- Mantenha o dashboard em `127.0.0.1` e o API server desligado (sem `API_SERVER_KEY`).
- Detalhes: [SECURITY_GUIDELINES.md](../../SECURITY_GUIDELINES.md) e
  [docs/security/network-egress-isolation.md](../security/network-egress-isolation.md).
