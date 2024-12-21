import { Chess } from "chess.js";
import { Engine } from "node-uci";

interface EngineScore {
  unit: 'cp' | 'mate';
  value: number;
}

interface EngineInfo {
  depth?: number;
  seldepth?: number;
  time?: number;
  nodes?: number;
  pv?: string[];
  score?: EngineScore;
  currmove?: string;
  currmovenumber?: number;
}

export interface EvaluationResult {
  score: number;
  isMate: boolean;
  moveNumber?: number;
}

export class ChessEngine {
  private engine: Engine | null = null;
  private engineReady: boolean = false;
  private enginePath: string;

  constructor(enginePath: string = '/opt/homebrew/bin/stockfish') {
    this.enginePath = enginePath;
  }

  async init(): Promise<void> {
    this.engine = new Engine(this.enginePath);
    await this.engine.init();
    await this.engine.isready();
    this.engineReady = true;
  }

  async quit(): Promise<void> {
    if (this.engine) {
      await this.engine.quit();
      this.engine = null;
      this.engineReady = false;
    }
  }

  async evaluatePosition(fen: string, depth: number = 15): Promise<EvaluationResult> {
    if (!this.engine || !this.engineReady) {
      throw new Error('Engine not initialized');
    }

    // Validate FEN
    try {
      const chess = new Chess(fen);
      if (!chess.validate_fen(fen).valid) {
        throw new Error('Invalid FEN position');
      }
    } catch (error) {
      throw new Error('Invalid FEN position');
    }

    await this.engine.position(fen);
    const result = await this.engine.go({ depth });

    // Get the last info with a score
    const lastInfo = result.info[result.info.length - 1] as EngineInfo;
    if (!lastInfo || !lastInfo.score) {
      throw new Error('No evaluation available');
    }

    // Parse the score
    const score = lastInfo.score;
    if (score.unit === 'mate') {
      return {
        score: score.value > 0 ? Infinity : -Infinity,
        isMate: true,
        moveNumber: Math.abs(score.value)
      };
    } else {
      return {
        score: score.value / 100, // Convert centipawns to pawns
        isMate: false
      };
    }
  }

  isReady(): boolean {
    return this.engineReady;
  }
}
