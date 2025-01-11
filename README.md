# MCP Rand

[![npm version](https://badge.fury.io/js/mcp-rand.svg)](https://www.npmjs.com/package/mcp-rand)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A Model Context Protocol (MCP) server providing random number generation utilities, starting with a UUID generator.

## Installation

```bash
npm install mcp-rand
```

Or install globally:

```bash
npm install -g mcp-rand
```

## Features

### UUID Generator
- Generates RFC 4122 version 4 UUIDs
- Uses Node's native crypto module for secure random generation
- Simple interface with no required parameters

## Usage

### As a CLI Tool

```bash
npx mcp-rand
```

### Integration with MCP Clients

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "mcp-rand": {
      "command": "node",
      "args": ["path/to/mcp-rand/build/index.js"],
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

### Example Usage

Using the UUID generator:

```typescript
// MCP client request
const result = await client.callTool('generate_uuid', {});
console.log(result); // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Start the server
npm start
```

## License

ISC