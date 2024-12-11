#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Generate root CA key and certificate
openssl req -new -x509 -days 365 -nodes \
  -out ${DIR}/server-ca.crt \
  -keyout ${DIR}/server-ca.key \
  -subj "/CN=root-ca"

# Generate server key
openssl genrsa -out ${DIR}/server.key 2048
chmod 600 ${DIR}/server.key

# Generate server certificate signing request
openssl req -new -key ${DIR}/server.key \
  -out ${DIR}/server.csr \
  -subj "/CN=db"

# Generate server certificate
openssl x509 -req -days 365 \
  -in ${DIR}/server.csr \
  -CA ${DIR}/server-ca.crt \
  -CAkey ${DIR}/server-ca.key \
  -CAcreateserial \
  -out ${DIR}/server.crt

# Clean up CSR
rm ${DIR}/server.csr

echo "SSL certificates generated successfully!"
