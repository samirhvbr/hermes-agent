# docs/fork — documentação do fork `samirhvbr`

Esta pasta guarda a documentação **do nosso fork** operacional, separada da documentação de
produto do upstream (que vive no restante de [`docs/`](../) e em
[hermes-agent.nousresearch.com/docs](https://hermes-agent.nousresearch.com/docs/)).

Mantemos aqui embaixo para **não colidir** com os arquivos do upstream em `docs/` — assim os
merges vindos de `upstream/main` ficam limpos.

## Índice

- [deploy.md](deploy.md) — runbook de deploy do **gateway** em produção (`docker compose`) e o
  **preflight de ambiente** do [`deploy.sh`](../../deploy.sh).

## Ver também (raiz)

- [CLAUDE.md](../../CLAUDE.md) — convenções do fork (remotes, versionamento, commits).
- [SECURITY_GUIDELINES.md](../../SECURITY_GUIDELINES.md) — segurança operacional.
- [AGENTS.md](../../AGENTS.md) — guia de desenvolvimento do código (upstream, preservado).
- [version.md](../../version.md) — versão do fork.
