curl --location --request POST 'http://localhost:3000/api/cronjob' \
--header 'Content-Type: application/json' \
--data-raw '{
    "API_KEY": "<insert you hashed api key here>"
}'