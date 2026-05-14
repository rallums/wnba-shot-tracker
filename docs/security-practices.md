# Security Practices

Source: https://github.com/MuhammadUsmanGM/claude-code-best-practices/blob/main/guides/security-practices.md

Applied to this WNBA Shot Tracker project. Update this file when practices change.

## 1. Secrets Management

**Rule:** Never hardcode tokens, API keys, or credentials in any file Claude reads or that gets committed.

**Applied:**
- `CRON_SECRET` lives only in Vercel env vars + GitHub Actions secrets
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` injected by Upstash integration
- `.env.example` shows variable names without values
- `scripts/seed.mjs` requires `CRON_SECRET` env var; no fallback default
- Auth check in `app/api/refresh/route.js` uses `timingSafeEqual` (timing-attack resistant)

**Watch for:**
- Don't paste tokens into terminal commands or chat (use `TOKEN=xxx` env var first)
- Rotate any token that ever appears in shell history or logs

## 2. `.claudeignore`

Primary defense for keeping sensitive files out of Claude's context. Uses `.gitignore` syntax.

Excludes `.env*`, key files, credentials dirs, build artifacts.

## 3. `.gitignore`

Hardened to block all `.env*` variants, `*.pem`, `*.key`, `secrets/`, `credentials/`.

## 4. Principle of Least Privilege

| Repo type | Recommended Claude mode |
|---|---|
| This (small personal project) | default — prompt per action |
| Open source | default |
| Repos with secrets | allowlist mode |
| Infrastructure / production | restricted read-only |

**Never** use `--dangerously-skip-permissions` on this repo.

## 5. Input Validation

Applied:
- `app/api/player/[id]/route.js` validates ID as digits-only (`/^\d+$/`) before KV lookup — prevents key injection
- `app/api/refresh/route.js` validates auth header with `timingSafeEqual` — prevents timing attacks

## 6. Audit Checklist Before Pushing

- [ ] `git status` — no unexpected files
- [ ] `git diff` — no hardcoded secrets, no debug `console.log` with sensitive data
- [ ] Token values never in commit messages, code, or filenames
- [ ] No new `.env*` files committed (check `git ls-files | grep env`)

## 7. Third-Party Plugins / Skills

If installing Claude plugins or MCP servers: disable skill shell execution unless you trust the source.

## 8. Incident: Tokens Exposed in Terminal

GitHub PAT was visible in `git remote -v` output during this project's setup. Lessons:
- Use `TOKEN=xxx` shell variables instead of pasting tokens directly into commands
- Revoke + rotate immediately if a token appears in shell history
- Never paste tokens into chat/IDE input fields
