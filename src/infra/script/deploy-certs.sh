#!/bin/bash

helm repo add jetstack https://charts.jetstack.io

helm repo update

TF_CLUSTER_NAME=$(terraform output -raw cluster_name)

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.17.1 \
  --set crds.enabled=true \
  --set config.apiVersion="controller.config.cert-manager.io/v1alpha1" \
  --set config.kind="ControllerConfiguration" \
  --set config.enableGatewayAPI=true


helm upgrade --install curio-certs kubernetes/certs \
  --set cluster_name=$TF_CLUSTER_NAME