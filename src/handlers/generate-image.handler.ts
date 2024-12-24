import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';
import { ChessImageService } from '../chess-image-service.js';

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
        content: [{
          type: 'resource',
          resource: {
            uri: `data:image/png;base64,${imageBuffer.toString('base64')}`,
            text: 'Chess position image'
          }
        }],
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
}
