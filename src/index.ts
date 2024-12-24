#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  ImageContent
} from '@modelcontextprotocol/sdk/types.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { ChessEngine } from './chess-engine.js';
import { ChessImageService } from './chess-image-service.js';

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
  private imageService: ChessImageService;
  private isConnected: boolean = false;

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

    this.engine = new ChessEngine('/opt/homebrew/bin/stockfish');
    this.imageService = new ChessImageService();
    this.setupServer();
    
    this.server.onerror = (error: CustomMcpError) => {
      console.error(`Server error: ${error.message}`, { code: error.code, stack: error.stack });
    };

    process.on('SIGINT', async () => {
      await this.close();
      process.exit(0);
    });
  }

  private setupServer() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
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
          {
            name: 'generate_chess_position_image',
            description: 'Generate an image of a chess position',
            inputSchema: {
              type: 'object',
              properties: {
                fen: {
                  type: 'string',
                  description: 'Chess position in FEN notation',
                },
                size: {
                  type: 'number',
                  description: 'Size of the board in pixels (default: 400)',
                  minimum: 200,
                  maximum: 1000,
                },
                light: {
                  type: 'string',
                  description: 'Light square color in hex (default: #FFFFFF)',
                  pattern: '^#[0-9a-fA-F]{6}$',
                },
                dark: {
                  type: 'string',
                  description: 'Dark square color in hex (default: #4B7399)',
                  pattern: '^#[0-9a-fA-F]{6}$',
                },
              },
              required: ['fen'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      switch (request.params.name) {
        case 'evaluate_chess_position': {
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
        }

        case 'generate_chess_position_image': {
          const { fen, size, light, dark } = request.params.arguments as {
            fen: string;
            size?: number;
            light?: string;
            dark?: string;
          };

          try {
            const imageBuffer = await this.imageService.generateImage(fen, {
              size,
              light,
              dark,
            });

            const imageContent: ImageContent = {
              type: 'image',
              data: imageBuffer.toString('base64'),
              mimeType: 'image/png'
            };

            return {
              content: [imageContent],
              isError: false
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
        }

        default: {
          const error = `Unknown tool: ${request.params.name}`;
          throw new McpError(ErrorCode.MethodNotFound, error);
        }
      }
    });
  }

  async run(transport?: Transport) {
    await this.engine.init();
    const serverTransport = transport || new StdioServerTransport();
    await this.server.connect(serverTransport);
    this.isConnected = true;
  }

  async close() {
    await this.engine.quit();
    await this.server.close();
    this.isConnected = false;
  }
}

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ChessServer();
  server.run().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
