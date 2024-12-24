import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { ChessEngine } from "../chess-engine.js";

type LogLevel = "error" | "debug" | "info" | "notice" | "warning" | "critical" | "alert" | "emergency";

describe('ChessEngine', () => {
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
  
  let engine: ChessEngine;

  beforeAll(async () => {
    engine = new ChessEngine('/opt/homebrew/bin/stockfish', mockLogger.sendLoggingMessage);
    await engine.init();
  }, 30000);

  afterAll(async () => {
    await engine.quit();
  }, 30000);

  it('should initialize successfully', () => {
    expect(engine.isReady()).toBe(true);
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  });

  it('should evaluate starting position', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const evaluation = await engine.evaluatePosition(startingPosition, 1);
    
    expect(evaluation).toEqual(expect.objectContaining({
      isMate: false,
      score: expect.any(Number)
    }));
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  }, 10000);

  it('should detect mate in one', async () => {
    // Scholar's mate position
    const mateInOne = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
    const evaluation = await engine.evaluatePosition(mateInOne, 5);
    
    expect(evaluation).toEqual({
      isMate: true,
      score: Infinity,
      moveNumber: 1
    });
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  }, 15000);

  it('should reject invalid FEN', async () => {
    const invalidFen = 'invalid-fen-string';
    await expect(engine.evaluatePosition(invalidFen)).rejects.toThrow();
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalledWith(expect.objectContaining({
      level: "error"
    }));
  }, 10000);

  it('should handle depth parameter', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const evaluation = await engine.evaluatePosition(startingPosition, 1);
    
    // Depth 1 should return quickly
    expect(evaluation).toBeDefined();
    expect(mockLogger.sendLoggingMessage).toHaveBeenCalled();
  }, 10000);
});
