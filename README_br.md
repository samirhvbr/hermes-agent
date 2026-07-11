<!-- FORK-SAMIRHVBR:START — tradução/visão pt-BR do nosso fork; arquivo novo, não vai para PRs no upstream -->
# Hermes Agent ☤ — visão em português (fork `samirhvbr`)

> **Fork operacional** de [`NousResearch/hermes-agent`](https://github.com/NousResearch/hermes-agent).
> Público, licença **MIT**. Melhorias voltam como **PR para o upstream**.
> README completo (upstream, en): **[README.md](README.md)** · convenções do fork: **[CLAUDE.md](CLAUDE.md)**.

Este documento é um resumo em pt-BR do que é o Hermes e de como **nós** operamos este fork.
A documentação de produto completa (todos os recursos, provedores, plataformas) fica no
[README.md](README.md) em inglês e em [hermes-agent.nousresearch.com/docs](https://hermes-agent.nousresearch.com/docs/).

---

## O que é

O **Hermes Agent** é o agente de IA **auto-aperfeiçoável** da [Nous Research](https://nousresearch.com):
o único com um laço de aprendizado embutido — cria *skills* a partir da experiência, melhora-as
durante o uso, persiste conhecimento, busca nas próprias conversas passadas e constrói um modelo
de quem você é ao longo das sessões. Roda num VPS de US$5, num cluster de GPU ou em infra
serverless que custa quase nada ociosa. Não fica preso ao laptop: dá pra falar com ele pelo
Telegram enquanto ele trabalha numa VM na nuvem.

Use **qualquer modelo** — [Nous Portal](https://portal.nousresearch.com), OpenRouter, OpenAI,
seu próprio endpoint e [muitos outros](https://hermes-agent.nousresearch.com/docs/integrations/providers).
Troca com `hermes model` — sem mexer no código, sem *lock-in*.

| Recurso | Resumo |
|---|---|
| **Terminal de verdade** | TUI completa: edição multilinha, autocomplete de comandos, histórico, interromper-e-redirecionar, saída de ferramenta em streaming. |
| **Vive onde você vive** | Telegram, Discord, Slack, WhatsApp, Signal e CLI — tudo de um único processo *gateway*. Transcrição de áudio, continuidade entre plataformas. |
| **Laço de aprendizado fechado** | Memória curada pelo agente, criação autônoma de *skills*, busca em sessões (FTS5), modelagem de usuário via [Honcho](https://github.com/plastic-labs/honcho). Compatível com o padrão aberto [agentskills.io](https://agentskills.io). |
| **Automação agendada** | Scheduler cron embutido, entrega em qualquer plataforma. Relatórios diários, backups noturnos — em linguagem natural, sem supervisão. |
| **Delega e paraleliza** | Subagentes isolados para trabalhos paralelos; scripts Python que chamam ferramentas via RPC. |
| **Roda em qualquer lugar** | Seis backends de terminal — local, Docker, SSH, Singularity, Modal e Daytona (persistência serverless que hiberna ocioso). |

---

## Instalação rápida (uso)

Linux / macOS / WSL2 / Termux:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc
hermes              # começa a conversar
```

O instalador cuida de tudo (uv, Python 3.11, Node.js, ripgrep, ffmpeg). Depois:

```bash
hermes model        # escolhe provedor e modelo
hermes tools        # liga/desliga ferramentas
hermes gateway      # sobe o gateway de mensageria (Telegram, Discord, …)
hermes setup        # assistente completo de configuração
hermes doctor       # diagnostica problemas
```

Windows nativo (PowerShell): `iex (irm https://hermes-agent.nousresearch.com/install.ps1)`.

---

## Como trabalhamos neste fork

- **Convenções, versionamento e commits:** [CLAUDE.md](CLAUDE.md).
- **Guia de desenvolvimento do código (upstream):** [AGENTS.md](AGENTS.md).
- **Segurança operacional:** [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md).
- **Deploy do gateway em produção:** [`deploy.sh`](deploy.sh) + [docs/fork/deploy.md](docs/fork/deploy.md).
- **Versão do nosso fork:** [`version.md`](version.md) (hoje `0.1.0`) — distinta da versão do
  Hermes em `pyproject.toml`.

### Contribuir de volta (PR para a Nous)

Melhorou algo que serve para todo mundo? Ramifique de `upstream/main`, use **Conventional Commits
em inglês**, não inclua os arquivos de fork e abra o PR contra `NousResearch/hermes-agent`. Passo a
passo em [CLAUDE.md](CLAUDE.md#2-branches-destinadas-a-pr-para-o-upstream).

---

## Setup de desenvolvimento

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
cd "${HERMES_HOME:-$HOME/.hermes}/hermes-agent"
uv pip install -e ".[all,dev]"
scripts/run_tests.sh
```

> Rode os testes **sempre** por `scripts/run_tests.sh` (replica a CI). Não chame `pytest` direto.

---

## Licença e créditos

MIT — ver [LICENSE](LICENSE). Construído pela [Nous Research](https://nousresearch.com).
Este fork é mantido por Samir Hanna Verza (`samirhvbr`) para uso e operação próprios.
<!-- FORK-SAMIRHVBR:END -->
