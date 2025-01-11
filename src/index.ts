#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  ListToolsHandler,
  generateUuidHandler,
  generateUuidToolSpec,
  generateRandomNumberHandler,
  generateRandomNumberToolSpec,
  generateGaussianHandler,
  generateGaussianToolSpec,
  generateStringHandler,
  generateStringToolSpec,
  generatePasswordHandler,
  generatePasswordToolSpec
} from './handlers/index.js';

const server = new Server(
  {
    name: 'mcp-rand',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {
        [generateUuidToolSpec.name]: generateUuidHandler,
        [generateRandomNumberToolSpec.name]: generateRandomNumberHandler,
        [generateGaussianToolSpec.name]: generateGaussianHandler,
        [generateStringToolSpec.name]: generateStringHandler,
        [generatePasswordToolSpec.name]: generatePasswordHandler
      }
    }
  }
);

// Register handlers with proper method names
server.setRequestHandler(ListToolsRequestSchema, ListToolsHandler);
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case generateUuidToolSpec.name:
      return generateUuidHandler(request);
    case generateRandomNumberToolSpec.name:
      return generateRandomNumberHandler(request);
    case generateGaussianToolSpec.name:
      return generateGaussianHandler(request);
    case generateStringToolSpec.name:
      return generateStringHandler(request);
    case generatePasswordToolSpec.name:
      return generatePasswordHandler(request);
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Connect to stdio transport
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);

console.error('MCP Rand server running on stdio');
