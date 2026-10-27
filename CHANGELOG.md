# Changelog

All notable changes to ezups.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The version lives in `package.json` — one source of truth. A release tag must
match it: `docker-publish.yml` and `release.yml` both fail the run when the tag
and the file disagree (`v2.0.1` ↔ `"version": "2.0.1"`).

## [Unreleased]

## [2.0.1] - 2026-10-27

Uploads returned 500 for eight days. This release is the fix, the hardening that
came out of it, and the CI that ships it.

### Added

- **Corrupt-database failover.** A damaged database is quarantined
  (`ezups.sqlite.corrupt-<timestamp>`, plus its `-wal`/`-shm`) and replaced with a
  fresh one, at boot or on the first query that reports `SQLITE_CORRUPT` /
  `SQLITE_NOTADB`. The damaged bytes are kept for a manual carve; recovery is
  capped at `DB_MAX_RECOVERIES` per process; `DB_AUTO_RECOVER=0` restores
  fail-fast.
- `POST /api/v1/sweep` — retention + orphan sweep, loopback-only, `?dryRun=1` to
  report without deleting. Runs daily at 01:00.
- `tests/` — `http`, `upload-orphan`, `sweep`, `limits`, `db-recovery` (19 tests).
- CI, following the ezllm convention: `test.yml` (reusable gate) feeding
  `docker-publish.yml` (GHCR, `latest` main-only) and `release.yml` (runnable
  bundle + SHA256SUMS on the GitHub Release).

### Fixed

- Uploads 500ing after the SQLite file was corrupted on 2026-10-19: the
  `uploads` b-tree root pointed at pages that did not exist.
- Share links vanishing on `docker compose up -d`: `db/` and `uploads/` lived only
  in the container writable layer and are now on bind mounts.
- `/healthcheck` reporting healthy with a dead database — it now pings SQLite.
- Corrupt databases being masked at boot by a catch-all around the schema
  migration; `PRAGMA quick_check` now runs on start.
- Orphaned upload bytes when the DB insert failed (the file was written before
  the row).
- `bun test` failing on any machine with port 5000 taken; the suite now binds
  an ephemeral port.
- Client lint/build, Docker build and a version/tag mismatch were only discovered
  at deploy time; all three are now part of the test gate.

### Security

- Rate-limit bypass closed: the limiter trusted the first `X-Forwarded-For` hop,
  which is client-controlled, so a forged header gave a fresh bucket per request
  and made the six-character share keys enumerable. The last hop (appended by
  traefik) is used now.
- Oversize uploads are rejected from `Content-Length` **before** the multipart
  body is buffered — previously a huge POST was an OOM before the size check.

### Changed

- The daily 01:00 `DELETE /purge` (which wiped every upload regardless of age) is
  replaced by the retention sweep. `DELETE /api/v1/purge` still exists for a
  manual wipe.
- `PRAGMA synchronous=FULL` and `busy_timeout=5000`, so a hard stop cannot leave
  a half-applied commit and a concurrent write retries instead of 500ing.
- Branch `unstable` renamed `development`; `main` is the production branch.
- `MAX_UPLOAD_SIZE`, `PURGE_MAX_AGE_DAYS`, `DB_AUTO_RECOVER` and friends are
  documented in the README and `.env.example`.

## [2.0.0] - 2026-08-20

### Changed

- Rewritten on Bun + Elysia with `bun:sqlite` — no Express, no multer, uploads
  read straight off the Fetch request.
- New React 19 + Vite UI (dark by default), XHR upload progress, streaming
  download, RFC 5987 filenames, delete-after-download.
- Security: strict CSP, HSTS, `X-Frame-Options`, loopback-only destructive
  routes, per-IP rate limit, no public file listing.

## [1.0.0] - 2022-07-28

### Added

- First tagged release: Express + multer upload/download by key, optional
  password, delete-after-download, daily purge cron, Docker image.
