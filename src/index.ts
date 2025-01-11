#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Handler, HandlerRegistry, SimpleHandlerRegistry } from './handlers/types.js';
import {
  ListToolsHandler,
  generateUuidHandler,
  generateRandomNumberHandler,
  generateGaussianHandler,
  generateStringHandler,
  generatePasswordHandler,
  rollDiceHandler,
  drawCardsHandler
} from './handlers/index.js';

async function registerHandlers(registry: HandlerRegistry): Promise<void> {
  registry.register('tools/list', ListToolsHandler as Handler);
  registry.register('tools/call', generateUuidHandler as Handler);
  registry.register('tools/call', generateRandomNumberHandler as Handler);
  registry.register('tools/call', generateGaussianHandler as Handler);
  registry.register('tools/call', generateStringHandler as Handler);
  registry.register('tools/call', generatePasswordHandler as Handler);
  registry.register('tools/call', rollDiceHandler as Handler);
  registry.register('tools/call', drawCardsHandler as Handler);
}

async function main() {
  const registry = new SimpleHandlerRegistry();
  await registerHandlers(registry);

  const server = new Server(
    {
      name: 'mcp-rand',
      version: '0.1.2',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, (request) => {
    const handler = registry.get('tools/list');
    if (handler) {
      return handler(request) as Promise<{ tools: unknown[] }>;
    }
    throw new Error('Handler not found');
  });

  server.setRequestHandler(CallToolRequestSchema, (request) => {
    const handler = registry.get('tools/call');
    if (handler) {
      return handler(request) as Promise<{ content: { type: string; text: string }[] }>;
    }
    throw new Error('Handler not found');
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP server running on stdio');
}

main().catch(console.error);
