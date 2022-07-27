#!/bin/ash

curl --location --request POST 'http://localhost:3000/api/purge' \
--header 'Content-Type: application/json' \
--data-raw '{
    "API_KEY": "<paste your api key here>"
}'