# Chess Analysis Assistant for Claude

This tool helps you analyze chess positions and get professional evaluations using Stockfish, right within Claude! You can:
- Get position evaluations
- See visual board representations
- Analyze different moves and variations
- Look up positions in the masters database (games played by 2200+ rated players)

## Requirements

- [Claude Desktop](https://claude.ai/desktop) installed on your computer
- Git installed on your system

## Quick Installation (Mac and Linux)

Open Terminal and run this command:
```bash
curl -fsSL https://raw.githubusercontent.com/turlockmike/chess-mcp/master/install.sh | bash
```

That's it! The script will install all necessary dependencies and set up the Chess Assistant for you.

## Manual Installation (Windows or Advanced Users)

If you prefer to install manually or are using Windows, follow these steps:

### Requirements

- [Claude Desktop](https://claude.ai/desktop)
- [Node.js](https://nodejs.org/) version 20 or higher
- [Stockfish](https://stockfishchess.org/) chess engine
- [Cairo](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows) graphics library (for board visualization)

### Step-by-Step Installation

#### Step 1: Install Dependencies

**Mac Users:**
```bash
# Install Homebrew if you haven't already
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required packages
brew install node@20 stockfish cairo pkg-config jq
brew link node@20
```

**Windows Users:**
1. Install [Node.js](https://nodejs.org/) (LTS version)
2. Download [Stockfish](https://stockfishchess.org/download/) and add it to your PATH
3. Install [Cairo](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)

#### Step 2: Set Up the Chess Assistant
1. Clone this repository:
   ```bash
   git clone https://github.com/turlockmike/chess-mcp.git
   cd chess-mcp
   ```
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

#### Step 3: Configure Claude Desktop
1. Open Claude Desktop
2. Navigate to the configuration file:
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`
3. Add this configuration (replace the paths with your actual paths):

For Mac/Linux:
```json
{
    "mcpServers": {
        "chess": {
            "command": "node",
            "args": [
                "/absolute/path/to/chess-mcp/build/index.js"
            ]
        }
    }
}
```

For Windows:
```json
{
    "mcpServers": {
        "chess": {
            "command": "node",
            "args": [
                "C:\\path\\to\\chess-mcp\\build\\index.js"
            ]
        }
    }
}
```

4. Save and restart Claude Desktop

## Using the Chess Assistant

1. Open Claude Desktop
2. Look for the tools icon (🔧) - it should show chess analysis tools
3. Try these example prompts:
   - "Analyze this position: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
   - "Show me the current position"
   - "What's the best move in this position?"
   - "Look up this position in the masters database"
   - "Show me master games from this position after 2000"
   - "What are the most common moves played by masters in this position?"

## Need Help?

If you run into any issues:
1. Make sure all requirements are installed correctly
2. Verify Stockfish is accessible from your command line
3. Check that all paths in your Claude Desktop configuration are correct
4. Restart Claude Desktop after making any changes

## Common Issues

- **"Tools not showing up in Claude"**: Make sure you've built the project (`npm run build`) and configured Claude Desktop correctly
- **"Stockfish not found"**: Verify Stockfish is installed and accessible from the command line
- **"Node version error"**: Make sure you have Node.js version 20 or higher installed
- **"Canvas installation failed"**: Make sure Cairo is installed correctly for your operating system 

## Features

### Position Analysis
- Engine evaluation using Stockfish
- Visual board representation
- Best move suggestions
- Move Validation

### Masters Database
- Search positions in games played by 2200+ rated players
- Filter games by date range
- See win/draw statistics
- View most common moves with success rates
- Browse recent master games with player ratings 