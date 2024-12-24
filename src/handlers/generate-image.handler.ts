import { CallToolRequest, ErrorCode, McpError, ImageContent } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';
import { ChessImageService } from '../chess-image-service.js';

export const toolSpec = {
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
};

export class GenerateImageHandler implements Handler<CallToolRequest> {
  constructor(private imageService: ChessImageService) {}

  async handle(request: CallToolRequest): Promise<any> {
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

      return {
        content: [
          {
            type: 'image',
            data: imageBuffer.toString('base64'),
            mimeType: 'image/png',
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
}
