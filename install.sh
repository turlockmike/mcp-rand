#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Chess Analysis Assistant Installer${NC}"
echo "=============================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        local version=$(node -v | cut -d'v' -f2)
        local major_version=$(echo $version | cut -d'.' -f1)
        if [ "$major_version" -ge 20 ]; then
            echo -e "${GREEN}Node.js version $version is already installed and meets requirements${NC}"
            return 0
        else
            echo -e "${YELLOW}Warning: Node.js version $version is installed but version 20 or higher is required."
            echo -e "Please upgrade Node.js manually to version 20 or higher before continuing.${NC}"
            exit 1
        fi
    else
        echo -e "${BLUE}Node.js is not installed, will install version 20${NC}"
        return 1
    fi
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
    
    # Only install Node.js if it's not present at all
    if ! command_exists node; then
        brew install node@20
        brew link node@20
    else
        check_node_version
    fi
    
    # Install other dependencies
    brew install stockfish cairo pkg-config jq
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${GREEN}Detected Linux${NC}"
    
    # Install dependencies using apt
    echo -e "${BLUE}Installing dependencies...${NC}"
    sudo apt-get update
    sudo apt-get install -y curl
    
    # Only install Node.js if it's not present at all
    if ! command_exists node; then
        # Install Node.js 20
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        check_node_version
    fi
    
    # Install other dependencies
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

# Create Claude Desktop configuration
echo -e "${BLUE}Creating Claude Desktop configuration...${NC}"
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
mkdir -p "$CLAUDE_CONFIG_DIR"

CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# Prepare the chess server configuration
CHESS_CONFIG="{
    \"command\": \"npx\",
    \"args\": [
        \"chess-mcp\"
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

# Install the chess-mcp package globally
echo -e "${BLUE}Installing chess-mcp package...${NC}"
npm install -g chess-mcp

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${BLUE}Please restart Claude Desktop to use the Chess Analysis Assistant.${NC}" 