FROM google/cloud-sdk:latest

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    jq \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Install Terraform
RUN LATEST_TERRAFORM=$(curl -s https://api.github.com/repos/hashicorp/terraform/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/') && \
    curl -O https://releases.hashicorp.com/terraform/${LATEST_TERRAFORM}/terraform_${LATEST_TERRAFORM}_linux_amd64.zip && \
    unzip terraform_${LATEST_TERRAFORM}_linux_amd64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_${LATEST_TERRAFORM}_linux_amd64.zip

# Install kubectl
RUN apt-get install -y kubectl

# Install gke-gcloud-auth-plugin
RUN apt-get install -y google-cloud-cli-gke-gcloud-auth-plugin

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Set environment variables
ENV USE_GKE_GCLOUD_AUTH_PLUGIN=True
ENV KUBECONFIG=/root/.kube/config
ENV AWS_CONFIG_FILE=/root/.aws/config

# Create .kube directory
RUN mkdir -p /root/.kube

# Set working directory
WORKDIR /workspace

# Verify installations
RUN terraform --version && \
    gcloud --version && \
    kubectl version --client && \
    gke-gcloud-auth-plugin --version && \
    aws --version && \
    helm version

# Entrypoint script to handle authentication
COPY docker/dev/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Install Oh My Zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Set Zsh as default shell
RUN chsh -s $(which zsh)

ENTRYPOINT ["/entrypoint.sh"]
CMD ["tail", "-f", "/dev/null"]