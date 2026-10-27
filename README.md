# EZ-UPS

**v2.0.1** · [changelog](CHANGELOG.md)

In the name of Allah, the most merciful, the most gracious

## What is it

Simple file uploading and downloading utility tool. Ever tried uploading a file to whatsapp and then logging in to another computer and downloading the file? Or uploading file to google drive and then downloading it from another computer while having to key in 2FA, clicking activation link etc etc? Sucks right? Well, life is hard and don't make it harder. With ezups, you upload a file, get the key, then go to another computer, open ezups again, key in the key and download the file. EZ as EZUPS.

## Getting Started

1. **Install dependencies:**

```bash
bun run install-deps
```

4. **Run the server:**

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running as a Docker Container

A Dockerfile is included. The database is created automatically on first run.
**Keep `/app/db` and `/app/uploads` on volumes** — they are the only copy of the
database and of every uploaded file, so recreating the container without them
loses every share link.

```bash
docker build . -t ezups
docker run -d -p <desired host port>:5000 --name ezups \
  -v "$PWD/ezups-data/db:/app/db" \
  -v "$PWD/ezups-data/uploads:/app/uploads" \
  -e PURGE_MAX_AGE_DAYS=7 \
  ezups:latest
```

A container-level cron runs the retention sweep daily at 01:00 (container time).
`GET /api/v1/healthcheck` pings SQLite, so a corrupt or unwritable database
reports the container as unhealthy instead of silently 500ing every upload.

### Corrupt database failover

If the database is damaged — at boot, or on the first query that hits
`SQLITE_CORRUPT`/`SQLITE_NOTADB` while running — the file (plus its `-wal`/`-shm`)
is renamed to `ezups.sqlite.corrupt-<timestamp>`, an empty database is created,
and the service keeps serving. The damaged bytes are deliberately kept: they are
the only copy of the old rows, and they can be carved by hand (see
`db-recovery` in the log for the path). Recovery is capped at
`DB_MAX_RECOVERIES` per process so a failing disk cannot loop, and
`DB_AUTO_RECOVER=0` restores fail-fast behaviour (the process exits instead).

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | HTTP port |
| `DB_PATH` | `./db/ezups.sqlite` | SQLite file (WAL) |
| `UPLOADS_DIR` | `./uploads` | Uploaded files |
| `PURGE_MAX_AGE_DAYS` | `7` | Daily sweep deletes uploads older than this. `0` = keep forever |
| `MAX_UPLOAD_SIZE` | `104857600` | Per-file cap in bytes (100MB) |
| `LOG_DIR` | `./logs` | Directory for `ezups.log` |
| `DB_AUTO_RECOVER` | `1` | `0` = exit on a corrupt DB instead of quarantining it and creating a fresh one |
| `DB_MAX_RECOVERIES` | `3` | Recoveries per process before giving up |
| `DB_KEEP_QUARANTINES` | `3` | Quarantined `*.corrupt-*` files kept on disk |

## Features

1. **File Upload** - Upload files up to 100MB. Get a key for each upload.
2. **File Download** - Download files using the key. Optional password protection.
3. **Delete After Download** - Option to delete a file after it is downloaded once.
4. **Retention sweep** - Once a day, uploads older than `PURGE_MAX_AGE_DAYS` are deleted, along with any file no database row points at. `POST /api/v1/sweep?dryRun=1` reports without deleting.
5. **File Metadata** - Returns metadata about a file (not exposed in UI by default).
6. **Security** - Loopback-only purge/sweep/healthcheck, per-IP rate limit, no public file listing.

## Limitations

- Maximum file size: **100MB** per upload (enforced client and server side).
- No user accounts or permanent storage. Files are temporary.
- No file previews. Download only.

## Tech Stack

- **Backend:** Bun, Elysia, SQLite (bun:sqlite), native `request.formData()` uploads (no multer)
- **Frontend:** React (Vite), Tailwind CSS
- **Other:** Docker support, daily purge script

## License

MIT License.

---

Created with Bun, React, and love.
