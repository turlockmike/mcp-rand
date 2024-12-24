import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ChessEngine } from "../chess-engine.js";
import { BestMovesResult, EvaluationResult } from "../chess-engine.js";

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

  it('should evaluate position with moves', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await engine.evaluatePosition(startingPosition, 1, 3) as BestMovesResult;
    
    expect(result).toEqual(expect.objectContaining({
      moves: expect.arrayContaining([
        expect.objectContaining({
          move: expect.any(String),
          score: expect.any(Number),
          mate: null,
          isDraw: false
        })
      ]),
      position: startingPosition,
      depth: expect.any(Number),
      nodes: expect.any(Number),
      time: expect.any(Number)
    }));
    expect(result.moves.length).toBe(3);
  }, 10000);

  it('should evaluate position with single move', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await engine.evaluatePosition(startingPosition, 1, 1) as BestMovesResult;
    
    expect(result).toEqual(expect.objectContaining({
      moves: expect.arrayContaining([
        expect.objectContaining({
          move: expect.any(String),
          score: expect.any(Number),
          mate: null,
          isDraw: false
        })
      ]),
      position: startingPosition,
      depth: expect.any(Number),
      nodes: expect.any(Number),
      time: expect.any(Number)
    }));
    expect(result.moves.length).toBe(1);
  }, 10000);

  it('should evaluate position with returnMoves=0', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await engine.evaluatePosition(startingPosition, 1, 0) as EvaluationResult;
    
    expect(result).toEqual(expect.objectContaining({
      isMate: false,
      score: expect.any(Number)
    }));
    expect((result as any).moves).toBeUndefined();
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

  describe('getBestMoves', () => {
    it('should get best moves from starting position', async () => {
      const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const result = await engine.getBestMoves(startingPosition, {
        depth: 10,
        numMoves: 3,
        timeLimit: 1000
      });

      expect(result).toEqual(expect.objectContaining({
        moves: expect.arrayContaining([
          expect.objectContaining({
            move: expect.any(String),
            score: expect.any(Number),
            mate: null,
            isDraw: false
          })
        ]),
        position: startingPosition,
        depth: expect.any(Number),
        nodes: expect.any(Number),
        time: expect.any(Number)
      }));
      expect(result.moves.length).toEqual(3);
    }, 15000);

    it('should handle stalemate position', async () => {
      // This is a stalemate position
      const stalematePosition = 'k7/8/1Q6/8/8/8/8/K7 b - - 0 1';
      const result = await engine.getBestMoves(stalematePosition);

      expect(result).toEqual({
        moves: [],
        position: stalematePosition,
        depth: 0,
        nodes: 0,
        time: 0
      });
    }, 10000);

    it('should detect mate in one position', async () => {
      // Position with mate in 1 (Qh7#)
      const mateInOnePosition = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1';
      const result = await engine.getBestMoves(mateInOnePosition, {
        depth: 10,
        numMoves: 1
      });

      expect(result.moves[0]).toEqual(expect.objectContaining({
        mate: 1,
        isDraw: false
      }));
    }, 15000);

    it('should handle custom options', async () => {
      const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const result = await engine.getBestMoves(startingPosition, {
        depth: 5,
        numMoves: 1,
        timeLimit: 500
      });

      expect(result.moves.length).toBe(1);
      expect(result.depth).toBeLessThanOrEqual(5);
      expect(result.time).toBeLessThanOrEqual(1000); // Allow some buffer
    }, 10000);

    it('should reject invalid FEN', async () => {
      const invalidFen = 'invalid-fen-string';
      await expect(engine.getBestMoves(invalidFen)).rejects.toThrow('Invalid FEN position');
    }, 10000);
  });
});
