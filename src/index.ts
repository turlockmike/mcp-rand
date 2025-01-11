#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  ListToolsHandler,
  generateUuidHandler,
  generateUuidToolSpec
} from './handlers/index.js';

const server = new Server(
  {
    name: 'mcp-rand',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {
        [generateUuidToolSpec.name]: generateUuidHandler
      }
    }
  }
);

// Register handlers with proper method names
server.setRequestHandler(ListToolsRequestSchema, ListToolsHandler);
server.setRequestHandler(CallToolRequestSchema, generateUuidHandler);

// Connect to stdio transport
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);

console.error('MCP Rand server running on stdio');
