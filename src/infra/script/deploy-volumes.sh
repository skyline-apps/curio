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

TF_CLUSTER_NAME=$(terraform output -raw cluster_name)
TF_DISK_SIZE=$(terraform output -raw persistent_volume_disk_size_gb)
TF_PROJECT_ID=$(terraform output -raw project_id)
TF_ZONE=$(terraform output -raw zone)
TF_PRIMARY_NODE_LABEL=$(terraform output -raw primary_node_label)

helm upgrade --install persistent-volumes-$NAMESPACE kubernetes/persistent-volumes \
  --namespace $NAMESPACE \
  --create-namespace \
  --set cluster_name=$TF_CLUSTER_NAME \
  --set persistent_volume_disk_size_gb=$TF_DISK_SIZE \
  --set volume_handle=projects/${TF_PROJECT_ID}/zones/${TF_ZONE}/disks/${TF_CLUSTER_NAME}-${NAMESPACE}-pv \
  --set primary_node_label=$TF_PRIMARY_NODE_LABEL
