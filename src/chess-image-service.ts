import ChessImageGenerator from 'chess-image-generator';
import { Chess } from 'chess.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export interface ImageGenerationOptions {
  size?: number;
  light?: string;
  dark?: string;
}

export class ChessImageService {
  private generator: ChessImageGenerator;

  constructor() {
    this.generator = new ChessImageGenerator();
  }

  async generateImage(fen: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    try {
      // Validate FEN
      const chess = new Chess(fen);
      if (!chess.validate_fen(fen).valid) {
        throw new Error('Invalid FEN position');
      }

      // Set position and options
      this.generator.loadFEN(fen);
      if (options.size) this.generator.size = options.size;
      if (options.light) this.generator.lightSquare = options.light;
      if (options.dark) this.generator.darkSquare = options.dark;

      // Generate image
      return await this.generator.generateBuffer();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }
} 