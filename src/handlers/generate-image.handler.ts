import { CallToolRequest, ImageContent } from '@modelcontextprotocol/sdk/types.js';
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
}
