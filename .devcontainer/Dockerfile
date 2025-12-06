FROM mcr.microsoft.com/devcontainers/javascript-node:22

# Install Nodemon
RUN npm install -g nodemon

# Install Firebase CLI
RUN npm install -g firebase-tools

# Install gcloud CLI
RUN wget https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz \
    && tar -xf google-cloud-cli-linux-x86_64.tar.gz -C /usr/local/ \
    && /usr/local/google-cloud-sdk/install.sh --quiet \
    && rm google-cloud-cli-linux-x86_64.tar.gz
ENV PATH=$PATH:/usr/local/google-cloud-sdk/bin

# Install Terraform CLI
RUN wget https://releases.hashicorp.com/terraform/1.14.0/terraform_1.14.0_linux_amd64.zip \
    && unzip terraform_1.14.0_linux_amd64.zip \
    && mv terraform /usr/local/bin/ \
    && rm terraform_1.14.0_linux_amd64.zip
