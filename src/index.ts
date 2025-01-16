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
  registry.register('tools/list', 'list', ListToolsHandler as Handler);
  registry.register('tools/call', 'generate_uuid', generateUuidHandler as Handler);
  registry.register('tools/call', 'generate_random_number', generateRandomNumberHandler as Handler);
  registry.register('tools/call', 'generate_gaussian', generateGaussianHandler as Handler);
  registry.register('tools/call', 'generate_string', generateStringHandler as Handler);
  registry.register('tools/call', 'generate_password', generatePasswordHandler as Handler);
  registry.register('tools/call', 'roll_dice', rollDiceHandler as Handler);
  registry.register('tools/call', 'draw_cards', drawCardsHandler as Handler);
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
    const handler = registry.get('tools/call', request.params.name);
    if (handler) {
      return handler(request) as Promise<{ content: { type: string; text: string }[] }>;
    }
    throw new Error(`Handler not found for tool: ${request.params.name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP server running on stdio');
}

main().catch(console.error);
