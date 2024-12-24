import { describe, it, expect, beforeEach } from '@jest/globals';
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

  it('should flip board when black to move', async () => {
    // Position where black is to move
    const blackToMove = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';
    const buffer1 = await imageService.generateImage(blackToMove);
    expect(buffer1).toBeInstanceOf(Buffer);
    expect(buffer1.length).toBeGreaterThan(0);

    // Same position but white to move
    const whiteToMove = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const buffer2 = await imageService.generateImage(whiteToMove);
    expect(buffer2).toBeInstanceOf(Buffer);
    expect(buffer2.length).toBeGreaterThan(0);

    // The buffers should be different since the board orientation is different
    expect(buffer1.toString('base64')).not.toBe(buffer2.toString('base64'));
  });

  it('should respect explicit flip option', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Generate with explicit flip=true
    const buffer1 = await imageService.generateImage(fen, { flip: true });
    expect(buffer1).toBeInstanceOf(Buffer);
    expect(buffer1.length).toBeGreaterThan(0);

    // Generate with explicit flip=false
    const buffer2 = await imageService.generateImage(fen, { flip: false });
    expect(buffer2).toBeInstanceOf(Buffer);
    expect(buffer2.length).toBeGreaterThan(0);

    // The buffers should be different since the board orientation is different
    expect(buffer1.toString('base64')).not.toBe(buffer2.toString('base64'));
  });
}); 
