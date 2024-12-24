import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ChessEngine } from "../chess-engine.js";

describe('ChessEngine', () => {
  let engine: ChessEngine;

  beforeAll(async () => {
    engine = new ChessEngine('/opt/homebrew/bin/stockfish');
    await engine.init();
  }, 30000);

  afterAll(async () => {
    await engine.quit();
  }, 30000);

  it('should initialize successfully', () => {
    expect(engine.isReady()).toBe(true);
  });

  it('should evaluate starting position', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const evaluation = await engine.evaluatePosition(startingPosition, 1);
    
    expect(evaluation).toEqual(expect.objectContaining({
      isMate: false,
      score: expect.any(Number)
    }));
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
  }, 15000);

  it('should reject invalid FEN', async () => {
    const invalidFen = 'invalid-fen-string';
    await expect(engine.evaluatePosition(invalidFen)).rejects.toThrow();
  }, 10000);

  it('should handle depth parameter', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const evaluation = await engine.evaluatePosition(startingPosition, 1);
    
    // Depth 1 should return quickly
    expect(evaluation).toBeDefined();
  }, 10000);
});
