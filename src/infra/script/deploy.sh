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

# Read env values from the namespace
set -a
. .env.$NAMESPACE
set +a

CONNECTION_COMMAND=$(terraform output -raw connection_string)
eval $CONNECTION_COMMAND

TF_CLUSTER_NAME=$(terraform output -raw cluster_name)
TF_DISK_SIZE=$(terraform output -raw persistent_volume_disk_size_gb)
TF_PROJECT_ID=$(terraform output -raw project_id)
TF_ZONE=$(terraform output -raw zone)
TF_PRIMARY_NODE_LABEL=$(terraform output -raw primary_node_label)
TF_ADDRESS_NAME=$(terraform output -raw address_name)

HOSTNAME=${SEARCH_EXTERNAL_ENDPOINT_URL#https://}

kubectl create namespace $NAMESPACE
kubectl label namespace $NAMESPACE namespace=$NAMESPACE

helm upgrade --install search-$NAMESPACE kubernetes/search \
  --namespace $NAMESPACE \
  --set cluster_name=$TF_CLUSTER_NAME \
  --set persistent_volume_disk_size_gb=$TF_DISK_SIZE \
  --set primary_node_label=$TF_PRIMARY_NODE_LABEL \
  --set ip_address=$TF_ADDRESS_NAME \
  --set searchMasterApiKey=$SEARCH_MASTER_API_KEY \
  --set hostname=$HOSTNAME