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

  describe('evaluatePosition', () => {
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

  describe('getBestMoves', () => {
    it('should return multiple best moves for starting position', async () => {
      const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const result = await engine.getBestMoves(startingPosition, { depth: 10, numMoves: 3 });
      expect(result.moves.length).toBeGreaterThan(0);
      expect(result.moves.length).toBeLessThanOrEqual(3);
      expect(result.depth).toBeGreaterThan(0);
      expect(result.nodes).toBeGreaterThan(0);
    });
    it('should detect mate in 2 sequence', async () => {
      // Position where white can force mate in 2 moves
      const mateIn2Fen = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
      const result = await engine.getBestMoves(mateIn2Fen, { depth: 10 });
      expect(result.moves[0].mate).not.toBeNull();
      expect(Math.abs(result.moves[0].mate!)).toBeLessThanOrEqual(2);
    });
    it('should handle draw positions', async () => {
      const drawByMaterialFen = 'k7/8/8/8/8/8/8/K7 w - - 0 1'; // King vs King position
      const result = await engine.getBestMoves(drawByMaterialFen);
      expect(result.moves.length).toBe(0);
      expect(result.depth).toBe(0);
    });

    it('should handle invalid FEN', async () => {
      await expect(engine.getBestMoves('invalid-fen')).rejects.toThrow('Invalid FEN position');
    });
    it('should respect time limits', async () => {
      const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const result = await engine.getBestMoves(startingPosition, { timeLimit: 100 });
      expect(result.time).toBeLessThanOrEqual(150); // Allow some buffer for processing
    });
  });
});
