import { Chess } from "chess.js";
import { Engine } from "node-uci";
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

type LogLevel = "error" | "debug" | "info" | "notice" | "warning" | "critical" | "alert" | "emergency";
type LoggingFunction = (params: { level: LogLevel; data: unknown; meta?: Record<string, unknown> }) => void | Promise<void>;

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
  private sendLoggingMessage: LoggingFunction;

  constructor(enginePath: string = '/opt/homebrew/bin/stockfish', sendLoggingMessage: LoggingFunction) {
    this.enginePath = enginePath;
    this.sendLoggingMessage = sendLoggingMessage;
    const msg = 'ChessEngine initialized';
    const meta = { enginePath };
    this.sendLoggingMessage({
      level: "debug",
      data: msg,
      meta
    });
  }

  async init(): Promise<void> {
    const msg = 'Initializing chess engine';
    this.sendLoggingMessage({
      level: "info",
      data: msg
    });
    this.engine = new Engine(this.enginePath);
    await this.engine.init();
    await this.engine.isready();
    this.engineReady = true;
    const successMsg = 'Chess engine initialized successfully';
    this.sendLoggingMessage({
      level: "info",
      data: successMsg
    });
  }

  async quit(): Promise<void> {
    if (this.engine) {
      const msg = 'Shutting down chess engine';
      this.sendLoggingMessage({
        level: "info",
        data: msg
      });
      await this.engine.quit();
      this.engine = null;
      this.engineReady = false;
      const successMsg = 'Chess engine shut down successfully';
      this.sendLoggingMessage({
        level: "info",
        data: successMsg
      });
    }
  }

  async evaluatePosition(fen: string, depth: number = 15): Promise<EvaluationResult> {
    if (!this.engine || !this.engineReady) {
      const error = 'Engine not initialized';
      console.error(error);
      this.sendLoggingMessage({
        level: "error",
        data: error
      });
      throw new Error(error);
    }

    // Validate FEN
    try {
      const chess = new Chess(fen);
      if (!chess.validate_fen(fen).valid) {
        const error = 'Invalid FEN position';
        const meta = { fen };
        console.error(error, meta);
        this.sendLoggingMessage({
          level: "error",
          data: error,
          meta
        });
        throw new Error(error);
      }
    } catch (error) {
      const msg = 'Invalid FEN position';
      const meta = { fen, error: error instanceof Error ? error.message : 'Unknown error' };
      console.error(msg, meta);
      this.sendLoggingMessage({
        level: "error",
        data: msg,
        meta
      });
      throw new Error('Invalid FEN position');
    }

    const debugMsg = 'Evaluating position';
    const debugMeta = { fen, depth };
    this.sendLoggingMessage({
      level: "debug",
      data: debugMsg,
      meta: debugMeta
    });
    await this.engine.position(fen);
    const result = await this.engine.go({ depth });

    // Get the last info with a score
    const lastInfo = result.info[result.info.length - 1] as EngineInfo;
    if (!lastInfo || !lastInfo.score) {
      const error = 'No evaluation available';
      const meta = { fen, depth };
      console.error(error, meta);
      this.sendLoggingMessage({
        level: "error",
        data: error,
        meta
      });
      throw new Error(error);
    }

    // Parse the score
    const score = lastInfo.score;
    let evaluation: EvaluationResult;

    if (score.unit === 'mate') {
      evaluation = {
        score: score.value > 0 ? Infinity : -Infinity,
        isMate: true,
        moveNumber: Math.abs(score.value)
      };
    } else {
      evaluation = {
        score: score.value / 100, // Convert centipawns to pawns
        isMate: false
      };
    }

    const successMsg = 'Position evaluated';
    const meta = { 
      fen, 
      depth, 
      evaluation,
      engineInfo: {
        depth: lastInfo.depth,
        nodes: lastInfo.nodes,
        time: lastInfo.time
      }
    };
    this.sendLoggingMessage({
      level: "debug",
      data: successMsg,
      meta
    });

    return evaluation;
  }

  isReady(): boolean {
    return this.engineReady;
  }
}
