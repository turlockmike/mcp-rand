#!/usr/bin/env node
import { execSync } from 'child_process';
import { platform } from 'os';
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

console.log(`${BLUE}Chess Analysis Assistant Installer${NC}`);
console.log('==============================');

function commandExists(command: string): boolean {
    try {
        execSync(`command -v ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function checkNodeVersion(): boolean {
    try {
        const version = process.version.slice(1); // Remove 'v' prefix
        const majorVersion = parseInt(version.split('.')[0]);
        if (majorVersion >= 20) {
            console.log(`${GREEN}Node.js version ${version} is already installed and meets requirements${NC}`);
            return true;
        } else {
            console.log(`${YELLOW}Warning: Node.js version ${version} is installed but version 20 or higher is required.`);
            console.log(`Please upgrade Node.js manually to version 20 or higher before continuing.${NC}`);
            process.exit(1);
        }
    } catch (error) {
        console.log(`${BLUE}Node.js is not installed, will install version 20${NC}`);
        return false;
    }
}

function installHomebrew() {
    if (!commandExists('brew')) {
        console.log(`${BLUE}Installing Homebrew...${NC}`);
        execSync('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    }
}

function installDependencies() {
    const os = platform();
    
    if (os === 'darwin') {
        console.log(`${GREEN}Detected macOS${NC}`);
        installHomebrew();
        
        console.log(`${BLUE}Installing dependencies...${NC}`);
        if (!commandExists('node')) {
            execSync('brew install node@20');
            execSync('brew link node@20');
        } else {
            checkNodeVersion();
        }
        
        execSync('brew install stockfish cairo pkg-config jq');
    } else if (os === 'linux') {
        console.log(`${GREEN}Detected Linux${NC}`);
        
        console.log(`${BLUE}Installing dependencies...${NC}`);
        execSync('sudo apt-get update');
        execSync('sudo apt-get install -y curl');
        
        if (!commandExists('node')) {
            execSync('curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -');
            execSync('sudo apt-get install -y nodejs');
        } else {
            checkNodeVersion();
        }
        
        execSync('sudo apt-get install -y stockfish libcairo2-dev pkg-config jq');
    } else if (os === 'win32') {
        console.log(`${RED}Windows detected. Please follow the manual installation instructions in the README.${NC}`);
        process.exit(1);
    } else {
        console.log(`${RED}Unsupported operating system${NC}`);
        process.exit(1);
    }
}

function verifyInstallations() {
    console.log(`${BLUE}Verifying installations...${NC}`);
    
    if (!commandExists('node')) {
        console.log(`${RED}Node.js installation failed${NC}`);
        process.exit(1);
    }
    
    if (!commandExists('stockfish')) {
        console.log(`${RED}Stockfish installation failed${NC}`);
        process.exit(1);
    }
}

function configureClaudeDesktop() {
    console.log(`${BLUE}Creating Claude Desktop configuration...${NC}`);
    
    const configDir = join(
        homedir(),
        platform() === 'darwin' 
            ? 'Library/Application Support/Claude'
            : 'AppData/Roaming/Claude'
    );
    
    mkdirSync(configDir, { recursive: true });
    const configFile = join(configDir, 'claude_desktop_config.json');
    
    const chessConfig = {
        command: 'npx',
        args: ['chess-mcp']
    };
    
    let config = { mcpServers: { chess: chessConfig } };
    
    if (existsSync(configFile)) {
        console.log(`${BLUE}Updating existing configuration...${NC}`);
        try {
            const existingConfig = require(configFile);
            config = {
                ...existingConfig,
                mcpServers: {
                    ...existingConfig.mcpServers,
                    chess: chessConfig
                }
            };
        } catch {
            // If reading fails, backup the existing file
            copyFileSync(configFile, `${configFile}.backup`);
            console.log(`${BLUE}Backed up existing configuration to ${configFile}.backup${NC}`);
        }
    }
    
    writeFileSync(configFile, JSON.stringify(config, null, 4));
}

function installChessMcp() {
    console.log(`${BLUE}Installing chess-mcp package globally...${NC}`);
    execSync('npm install -g chess-mcp', { stdio: 'inherit' });
}

async function main() {
    try {
        installDependencies();
        verifyInstallations();
        installChessMcp();
        configureClaudeDesktop();
        
        console.log(`${GREEN}Installation complete!${NC}`);
        console.log(`${BLUE}Please restart Claude Desktop to use the Chess Analysis Assistant.${NC}`);
    } catch (error) {
        console.error(`${RED}Installation failed: ${error}${NC}`);
        process.exit(1);
    }
}

main(); 