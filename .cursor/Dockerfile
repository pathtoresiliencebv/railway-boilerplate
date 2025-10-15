# Use Node.js 22 as base image (matches project requirements)
FROM node:22-bullseye-slim

# Install system dependencies for development
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    python3 \
    python3-pip \
    postgresql-client \
    redis-tools \
    vim \
    nano \
    htop \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for development
RUN useradd -m -s /bin/bash ubuntu && \
    usermod -aG sudo ubuntu

# Set user and working directory
USER ubuntu
WORKDIR /home/ubuntu

# Install pnpm globally (matches project package manager)
RUN npm install -g pnpm@9.10.0

# Install global development tools
RUN pnpm add -g \
    typescript \
    @medusajs/cli \
    medusajs-launch-utils

# Set up shell environment
RUN echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && \
    echo 'export NODE_ENV=development' >> ~/.bashrc

# Create common development directories
RUN mkdir -p /home/ubuntu/workspace && \
    mkdir -p /home/ubuntu/.config

# Set default shell
SHELL ["/bin/bash", "-c"]

# Expose common development ports
EXPOSE 3000 9000 3002

# Set working directory for cloned code
WORKDIR /home/ubuntu/workspace

# Default command (will be overridden by Cursor)
CMD ["/bin/bash"]
