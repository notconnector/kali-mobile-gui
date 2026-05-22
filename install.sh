#!/bin/bash

# Kali Remote GUI Bridge - Installation Script
# ===========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_error "Run as a regular user. The script will use sudo when needed."
        exit 1
    fi
}

# Check if on Kali Linux
check_kali() {
    if ! grep -q "Kali" /etc/os-release 2>/dev/null; then
        print_warning "This script is optimized for Kali Linux."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Install Python dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."
    
    # Update package list
    sudo apt update
    
    # Install Python and pip if not present
    if ! command -v python3 &> /dev/null; then
        print_status "Installing Python 3..."
        sudo apt install -y python3 python3-pip python3-venv
    fi
    
    # Install required Python packages
    print_status "Installing required Python packages..."
    pip3 install --user websockets PyJWT cryptography python-dateutil
    
    # Install optional pentesting tools
    print_status "Installing recommended pentesting tools..."
    sudo apt install -y nmap curl wget nikto gobuster sqlmap netcat tcpdump \
                        hydra john hashcat aircrack-ng metasploit-framework
    
    print_success "Dependencies installed successfully"
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    # Generate secure random token
    AUTH_TOKEN=$(openssl rand -hex 32)
    
    # Create .env file
    cat > .env << EOF
# Kali Remote GUI Bridge Configuration
# =====================================

# Security (REQUIRED)
KALI_BRIDGE_AUTH_TOKEN=${AUTH_TOKEN}

# Network (recommended defaults)
KALI_BRIDGE_HOST=127.0.0.1
KALI_BRIDGE_PORT=8765

# Security settings
KALI_BRIDGE_RATE_LIMIT=30
KALI_BRIDGE_MAX_PAYLOAD=1048576
KALI_BRIDGE_LOG_LEVEL=INFO

# Shell limits
KALI_BRIDGE_MAX_SHELLS_PER_CLIENT=3
KALI_BRIDGE_SHELL_INACTIVE_TIMEOUT=3600
EOF

    chmod 600 .env
    print_success "Environment file created (.env)"
    print_status "Your AUTH_TOKEN is: ${AUTH_TOKEN}"
    print_warning "Save this token securely!"
}

# Create systemd service (optional)
create_systemd_service() {
    read -p "Install systemd service for auto-start? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Creating systemd service..."
        
        # Get current user and dynamic paths
        USER=$(whoami)
        CURRENT_DIR=$(pwd)
        BRIDGE_PATH="${CURRENT_DIR}/kali-bridge.py"
        ENV_PATH="${CURRENT_DIR}/.env"
        
        # Create systemd service file
        sudo tee /etc/systemd/system/kali-bridge.service > /dev/null << EOF
[Unit]
Description=Kali Remote GUI Bridge
After=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${HOME_DIR}/kali-remote-gui
EnvironmentFile=${ENV_PATH}
ExecStart=/usr/bin/python3 ${BRIDGE_PATH}
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${CURRENT_DIR}

[Install]
WantedBy=multi-user.target
EOF

        # Reload systemd and enable service
        sudo systemctl daemon-reload
        sudo systemctl enable kali-bridge
        
        print_success "Systemd service created and enabled"
        print_status "Start with: sudo systemctl start kali-bridge"
        print_status "Check status: sudo systemctl status kali-bridge"
        print_status "View logs: sudo journalctl -u kali-bridge -f"
    fi
}

# Create launcher script
create_launcher() {
    print_status "Creating launcher script..."
    
    cat > kali-bridge-launcher.sh << 'EOF'
#!/bin/bash

# Kali Remote GUI Bridge Launcher
# ===============================

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load environment variables
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "Error: .env file not found in $SCRIPT_DIR"
    echo "Please run install.sh first"
    exit 1
fi

# Start the bridge
echo "Starting Kali Remote GUI Bridge..."
echo "Host: $KALI_BRIDGE_HOST"
echo "Port: $KALI_BRIDGE_PORT"
echo "Rate Limit: $KALI_BRIDGE_RATE_LIMIT commands/min"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$SCRIPT_DIR"
python3 kali-bridge.py
EOF

    chmod +x kali-bridge-launcher.sh
    print_success "Launcher script created (kali-bridge-launcher.sh)"
}

# Test installation
test_installation() {
    print_status "Testing installation..."
    
    # Check if bridge script exists
    if [[ ! -f "kali-bridge.py" ]]; then
        print_error "kali-bridge.py not found in current directory"
        exit 1
    fi
    
    # Check if Python dependencies are available
    if ! python3 -c "import websockets, jwt" 2>/dev/null; then
        print_error "Python dependencies not properly installed"
        exit 1
    fi
    
    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        print_error ".env file not found"
        exit 1
    fi
    
    print_success "Installation test passed"
}

# Check if running from correct directory
check_directory() {
    # Check if we're in kali-remote-gui directory
    if [[ ! -f "kali-bridge.py" ]]; then
        print_error "kali-bridge.py not found in current directory"
        print_error "Please run this script from the kali-remote-gui repository root"
        print_error "Example: cd ~/kali-remote-gui && ./install.sh"
        exit 1
    fi
    
    # Check if directory name contains kali-remote-gui
    CURRENT_DIR=$(basename "$(pwd)")
    if [[ "$CURRENT_DIR" != *"kali-remote-gui"* ]]; then
        print_warning "Not running from kali-remote-gui directory"
        print_warning "Current directory: $CURRENT_DIR"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Main installation flow
main() {
    echo "=========================================="
    echo "  Kali Remote GUI Bridge Installer"
    echo "=========================================="
    echo ""
    
    check_directory
    check_root
    check_kali
    
    print_status "Starting installation..."
    
    install_dependencies
    create_env_file
    create_systemd_service
    create_launcher
    test_installation
    
    # Display and save AUTH_TOKEN
    AUTH_TOKEN=$(grep KALI_BRIDGE_AUTH_TOKEN .env | cut -d'=' -f2)
    echo ""
    echo "=========================================="
    print_success "Installation completed successfully!"
    echo "=========================================="
    echo ""
    echo "🔑 Your AUTH_TOKEN (save this securely):"
    echo ""
    echo -e "${GREEN}${AUTH_TOKEN}${NC}"
    echo ""
    
    # Save token to file for easy access
    echo "${AUTH_TOKEN}" > AUTH_TOKEN.txt
    chmod 600 AUTH_TOKEN.txt
    print_status "AUTH_TOKEN saved to AUTH_TOKEN.txt (chmod 600)"
    
    echo ""
    echo "Next steps:"
    echo "1. Start the bridge:"
    echo "   ./kali-bridge-launcher.sh"
    echo "   or: sudo systemctl start kali-bridge (if systemd enabled)"
    echo ""
    echo "2. Configure your app with:"
    echo "   Host: 127.0.0.1"
    echo "   Port: 8765"
    echo "   Auth Token: ${AUTH_TOKEN}"
    echo ""
    echo "3. For security, consider:"
    echo "   - Using SSH tunnel: ssh -L 8765:127.0.0.1:8765 user@kali-host"
    echo "   - Setting up Tailscale VPN"
    echo "   - Reviewing logs regularly"
    echo ""
    print_warning "Keep your AUTH_TOKEN secure and never share it!"
}

# Run main function
main "$@"
