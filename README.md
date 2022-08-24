# EZ-UPS

In the name of God, the merciful, the gracious

## What is it

Simple file uploading and downloading utility tool. Ever tried uploading a file to whatsapp and then logging in to another computer and downloading the file? Or uploading file to google drive and then downloading it from another computer while having to key in 2FA, clicking activation link etc etc? Sucks right? Well, life is hard and don't make it harder. With ezups, you upload a file, get a key, then go to another computer, open ezups again, key in the key and download the file. EZ as EZUPS.

## Getting Started

First, generate your ENV file.

```bash

$ npm run genenv

```

PRO-TIP: genenv will ask for your name. Your name is used to personalize the site.

Second, generate the sqlite database.

```bash

$ npm run gendb

```

Then, run the server.

```bash

$ npm run dev

# or

$ yarn dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running as a Docker Container

I have included a Dockerfile to run the server as a Docker container. If you opt for this, you don't have to generate the database as it is included in the Dockerfile.

```bash

$ npm run genenv

$ docker build . -t ezups

$ docker run -p <desired host port>:3000 --name ezups ezups:latest

```

## Features

1. Security - Authorization and authentication is implemented for API routes.

2. File Upload - Uploads a file to the server and returns a key.

3. File Download - Downloads a file from the server using the key.

4. Autopurge - Automatically deletes files at a 1:00 am everyday.

5. File Metadata - Returns metadata about a file.

6. Delete after download - Option to delete a file after it is downloaded.

## Limitations

I should have build this not using Nextjs, not because Nextjs is not good, but because its API routes can only support < 10MB of transfers. So, no files 10MB and above.

## Other info

MIT License.
Created with Nextjs.
