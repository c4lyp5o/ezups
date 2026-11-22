# AGENTS.md

Guidance for AI coding agents working on ezups, one of the ez* self-hosted apps. **ez rules** are shared by every ez repo; **This repo** is specific to ezups. Humans: [DEVELOPER.md](DEVELOPER.md) has the same commands with more context.

<!-- ez-standard:start v1 — shared by every ez repo; edit the copy in the Hermes ez-series skill and re-sync, not this block. -->
## ez rules (shared by every ez repo)

### Ground rules

1. **No commits, pushes, PRs, tags, releases or deploys without the owner's explicit OK.** Patch, test, report.
2. **Never print, log or commit secrets.** No tokens, passwords, keys or webhook URLs in code, fixtures, logs, chat or commit messages. `.env` is never committed and never copied into an image.
3. **Never report a check as passing unless you ran it.** Quote the real output and numbers; a skipped check is not a pass.
4. **Tests never touch real data or real services.** Use temp dirs, throwaway database containers and mocked HTTP. Never point a test at a running instance.
5. **Prove a regression test catches the bug.** Undo the fix, watch the test fail, restore it.

### Branches and releases

- `development` is the integration branch. Branch from it (`feat/…`, `fix/…`, `chore/…`) and open every PR against it.
- `master` is released code. Only `development` merges into it, by PR. There is no `main`, `dev` or `staging`.
- Release (only with the owner's OK): bump every `package.json` version, move `[Unreleased]` in `CHANGELOG.md` under `## [x.y.z] - YYYY-MM-DD`, merge `development` into `master`. Merging to `master` publishes `:<version>`, `:latest` and `:sha-<commit>`; a `vX.Y.Z` tag is optional and adds a GitHub Release.
- CI is two workflows in every repo: `test.yml` (lint, tests, build, image booted and healthy; on PRs) and `publish.yml` (runs `test.yml`, then publishes; byte-identical across repos except `IMAGE`). Pushes to `development` publish `:development` and `:sha-<commit>` only, never `:latest` or a version; run a dev image as a separate container with its own data, not in place of the live one. Optional release files come from `scripts/release-assets.sh`.
- Conventional Commits (`fix(scope): …`) with a body that says why. User-visible changes get a `CHANGELOG.md` line under `[Unreleased]`.

### Stack and style

- **Bun for everything**, never npm or node. The Bun version in `Dockerfile` (`oven/bun:x.y.z`) and every `bun-version:` in `.github/workflows/` must match.
- ESM, tabs, double quotes, semicolons. Minimal, task-scoped diffs; don't reformat files you didn't change. Comments explain why, not what.
- **Docs**: `README.md`, `DEVELOPER.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, plus `LICENSE` (MIT) in public repos; nothing else. No roadmaps, plans or TODO lists in the repo; they live with the owner.
- **Biome is the only linter**, pinned at the repo root: `bun run lint`, `bun run lint:fix`. No ESLint or Prettier. Markdown is not run through Biome.
- **Frontend**: React + Vite + Tailwind 4 in the ez house style (shared `src/ez/` kit and tokens; ezllm is the reference). Colours come from tokens, never raw palette classes. Motion animates transform and opacity only.
- **Brand**: every header, sidebar and sign-in shows `<Brand name="ezname" scope="…" />` (in `src/ez/`): the ez icon at 20px, the lowercase name, an optional scope. App names are always lowercase (`eziarr`, never `Eziarr`), in UI and docs.
- **Icons**: every app uses the shared ez icon from ezconv: `public/icons/icon-192.png` and `icon-512.png`, linked as `rel="icon"` and `rel="apple-touch-icon"` and used in any web manifest.
- **React Compiler** runs through `@rolldown/plugin-babel` with `reactCompilerPreset()`. `@vitejs/plugin-react` 6 has no `babel` option; passing one silently disables the compiler.

### Dependencies

- Lockfiles are committed. CI and Docker install with `--frozen-lockfile`. Don't touch a lockfile unless the dependency change is intentional, and review its diff.
- Prefer releases at least a week old. Take majors one at a time and keep one only if lint, tests and build pass. Read the changelog for removed exports and options; a passing build is not proof (archiver 8 and plugin-react 6 both passed builds while breaking the app).

### Docker

- One Dockerfile shape in every repo (the ez standard): a `build` stage on `oven/bun:x.y.z-alpine` for the frontend, then an Alpine runtime with OCI labels, `--production --frozen-lockfile --ignore-scripts`, `USER bun` (uid 1000) and `HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --start-interval=2s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}<health>"`. Static apps use `nginx-unprivileged` with the same healthcheck.
- No root processes at runtime: no crond or root entrypoints. Schedule recurring jobs inside the app.
- **All state lives under `DATA_DIR`**: `/data` in the image (created, `chown`ed to `bun` and declared `VOLUME ["/data"]`), `<repo>/data` from source (gitignored). The database is `$DATA_DIR/<app>.sqlite`; uploads, hosted files and logs are subfolders (`$DATA_DIR/logs`). One mount per app: `./<app>-data:/data`. Never write to a relative path. When moving state, keep reading the old location until it is moved (`keepLegacy` in `datadir.js`) so an upgrade never starts on an empty database.
- Configuration comes from the environment at runtime (`env_file` in compose). Never `COPY .env`.
- After changing the `Dockerfile`, the Bun version or a dependency, build the image and boot it with throwaway config. Tests don't load every entry point (workers especially).

### Before you say it's done

Run the lint, tests and build listed under **This repo** and report the numbers. For UI changes, also check the page in a real browser at 390px and desktop widths.
<!-- ez-standard:end -->

## This repo

### Commands

Run from the repo root with [Bun](https://bun.sh).

| Task | Command |
| --- | --- |
| Install every package | `bun run install-deps` |
| Run the dev servers | `bun run dev` |
| Run the test suite | `bun run test` |
| Lint with Biome | `bun run lint` |
| Apply Biome's safe fixes | `bun run lint:fix` |
| Build the frontend | `bun run build-client` |
| Start in production (PM2 where configured) | `bun run start` |

### Tests

`bun run test` (`bun test --isolate`; each test file gets a fresh module registry because some tests mock the database module).

### Repo rules

- Tests run with `bun test --isolate`; some files mock `database/sqlite.js` and would leak into others without it.
