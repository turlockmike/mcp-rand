# MCP Tools

A Model Context Protocol (MCP) server providing utility tools, currently featuring a UUID generator.

## Features

### UUID Generator
- Generates RFC 4122 version 4 UUIDs
- Uses Node's native crypto module for secure random generation
- Simple interface with no required parameters

## Installation

```bash
npm install mcp-tools
```

## Usage

### As a CLI Tool

```bash
npx mcp-tools
```

### Integration with MCP Clients

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "mcp-tools": {
      "command": "node",
      "args": ["path/to/mcp-tools/build/index.js"],
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