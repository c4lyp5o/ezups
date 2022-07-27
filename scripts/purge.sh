#!/bin/ash

curl --location --request POST 'http://localhost:3000/api/purge' \
--header 'Content-Type: application/json' \
--data-raw '{
    "API_KEY": "ded80dbe3ce7cc38bf72a85835661d7e489f51b22d7447e4bb2019931fc9e93dHrS+2iSbdXXuJbb59NJ69O2F/gulYdvulEznRN5jR/o=767d3b11e5d53e291431136ea809e3ac23f9b55d43e4bdc8b4f795032cd15244"
}'