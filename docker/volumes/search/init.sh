#!/bin/sh

if [ "$1" = "staging" ]; then
    . ./.env.staging
    echo "Initializing search at ${SEARCH_EXTERNAL_ENDPOINT_URL}..."
elif [ "$1" = "prod" ]; then
    . ./.env.prod
    echo "Initializing search at ${SEARCH_EXTERNAL_ENDPOINT_URL}..."
elif [ "$1" = "start" ]; then
    # Running inside the search container
    echo "Starting Meilisearch inside the container..."
    /bin/sh -c "/bin/meilisearch --master-key=${SEARCH_MASTER_API_KEY}" &
else
    echo "Unknown environment. Usage: init.sh [staging|prod|start]"
    exit 1
fi

if [ -z "${SEARCH_EXTERNAL_ENDPOINT_URL}" ]; then
    echo "Missing SEARCH_EXTERNAL_ENDPOINT_URL"
    exit 1
fi

if [ -z "${SEARCH_MASTER_API_KEY}" ]; then
    echo "Missing SEARCH_MASTER_API_KEY"
    exit 1
fi

if [ -z "${SEARCH_APPLICATION_KEY_ID}" ]; then
    echo "Missing SEARCH_APPLICATION_KEY_ID"
    exit 1
fi

# Wait for Meilisearch to be ready
until curl -s "${SEARCH_EXTERNAL_ENDPOINT_URL}/health" > /dev/null; do
    echo "Waiting for Meilisearch to be ready at ${SEARCH_EXTERNAL_ENDPOINT_URL}..."
    sleep 1
done

# Create index for items
until curl -s -X POST "${SEARCH_EXTERNAL_ENDPOINT_URL}/indexes" \
    -H "Authorization: Bearer ${SEARCH_MASTER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{ "uid": "items", "primaryKey": "slug"}' > /dev/null; do
    echo "Retrying to create index..."
    sleep 1
done

# Add filterable attributes
until curl -s -X PUT "${SEARCH_EXTERNAL_ENDPOINT_URL}/indexes/items/settings/filterable-attributes" \
    -H "Authorization: Bearer ${SEARCH_MASTER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '["author"]' > /dev/null; do
    echo "Retrying to add filterable attributes..."
    sleep 1
done

echo "Initialized search with index for items"

# Create index for highlights
until curl -s -X POST "${SEARCH_EXTERNAL_ENDPOINT_URL}/indexes" \
    -H "Authorization: Bearer ${SEARCH_MASTER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{ "uid": "highlights", "primaryKey": "id"}' > /dev/null; do
    echo "Retrying to create index..."
    sleep 1
done

# Add filterable attributes
until curl -s -X PUT "${SEARCH_EXTERNAL_ENDPOINT_URL}/indexes/highlights/settings/filterable-attributes" \
    -H "Authorization: Bearer ${SEARCH_MASTER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '["profileId", "profileItemId"]' > /dev/null; do
    echo "Retrying to add filterable attributes..."
    sleep 1
done

echo "Initialized search with index for highlights"

# Create API key
until curl -s -X POST "${SEARCH_EXTERNAL_ENDPOINT_URL}/keys" \
    -H "Authorization: Bearer ${SEARCH_MASTER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"description\": \"Curio API key\", \"actions\": [\"documents.*\", \"indexes.*\", \"search\"], \"indexes\": [\"*\"], \"expiresAt\": null, \"uid\": \"${SEARCH_APPLICATION_KEY_ID}\" }" > /dev/null; do
    echo "Retrying to create API key..."
    sleep 1
done

echo "API key created with ID ${SEARCH_APPLICATION_KEY_ID}."
echo "Retrieve its value using the master API key: curl -v ${SEARCH_EXTERNAL_ENDPOINT_URL}/keys/${SEARCH_APPLICATION_KEY_ID} --header 'Authorization: Bearer \$SEARCH_MASTER_API_KEY'"

# Keep container running
wait $!
