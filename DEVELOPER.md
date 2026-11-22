# Developing ezups

Bun + SQLite server at the root, React + Vite client in `client/`.

## Commands

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

## Tests

`bun run test` (`bun test --isolate`; each test file gets a fresh module registry because some tests mock the database module).

## Linting

[Biome](https://biomejs.dev) 2.6.8 is the only linter. It is pinned at the repo root, so run it from there: `bun run lint` checks, `bun run lint:fix` applies safe fixes. Configuration is `biome.json`; the formatter is off in the root config, so untouched files are never reformatted. CI runs the same command.

## Branches and releases

There are two long-lived branches:

| Branch | Role |
| --- | --- |
| `development` | Integration branch. Branch from it (`feat/…`, `fix/…`, `chore/…`) and open every PR against it. |
| `master` | Released code. Only `development` is merged into it, by PR. |

No other long-lived branches (`main`, `dev`, `staging`, …) are kept; delete feature branches once merged.

To release: bump the version in `package.json` and `client/package.json`, move the `[Unreleased]` notes in `CHANGELOG.md` under `## [x.y.z] - YYYY-MM-DD`, then merge `development` into `master`. Every push to `master` runs `publish.yml`: `test.yml` first, then `ghcr.io/c4lyp5o/ezups:<version>`, `:latest` and `:sha-<commit>`. Tagging `vX.Y.Z` afterwards is optional: it checks the tag matches `package.json`, pushes `:<version>` and creates a GitHub Release from that version's changelog section, with the files from `scripts/release-assets.sh` attached. Every push to `development` publishes `ghcr.io/c4lyp5o/ezups:development` and `:sha-<commit>` after the tests, for trying unreleased changes in a separate container; it never touches `:latest` or a version tag.

Commits follow [Conventional Commits](https://www.conventionalcommits.org) (`fix(scope): …`) with a body that explains why. Add a `CHANGELOG.md` line under `[Unreleased]` for anything a user would notice. Every behaviour change needs a test; a bug fix needs one that fails without the fix.

## Docker

The image follows the ez standard Dockerfile: a Bun stage builds the frontend, then `oven/bun:1.4.5-alpine` runs the app as `bun` (uid 1000) with a `HEALTHCHECK` on `/api/v1/healthcheck`. Keep the Bun version in step with `bun-version` in `.github/workflows/`. `test.yml` builds the image, boots it and waits for healthy; do the same locally (`docker build -t ezups .`, then `docker run`) after changing the Dockerfile.
