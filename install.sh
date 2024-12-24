#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Chess Analysis Assistant Installer${NC}"
echo "=============================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Homebrew if needed
install_homebrew() {
    if ! command_exists brew; then
        echo -e "${BLUE}Installing Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
}

# Check operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}Detected macOS${NC}"
    
    # Install Homebrew if not present
    install_homebrew
    
    # Install dependencies using Homebrew
    echo -e "${BLUE}Installing dependencies...${NC}"
    brew install node@20 stockfish cairo pkg-config jq
    
    # Link node@20
    echo -e "${BLUE}Configuring Node.js...${NC}"
    brew link node@20
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${GREEN}Detected Linux${NC}"
    
    # Install dependencies using apt
    echo -e "${BLUE}Installing dependencies...${NC}"
    sudo apt-get update
    sudo apt-get install -y curl
    
    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install Stockfish and Cairo
    sudo apt-get install -y stockfish libcairo2-dev pkg-config jq
    
elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]]; then
    echo -e "${RED}Windows detected. Please follow the manual installation instructions in the README.${NC}"
    exit 1
else
    echo -e "${RED}Unsupported operating system${NC}"
    exit 1
fi

# Verify installations
echo -e "${BLUE}Verifying installations...${NC}"

if ! command_exists node; then
    echo -e "${RED}Node.js installation failed${NC}"
    exit 1
fi

if ! command_exists stockfish; then
    echo -e "${RED}Stockfish installation failed${NC}"
    exit 1
fi

# Clone the repository
echo -e "${BLUE}Downloading Chess Analysis Assistant...${NC}"
git clone https://github.com/turlockmike/chess-mcp.git
cd chess-mcp

# Install npm dependencies and build
echo -e "${BLUE}Installing project dependencies...${NC}"
npm install
npm run build

# Create Claude Desktop configuration
echo -e "${BLUE}Creating Claude Desktop configuration...${NC}"
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
mkdir -p "$CLAUDE_CONFIG_DIR"

CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
CURRENT_DIR=$(pwd)

# Prepare the chess server configuration
CHESS_CONFIG="{
    \"command\": \"node\",
    \"args\": [
        \"${CURRENT_DIR}/build/index.js\"
    ]
}"

# Update or create configuration file
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${BLUE}Updating existing configuration...${NC}"
    if command_exists jq; then
        # If jq is available, use it to properly merge JSON
        TEMP_CONFIG=$(mktemp)
        jq --arg chess "$CHESS_CONFIG" '.mcpServers.chess = ($chess | fromjson)' "$CONFIG_FILE" > "$TEMP_CONFIG"
        mv "$TEMP_CONFIG" "$CONFIG_FILE"
    else
        # Backup existing config
        cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"
        echo -e "${BLUE}Backed up existing configuration to ${CONFIG_FILE}.backup${NC}"
        
        # Create new config with chess server
        echo "{
    \"mcpServers\": {
        \"chess\": $CHESS_CONFIG
    }
}" > "$CONFIG_FILE"
    fi
else
    # Create new config file
    echo "{
    \"mcpServers\": {
        \"chess\": $CHESS_CONFIG
    }
}" > "$CONFIG_FILE"
fi

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${BLUE}Please restart Claude Desktop to use the Chess Analysis Assistant.${NC}" 