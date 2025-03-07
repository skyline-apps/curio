#!/bin/bash

TF_CLUSTER_NAME=$(terraform output -raw cluster_name)
TF_IP_ADDRESS=$(terraform output -raw address_name)
STAGING_HOSTNAME=$(grep -E "^SEARCH_EXTERNAL_ENDPOINT_URL=" .env.staging | cut -d'=' -f2 | sed 's|^"https://||' | sed 's|"$||')
PROD_HOSTNAME=$(grep -E "^SEARCH_EXTERNAL_ENDPOINT_URL=" .env.prod | cut -d'=' -f2 | sed 's|^"https://||' | sed 's|"$||')

helm repo add jetstack https://charts.jetstack.io

helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.17.1 \
  --set crds.enabled=true \
  --set config.apiVersion="controller.config.cert-manager.io/v1alpha1" \
  --set config.kind="ControllerConfiguration" \
  --set config.enableGatewayAPI=true


helm upgrade --install curio-certs kubernetes/certs \
  --set cluster_name=$TF_CLUSTER_NAME \
  --namespace infra \
  --create-namespace \
  --set staging_hostname=$STAGING_HOSTNAME \
  --set prod_hostname=$PROD_HOSTNAME \
  --set ip_address=$TF_IP_ADDRESS