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
