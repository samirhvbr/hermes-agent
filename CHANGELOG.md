# Changelog

Entries in the commit-message format (`version - short description in English`),
newest first. **Each `##` heading is literally the commit subject** — the entry
is written *before* the commit, so the sentence that lands in `git log` is one
that was weighed rather than improvised at `git commit` time.

Bodies are narrative: what changed, why, and what was measured. This file is
never rewritten.

> **The record starts here.** This file was created after the repository was:
> earlier versions are in `git log` and are deliberately not back-filled, because
> reconstructing them now would produce a plausible history rather than a true
> one.


## 0.1.10 - the permission lists follow repodocs: five commands move to ask, seven rules leave deny

`rm -rf` and `curl`/`wget` piped into a shell leave `deny` and now ask for confirmation.
Reading `.env`/`.env.*`, `git push --force`/`-f`, `git reset --hard` and `git clean -fd`
leave `deny`. Key reads (`*.pem`, `*.key`, `*.p8`, `*.p12`, `*.pfx`) stay blocked. The
owner's decision on 24/09/2026, replicated from repodocs 1.17.0 (ADR-028).

## 0.1.9 - the repository stops choosing the model

`CLAUDE_CODE_SUBAGENT_MODEL` leaves `.claude/settings.json`. The model is now the user's
choice, made with `/model`, and a subagent inherits it: by default Claude Code gives a
subagent the session's model, and this variable was the only thing making it different —
with the session on Opus 5.5, subagents were measured on Opus 5, because the variable names
the `opus` alias and the alias still resolves through the organization's managed pin.

`CLAUDE.md` stop(s) describing a model profile.

Rule and measurement: repodocs ADR-027.

No test: configuration and documents. Checked that the file parses and that repodocs
runbook §7's check is silent here.

## 0.1.8 - the model pin leaves .claude/settings.json

`"model": "opus[1m]"` and `env.ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-5` are gone, and the
profile comment that prescribed them now says why. The suffix was the trap: `opus[1m]` reads
as a window choice and behaves as a version pin, because the 1M variant existed only for the
previous Opus — so the alias that promised "always the newest Opus" was silently cancelled by
the thing next to it. The env pin is worse than a pin: it redefines what `opus` means for
everything that reads it, the `/model` picker included, which is how the newer model stopped
being selectable at all.

This repository was one of six in the fleet still carrying the env pin alive when it was
measured on 24/09/2026. It changes nothing by itself — the deciding layer is the account's
server-managed settings, which outrank every local file — and that is written down in
repodocs ADR-026, along with what to write instead: name the version, `"model": "opus55"`,
never an alias plus a window suffix.

Nothing to test: two JSON keys and a comment. Checked that the file still parses.

## 0.1.7 - the git hooks are regenerated from repodocs

Both hooks of the standard are rewritten from repodocs, and `tools/release.sh`
with them when it came from there. `commit-msg` checks the shape of the subject
(`X.Y.Z - description`), refuses a Conventional Commits prefix and a vague
message, **and checks that the subject's `X.Y.Z` is the version this commit
carries in `version.md`**. `pre-push` compares the local `version.md` against
the remote default branch for a repeated or a backwards version — **only when
the push actually updates that branch**, so a branch deletion, a tag and a topic
branch pass through.

The hook does **not** check the language and could not: what it measures is the
shape and the number.

Escape hatch, declared in both: `REPODOCS_NO_HOOK=1`. In a fresh clone, enable them with
`git config core.hooksPath tools/git-hooks`.
