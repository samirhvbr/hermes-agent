# SECURITY_GUIDELINES.md — hermes-agent (fork `samirhvbr`)

> Diretrizes de **segurança operacional do nosso fork**: como rodar e operar este agente
> com segurança. Para o **modelo de confiança do produto** e para **reportar vulnerabilidades**,
> a fonte canônica é o [SECURITY.md](SECURITY.md) do upstream (a política é da Nous, não nossa).
>
> Este arquivo foi criado do zero para este projeto — o modelo de ameaça de um **agente que
> executa comandos** é radicalmente diferente do de um app comum. Ao alterar algo aqui, mantenha
> o alinhamento com o `SECURITY.md` do upstream.

---

## 1. Reportar vulnerabilidade (produto)

Não abra issue pública. Use a política do upstream: [GitHub Security Advisories](https://github.com/NousResearch/hermes-agent/security/advisories/new)
ou **security@nousresearch.com**. Não há programa de *bug bounty*. Um bom report inclui
componente afetado (`arquivo.py:linha`), ambiente (`hermes version`, SHA, SO, versão do Python),
reprodução contra `main` e **qual boundary do §2 do `SECURITY.md` é cruzado**.

Se for algo nosso (deploy, docs, config do fork), abra issue/PR **neste fork** (`samirhvbr/hermes-agent`).

---

## 2. A regra que rege tudo: **o único boundary é o SO**

Direto do trust model do upstream (§2 do [SECURITY.md](SECURITY.md)):

> **O único boundary de segurança contra um LLM adversário é o sistema operacional.**
> Nada dentro do processo do agente é contenção — nem o gate de aprovação, nem redação de
> saída, nem scanner de padrão, nem allowlist de ferramenta. Todo componente in-process que
> filtra saída do LLM é uma **heurística** operando sobre uma string influenciada por atacante.

Consequências práticas para **como operamos este fork**:

- **Isole no nível do SO — sempre.** Rode o gateway em **Docker** (whole-process wrapping, é o
  que o [`deploy.sh`](deploy.sh) faz) e/ou selecione um **terminal backend** não-padrão
  (container/remoto/sandbox) para os comandos do agente. Ver `docs/user-guide/security` do upstream.
- **O "trust envelope" é o usuário que roda o Hermes.** O agente alcança **tudo** que a conta do
  SO dele alcança. Portanto: usuário **dedicado e sem privilégio**, **sem sudo**, sem chaves de
  outros serviços no `$HOME`, host atualizado. Nunca rode o gateway como `root`.
- **O gate de aprovação de comandos é conveniência, não contenção.** Não confie nele para
  conter entrada não-confiável. É útil para evitar acidentes, não ataques.

---

## 3. Superfície de entrada é adversária

Qualquer canal que injeta conteúdo no contexto do agente pode carregar **prompt injection**:
entrada do operador, **web fetch**, e-mail, mensagens do gateway, leituras de arquivo,
respostas de **servidores MCP** e resultados de ferramenta. Não existe filtro in-process
confiável contra isso — a proteção é o isolamento de SO do §2.

- Trate saída de `web`/`email`/MCP como potencialmente hostil.
- **MCP servers e plugins rodam dentro do processo do agente** (ou como subprocessos do host) —
  eles **não** são confinados pelo terminal-backend isolation. Só instale MCP/plugins que você
  auditou; eles entram no *trust envelope*.
- A ferramenta de execução de código roda como subprocesso do host — mesma regra.

---

## 4. Segredos

- **Segredos moram em `~/.hermes`** (montado em `/opt/data` no container), geridos por
  `hermes setup` / `hermes config`. **Nunca** commite chave de provedor, token de Telegram/Discord,
  etc.
- No repositório, `.env` serve só para variáveis de **deploy/compose** (ex.: `HERMES_UID/GID`,
  credenciais de notificação de deploy). Já está no [`.gitignore`](.gitignore) — mantenha assim.
- Nunca faça `Read`/log de arquivos de chave (`*.key`, `*.pem`, `~/.hermes/**/secrets`). O
  [.claude/settings.json](.claude/settings.json) já nega isso.
- Rotacione qualquer segredo que vazar para stdout, log ou histórico de conversa.

---

## 5. Exposição de rede (dashboard e API server)

- O **dashboard** guarda chaves de API. Ele liga em **`127.0.0.1`** por padrão — **mantenha
  assim**. Para acesso remoto, **túnel SSH** (`ssh -L 9119:localhost:9119`), nunca
  `--host 0.0.0.0 --insecure`.
- O **API server OpenAI-compatível** do gateway fica **desligado** a menos que você defina
  `API_SERVER_KEY` (auth obrigatória) + `API_SERVER_HOST`. Não exponha em host com IP público
  sem ler `docs/user-guide/api-server.md` do upstream primeiro.
- `network_mode: host` no compose: o container compartilha a rede do host — mais um motivo para
  o host ser dedicado e com firewall.

---

## 6. Controle de acesso do gateway

- Configure **DM pairing / allowed-users** antes de expor o bot. Um usuário que consegue mandar
  DM para o bot pode induzir o agente a executar comandos — e o único freio real é o isolamento
  de SO, não o gate.
- Não coloque o mesmo bot em canais/grupos abertos e com backend de terminal no host.
- Revise periodicamente quem está pareado / autorizado.

---

## 7. Checklist — revisar com atenção ao mexer em

| Área | Pergunte-se |
|---|---|
| Terminal backend | O agente deveria tocar o host? Se não, backend em container/remoto. |
| Deploy / isolamento | Roda em Docker? Usuário dedicado, sem sudo, sem segredos de terceiros no `$HOME`? |
| Segredos | Algo de sensível saiu de `~/.hermes` para o repo, log ou `.env` versionado? |
| Dashboard / API | Continua em `127.0.0.1`? `API_SERVER_KEY` setado se exposto? |
| Gateway | Pairing/allowed-users configurado? Bot fora de canais abertos? |
| MCP / plugins | Auditado? Entende que roda **dentro** do trust envelope (não confinado)? |
| Entrada | Está tratando web/e-mail/MCP como conteúdo adversário? |

Em dúvida sobre um boundary, releia o **§2 do [SECURITY.md](SECURITY.md)** e
[docs/security/network-egress-isolation.md](docs/security/network-egress-isolation.md) antes de mudar.
