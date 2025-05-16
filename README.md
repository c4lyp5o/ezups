# EZ-UPS

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

A Dockerfile is included. The database is created automatically in the container.

```bash
docker build . -t ezups
docker run -p <desired host port>:3000 --name ezups ezups:latest
```

## Features

1. **File Upload** - Upload files up to 100MB. Get a key for each upload.
2. **File Download** - Download files using the key. Optional password protection.
3. **Delete After Download** - Option to delete a file after it is downloaded once.
4. **Autopurge** - Files are automatically deleted every day at 1:00 am.
5. **File Metadata** - Returns metadata about a file (not exposed in UI by default).
6. **Security** - API routes are protected. No public file listing.

## Limitations

- Maximum file size: **100MB** per upload (enforced client and server side).
- No user accounts or permanent storage. Files are temporary.
- No file previews. Download only.

## Tech Stack

- **Backend:** Bun, Express-style routing, SQLite, Multer for file uploads
- **Frontend:** React (Vite), Tailwind CSS
- **Other:** Docker support, daily purge script

## License

MIT License.

---

Created with Bun, React, and love.
