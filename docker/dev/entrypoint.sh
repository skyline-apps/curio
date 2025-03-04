#!/bin/bash
set -e

# Ensure gcloud and kubectl configurations are set up
if [ -f "/root/.config/gcloud/configurations/config_default" ]; then
    echo "Using existing gcloud configuration"
else
    echo "No gcloud configuration found. Please authenticate first."
fi

# Attempt to get cluster credentials if not already present
if [ ! -f "/root/.kube/config" ]; then
    echo "No kubectl configuration found. Attempting to get cluster credentials..."
    gcloud container clusters get-credentials curio \
        --zone us-central1-c \
        --project plated-planet-452705-n1 \
        --internal-ip || true
fi

# Verify kubectl configuration
kubectl config view || true

# Execute the CMD
exec "$@"
