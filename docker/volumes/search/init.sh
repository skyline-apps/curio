#!/bin/sh
MEILI_URL="http://localhost:7700"

# Start Meilisearch
/bin/sh -c '/bin/meilisearch --master-key=${MEILI_MASTER_KEY}' &

# Wait for Meilisearch to be ready
until curl -s "${MEILI_URL}/health" > /dev/null; do
    echo "Waiting for Meilisearch to be ready..."
    sleep 1
done

# Create index
until curl -s -X POST "${MEILI_URL}/indexes" \
    -H "Authorization: Bearer ${MEILI_MASTER_KEY}" \
    -H "Content-Type: application/json" \
    -d '{ "uid": "items", "primaryKey": "slug"}' > /dev/null; do
    echo "Retrying to create index..."
    sleep 1
done

# Add filterable attributes
until curl -s -X PUT "${MEILI_URL}/indexes/items/settings/filterable-attributes" \
    -H "Authorization: Bearer ${MEILI_MASTER_KEY}" \
    -H "Content-Type: application/json" \
    -d '["author"]' > /dev/null; do
    echo "Retrying to add filterable attributes..."
    sleep 1
done

# Create API key
until curl -s -X POST "${MEILI_URL}/keys" \
    -H "Authorization: Bearer ${MEILI_MASTER_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"description": "Curio API key", "actions": ["documents.*", "indexes.*", "search"], "indexes": ["*"], "expiresAt": null, "uid": "9adc8f03-bfcd-4b0b-a943-df0b067fe626" }' > /dev/null; do
    echo "Retrying to create API key..."
    sleep 1
done

echo "Initialized search with index for items"

# Keep container running
wait $!