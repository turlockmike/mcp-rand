import { describe, it, expect } from '@jest/globals';
import { ChessImageService } from '../chess-image-service.js';

describe('ChessImageService', () => {
  let imageService: ChessImageService;

  beforeEach(() => {
    imageService = new ChessImageService();
  });

  it('should generate an image for a valid position', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const buffer = await imageService.generateImage(fen);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should handle custom options', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const options = {
      size: 300,
      light: '#FFFFFF',
      dark: '#000000'
    };
    const buffer = await imageService.generateImage(fen, options);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should reject invalid FEN strings', async () => {
    const fen = 'invalid-fen-string';
    await expect(imageService.generateImage(fen)).rejects.toThrow('Invalid FEN position');
  });
}); 
