import { ListToolsRequest } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';

export class ListToolsHandler implements Handler<ListToolsRequest> {
  async handle(): Promise<{
    tools: Array<{
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          [key: string]: {
            type: string;
            description: string;
            minimum?: number;
            maximum?: number;
            pattern?: string;
          };
        };
        required: string[];
      };
    }>;
  }> {
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
              numMoves: {
                type: 'number',
                description: 'Number of best moves to return',
                minimum: 0,
                maximum: 10,
              },
              timeLimit: {
                type: 'number',
                description: 'Time limit in milliseconds (default: 1000)',
                minimum: 100,
                maximum: 10000,
              },
              includeImage: {
                type: 'boolean',
                description: 'Whether to include an image of the position in the response',
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
  }
}
