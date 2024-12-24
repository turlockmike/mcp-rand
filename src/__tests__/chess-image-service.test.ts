import { describe, it, expect, jest } from '@jest/globals';
import { ChessImageService, ImageGenerationOptions } from '../chess-image-service.js';

type LogLevel = "error" | "debug" | "info" | "notice" | "warning" | "critical" | "alert" | "emergency";

describe('ChessImageService', () => {
  const mockLogger = {
    level: "",
    data: "",
    meta: {},
    sendLoggingMessage: jest.fn(async (params: { level: LogLevel; data: unknown; meta?: Record<string, unknown> }) => {
      mockLogger.level = params.level;
      mockLogger.data = params.data as string;
      mockLogger.meta = params.meta || {};
    })
  };
  
  beforeEach(() => {
    mockLogger.sendLoggingMessage.mockClear();
  });
  
  const imageService = new ChessImageService(mockLogger.sendLoggingMessage);

  it('should generate image for starting position', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const buffer = await imageService.generateImage(startingPosition);
    
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  });

  it('should handle custom size', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const options: ImageGenerationOptions = {
      size: 600
    };
    
    const buffer = await imageService.generateImage(startingPosition, options);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  });

  it('should handle custom colors', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const options: ImageGenerationOptions = {
      light: '#E0E0E0',
      dark: '#505050'
    };
    
    const buffer = await imageService.generateImage(startingPosition, options);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  });

  it('should handle complex position', async () => {
    // Scholar's mate position
    const complexPosition = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
    const buffer = await imageService.generateImage(complexPosition);
    
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  });

  it('should reject invalid FEN', async () => {
    const invalidFen = 'invalid-fen-string';
    await expect(imageService.generateImage(invalidFen)).rejects.toThrow('Invalid FEN position');
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalledWith(expect.objectContaining({
      level: "error"
    }));
  });

  it('should handle all options combined', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const options: ImageGenerationOptions = {
      size: 600,
      light: '#FFFFFF',
      dark: '#4B7399'
    };
    
    const buffer = await imageService.generateImage(startingPosition, options);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  });

  it('should use default options when not specified', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const buffer = await imageService.generateImage(startingPosition, {});
    
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  });
}); 
