# EZ-UPS

In the name of God, the merciful, the gracious

## What is it

Simple file uploading and downloading utility tool. Ever tried uploading a file to whatsapp and then logging in to another computer and downloading the file? Or uploading file to google drive and then downloading it from another computer while having to key in 2FA, clicking activation link etc etc? Sucks right? Well, life is hard and don't make it harder. WIth ezups, you upload a file, get a key, then go to another computer, open ezups again, key in the key and download the file. EZ as EZUPS.

## Getting Started

First, run the development server:

```bash

npm run dev

# or

yarn dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Requirements

EZUPS is using Postgresql as its database. Im thinking of using SQLite in the future to reduce dependancy. Other than that its just npm install and npm run dev. Or you could npm run build and npm start.

## Features

1. Security - Authorization and authentication is implemented for API routes.

2. File Upload - Uploads a file to the server and returns a key.

3. File Download - Downloads a file from the server using the key.

4. Autopurge - Automatically deletes files older than 24 hours.

5. File Metadata - Returns metadata about a file.

## Limitations

I should have build this not using Nextjs no because Nextjs is not good, but because its API routes can only support < 10MB of transfers. So, no files 10MB and above. Im still working on deletion after download so it may take a while.

## Other info

MIT License
Created with Nextjs.
