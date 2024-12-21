#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { ChessEngine } from './chess-engine.js';

interface CustomMcpError extends Error {
  code?: string;
}

interface CallToolRequest {
  params: {
    name: string;
    _meta?: object;
    arguments?: Record<string, unknown>;
  };
  method: string;
}

export class ChessServer {
  private server: Server;
  private engine: ChessEngine;

  constructor() {
    this.server = new Server(
      {
        name: 'chess-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.engine = new ChessEngine();
    this.setupServer();
    
    // Error handling
    this.server.onerror = (error: CustomMcpError) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.close();
      process.exit(0);
    });
  }

  private setupServer() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'evaluate_chess_position',
          description: 'Evaluate a chess position using Stockfish engine',
          inputSchema: {
            type: 'object',
            properties: {
              fen: {
                type: 'string',
                description: 'Chess position in FEN notation',
              },
              depth: {
                type: 'number',
                description: 'Search depth (1-20)',
                minimum: 1,
                maximum: 20,
              },
            },
            required: ['fen'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      if (request.params.name !== 'evaluate_chess_position') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const { fen, depth = 15 } = request.params.arguments as { fen: string; depth?: number };

      try {
        const evaluation = await this.engine.evaluatePosition(fen, depth);
        let text: string;

        if (evaluation.isMate) {
          text = `Mate in ${evaluation.moveNumber} moves for ${evaluation.score > 0 ? 'white' : 'black'}`;
        } else {
          text = `Evaluation: ${evaluation.score} pawns`;
        }

        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(transport?: Transport) {
    await this.engine.init();
    const serverTransport = transport || new StdioServerTransport();
    await this.server.connect(serverTransport);
    if (!transport) {
      console.error('Chess MCP server running on stdio');
    }
  }

  async close() {
    await this.engine.quit();
    await this.server.close();
  }
}

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ChessServer();
  server.run().catch(console.error);
}
