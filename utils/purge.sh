#!/bin/sh

# Daily retention sweep: rows + files older than PURGE_MAX_AGE_DAYS, plus files
# with no DB row. To wipe everything on demand use DELETE /api/v1/purge.
curl --location --request POST 'http://localhost:5000/api/v1/sweep'