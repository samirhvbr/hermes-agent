# CLAUDE.md — hermes-agent (fork `samirhvbr`)

> Fork operacional de [`NousResearch/hermes-agent`](https://github.com/NousResearch/hermes-agent).
> **Público.** Melhorias voltam como **PR para o upstream**.
>
> Este arquivo é o **guia de convenções do nosso fork**. Para o guia profundo de
> desenvolvimento do código-base (arquitetura, cache de prompt, o que o projeto
> aceita/recusa), leia o **[AGENTS.md](AGENTS.md)** do upstream — preservado na íntegra.
> Segurança operacional em [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md).

---

## 🔄 Antes de começar: `git pull`

**SEMPRE** verifique atualizações remotas antes de escrever ou alterar qualquer coisa:

```bash
git pull                       # da nossa origin (samirhvbr), já pré-autorizado
git fetch upstream             # traz o que a Nous publicou (opcional, antes de sincronizar)
```

Trabalhar sobre uma base desatualizada gera conflitos. Puxe primeiro, sempre. Para só inspecionar: `git fetch && git status`.

---

## O que é este repositório

Hermes Agent é o **agente de IA auto-aperfeiçoável** da Nous Research (Python 3.11 + `uv`):
uma CLI + um *gateway* de mensageria (Telegram, Discord, Slack, WhatsApp, Signal, e-mail, …)
sobre o mesmo núcleo de agente. Roda local, em Docker, SSH, Modal, Daytona — pensado para
viver num VPS/VM na nuvem, não no laptop. Licença **MIT**.

Este diretório (`~/x/hermes-agent`) é o **nosso fork** para uso e operação próprios. O que
melhorarmos e fizer sentido, sugerimos como PR para o upstream.

### Remotes (fork ↔ upstream)

| Remote     | Aponta para                       | Uso                                  |
|------------|-----------------------------------|--------------------------------------|
| `origin`   | `samirhvbr/hermes-agent`          | nosso fork — **push aqui**           |
| `upstream` | `NousResearch/hermes-agent`       | repo oficial — **só fetch / PR**     |

Sincronizar com o upstream (na `main`):

```bash
git fetch upstream
git merge --ff-only upstream/main     # ou: git rebase upstream/main
git push origin main
```

> **Branch padrão:** `main` (alinhada ao upstream) — exceção consciente ao nosso padrão de
> `master`, porque este fork rastreia o upstream e a `main` é a referência de PR/merge.

---

## Configuração do agente

Ver [.claude/settings.json](.claude/settings.json): modelo `opus` (Opus 4.8), effort `max`,
modo padrão `plan` (pede aprovação antes de ações destrutivas). Ver também o [AGENTS.md](AGENTS.md)
do upstream para o modelo mental do código.

---

## Versionamento (`version.md`)

`version.md` é a **nossa linha de versão downstream** — o estado do **nosso trabalho de fork**
(docs, deploy, config, adaptações operacionais). Valor atual: **`0.1.0`**.

> ⚠️ **Não confundir** com a versão do próprio Hermes (`pyproject.toml`, hoje `0.18.2`),
> que é mantida pelo **upstream**. Nossa `version.md` sobe quando **nós** entregamos algo no
> fork — nunca reflita nela um release da Nous.

Esquema **X.Y.Z**:

- **X** — marco estável do fork; incremento manual.
- **Y** — mudança estrutural nossa (novo subsistema operacional, refatoração grande da nossa
  camada de deploy/config); incremento manual.
- **Z** — cada entrega funcional nossa (nova doc, ajuste de `deploy.sh`, nova config).

---

## Commits — dois contextos, duas convenções

### 1. Commits no nosso fork (`origin/main`)

Mudanças **operacionais/nossas** (docs de fork, `deploy.sh`, `version.md`, `.claude/`, tooling):

**Formato obrigatório:** `versão - comentário em português`

```
0.1.0 - Estabelece padrão do fork (deploy.sh, version.md, docs, SECURITY_GUIDELINES)
0.1.1 - Ajusta preflight de env do deploy para exigir HERMES_UID/GID
0.2.0 - Adiciona runbook de operação do gateway no VPS
```

Regras:
1. A versão **sempre** vem de `version.md` — bumpe o arquivo **no mesmo commit** da mudança.
2. Mensagem **em português**, descritiva o suficiente para `git log --grep`.
3. Proibido `feat:`/`fix:`/`chore:` ou vagueza ("ajuste", "update") **neste contexto**.

### 2. Branches destinadas a PR para o upstream

Quando a melhoria é para a Nous:

1. **Ramifique de `upstream/main`**, não da nossa `main`:
   ```bash
   git fetch upstream
   git switch -c fix/descricao-curta upstream/main
   ```
2. Use **Conventional Commits em inglês** — é a convenção do upstream (`feat:`, `fix(scope):`,
   `docs:`, `chore:`). Ex.: `fix(gateway): ground readiness in live runtime state`.
3. **NÃO** inclua arquivos de fork no PR: `version.md`, `deploy.sh`, `CLAUDE.md`, `.claude/`,
   `.continue/`, `docs/fork/`, `README_br.md`, `SECURITY_GUIDELINES.md`, nem os banners de fork
   em `AGENTS.md`/`README.md` (delimitados por `<!-- FORK-SAMIRHVBR:START/END -->`).
4. Siga a **[Contribution Rubric](AGENTS.md#contribution-rubric--what-we-want-what-we-dont)** do
   upstream. Abra o PR contra `NousResearch/hermes-agent`:
   ```bash
   git push origin fix/descricao-curta
   gh pr create --repo NousResearch/hermes-agent --base main
   ```

---

## Testes

Rode **sempre** pelo runner canônico (garante isolamento por arquivo, `TZ=UTC`, hash determinístico):

```bash
scripts/run_tests.sh                 # suíte completa
scripts/run_tests.sh path/to/test_x.py   # um arquivo
```

Não chame `pytest` direto — o runner replica o comportamento da CI. Detalhes no [AGENTS.md](AGENTS.md).

---

## Deploy (produção = gateway no servidor)

`deploy.sh` sobe/atualiza o **gateway** via `docker compose` (serviços `gateway` + `dashboard`,
imagem `hermes-agent`). Segredos e config moram em `~/.hermes` (montado em `/opt/data`), geridos
por `hermes setup` / `hermes config` — **nunca** commitados. Runbook e preflight de ambiente:
[docs/fork/deploy.md](docs/fork/deploy.md).

```bash
./deploy.sh          # idempotente: fetch → preflight → build → up -d → health check
```

---

## Referências rápidas

- Versão do nosso fork: [`version.md`](version.md) · versão do Hermes: `pyproject.toml`
- Guia de dev do código (upstream): [AGENTS.md](AGENTS.md)
- Segurança operacional: [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md) · política do produto: [SECURITY.md](SECURITY.md)
- Deploy: [`deploy.sh`](deploy.sh) + [docs/fork/deploy.md](docs/fork/deploy.md)
- Visão em pt-BR: [README_br.md](README_br.md) · README completo (upstream): [README.md](README.md)
