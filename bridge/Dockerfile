FROM python:3.11-slim

LABEL maintainer="Kali Remote GUI Contributors"
LABEL description="Secure WebSocket bridge for Kali Remote GUI"

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssh-client \
    nmap \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir websockets

# Create non-root user
RUN groupadd -r kalibridge && useradd -r -g kalibridge kalibridge

# Create app directory
WORKDIR /app

# Copy bridge script
COPY kali-bridge.py /app/

# Create logs directory
RUN mkdir -p /var/log/bridge && chown kalibridge:kalibridge /var/log/bridge

# Switch to non-root user
USER kalibridge

# Expose WebSocket port
EXPOSE 8765

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python3 -c "import socket; s=socket.socket(); s.connect(('127.0.0.1', 8766)); s.close()" || exit 1

# Environment defaults (can be overridden)
ENV KALI_BRIDGE_HOST=0.0.0.0
ENV KALI_BRIDGE_PORT=8765
ENV KALI_BRIDGE_RATE_LIMIT=30
ENV KALI_BRIDGE_LOG_LEVEL=INFO
ENV KALI_BRIDGE_MAX_PAYLOAD=1048576

# Run bridge
CMD ["python3", "kali-bridge.py"]
