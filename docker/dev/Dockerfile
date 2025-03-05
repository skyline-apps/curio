FROM google/cloud-sdk:alpine

# Install required dependencies
RUN apk add --no-cache curl bash openssh

# Install Terraform
RUN LATEST_TERRAFORM=$(curl -s https://api.github.com/repos/hashicorp/terraform/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/') && \
    curl -O https://releases.hashicorp.com/terraform/${LATEST_TERRAFORM}/terraform_${LATEST_TERRAFORM}_linux_amd64.zip && \
    unzip terraform_${LATEST_TERRAFORM}_linux_amd64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_${LATEST_TERRAFORM}_linux_amd64.zip

# Install kubectl
RUN KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt) && \
    curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Install gke-gcloud-auth-plugin
RUN gcloud components install gke-gcloud-auth-plugin --quiet

# Install Helm
RUN apk add --no-cache openssl && \
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | VERIFY_CHECKSUM=false bash && \
    helm version

# Set environment variables
ENV USE_GKE_GCLOUD_AUTH_PLUGIN=True
ENV KUBECONFIG=/root/.kube/config

# Create .kube directory
RUN mkdir -p /root/.kube

# Set working directory
WORKDIR /workspace

# Verify installations
RUN terraform --version && \
    gcloud --version && \
    kubectl version --client && \
    gke-gcloud-auth-plugin --version && \
    helm version

# Entrypoint script to handle authentication
COPY docker/dev/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

RUN apk add --no-cache jq

RUN apk add --no-cache zsh

RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["tail", "-f", "/dev/null"]