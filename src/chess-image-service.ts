import { Chess } from 'chess.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import ChessImageGenerator from 'chess-fen2img';

export interface ImageGenerationOptions {
  size?: number;
  light?: string;
  dark?: string;
  flip?: boolean;
}

export class ChessImageService {
  async generateImage(fen: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    try {
      // Validate FEN
      const chess = new Chess(fen);
      if (!chess.validate_fen(fen).valid) {
        throw new Error('Invalid FEN position');
      }

      // Generate image
      const generator = new ChessImageGenerator({
        size: options.size || 640,
        dark: options.dark || '#B58863',
        light: options.light || '#F0D9B5',
        flipped: options.flip || fen.split(' ')[1] === 'b'
      });

      try {
        await generator.loadFEN(fen);
        return await generator.generateBuffer();
      } catch (err) {
        console.error('Error generating chess board image:', err);
        throw new Error('Failed to generate chess board image');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error generating chess board image');
    }
  }
} 