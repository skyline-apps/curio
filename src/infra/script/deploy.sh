#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")/.."

NAMESPACE=$1

if [ -z "$NAMESPACE" ]; then
  echo "Error: Namespace is required"
  exit 1
fi

if [ "$NAMESPACE" != "staging" ] && [ "$NAMESPACE" != "prod" ]; then
  echo "Error: Namespace must be staging or prod"
  exit 1
fi

CONNECTION_COMMAND=$(terraform output -raw connection_string)
eval $CONNECTION_COMMAND

CLUSTER_NAME=$(terraform output -raw cluster_name)
DISK_SIZE=$(terraform output -raw persistent_volume_disk_size_gb)
PROJECT_ID=$(terraform output -raw project_id)
ZONE=$(terraform output -raw zone)
PRIMARY_NODE_LABEL=$(terraform output -raw primary_node_label)

helm upgrade --install search-$NAMESPACE kubernetes/search \
  --namespace $NAMESPACE \
  --create-namespace \
  --set cluster_name=$CLUSTER_NAME \
  --set persistent_volume_disk_size_gb=$DISK_SIZE \
  --set primary_node_label=$PRIMARY_NODE_LABEL \
  --set searchMasterApiKey=$MEILI_MASTER_KEY
