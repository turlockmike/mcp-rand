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

    // Log to stderr only until connected

    this.engine = new ChessEngine('/opt/homebrew/bin/stockfish', this.server.sendLoggingMessage.bind(this.server));
    this.imageService = new ChessImageService(this.server.sendLoggingMessage.bind(this.server));
    this.setupServer();
    
    // Error handling
    this.server.onerror = (error: CustomMcpError) => {
      const errorMsg = `Server error: ${error.message}`;
      console.error(errorMsg, { code: error.code, stack: error.stack });
      if (this.isConnected) {
        this.server.sendLoggingMessage({
          level: "error",
          data: errorMsg,
          meta: { code: error.code, stack: error.stack }
        });
      }
    };

    process.on('SIGINT', async () => {
      const msg = 'Received SIGINT signal, shutting down...';
      if (this.isConnected) {
        this.server.sendLoggingMessage({
          level: "info",
          data: msg
        });
      }
      await this.close();
      process.exit(0);
    });
  }

  private setupServer() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const msg = 'Handling ListTools request';
      if (this.isConnected) {
        this.server.sendLoggingMessage({
          level: "debug",
          data: msg
        });
      }
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
      const msg = 'Handling tool call request';
      const meta = { 
        tool: request.params.name,
        arguments: request.params.arguments 
      };
      if (this.isConnected) {
        this.server.sendLoggingMessage({
          level: "info",
          data: msg,
          meta
        });
      }

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

            const successMsg = 'Position evaluated successfully';
            const meta = { 
              fen,
              depth,
              evaluation: {
                isMate: evaluation.isMate,
                score: evaluation.score,
                moveNumber: evaluation.moveNumber
              }
            };
            if (this.isConnected) {
              this.server.sendLoggingMessage({
                level: "info",
                data: successMsg,
                meta
              });
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
            const errorMsg = 'Error evaluating position';
            const meta = { 
              error: error instanceof Error ? error.message : 'Unknown error',
              fen,
              depth
            };
            console.error(errorMsg, meta);
            if (this.isConnected) {
              this.server.sendLoggingMessage({
                level: "error",
                data: errorMsg,
                meta
              });
            }

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

            const successMsg = 'Position image generated successfully';
            const meta = { fen };
            if (this.isConnected) {
              this.server.sendLoggingMessage({
                level: "info",
                data: successMsg,
                meta
              });
            }

            return {
              content: [
                {
                  type: 'resource',
                  resource: {
                    uri: 'data:image/png;base64,' + imageBuffer.toString('base64'),
                    text: 'Chess position image'
                  },
                },
              ],
            };
          } catch (error) {
            const errorMsg = 'Error generating position image';
            const meta = {
              error: error instanceof Error ? error.message : 'Unknown error',
              fen,
            };
            console.error(errorMsg, meta);
            if (this.isConnected) {
              this.server.sendLoggingMessage({
                level: "error",
                data: errorMsg,
                meta
              });
            }

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
          console.error(error);
          if (this.isConnected) {
            this.server.sendLoggingMessage({
              level: "error",
              data: error
            });
          }
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
    
    // Now that we're connected, send the initialization message
    this.server.sendLoggingMessage({
      level: "info",
      data: "Initializing Chess MCP server"
    });

    if (!transport) {
      const msg = 'Chess MCP server running on stdio';
      this.server.sendLoggingMessage({
        level: "info",
        data: msg
      });
    }
  }

  async close() {
    const msg = 'Closing Chess MCP server';
    if (this.isConnected) {
      this.server.sendLoggingMessage({
        level: "info",
        data: msg
      });
    }
    await this.engine.quit();
    await this.server.close();
    this.isConnected = false;
  }
}

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ChessServer();
  server.run().catch(error => {
    const errorMsg = 'Failed to start server';
    const meta = { error: error instanceof Error ? error.message : 'Unknown error' };
    console.error(errorMsg, meta);
    // Since we can't access the private server property, we'll just log to stderr
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}
