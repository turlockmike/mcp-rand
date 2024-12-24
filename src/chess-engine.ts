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

interface SearchOptions {
  depth?: number;
  nodes?: number;
  mate?: number;
  movetime?: number;
  multipv?: number;
}

interface EngineResult {
  bestmove: string;
  info: EngineInfo[];
}

interface BestMove {
  move: string;
  score: number;
  mate: number | null;
  isDraw: boolean;
}

interface BestMovesResult {
  moves: BestMove[];
  position: string;
  depth: number;
  nodes: number;
  time: number;
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
      const chess = new Chess();
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

    return evaluation;
  }

  async getBestMoves(fen: string, options: {
    depth?: number;
    numMoves?: number;
    timeLimit?: number;
  } = {}): Promise<BestMovesResult> {
    if (!this.engine || !this.engineReady) {
      throw new Error('Engine not initialized');
    }

    const chess = new Chess(fen);
    if (!chess.validate_fen(fen).valid) {
      throw new Error('Invalid FEN position');
    }

    // Check for immediate draws
    if (chess.in_stalemate() || chess.insufficient_material() || chess.in_threefold_repetition()) {
      return {
        moves: [],
        position: fen,
        depth: 0,
        nodes: 0,
        time: 0
      };
    }

    const depth = options.depth || 20;
    const numMoves = options.numMoves || 3;
    const timeLimit = options.timeLimit || 1000;

    // Set UCI options for multi-PV analysis
    await this.engine.setoption('MultiPV', numMoves.toString());
    
    await this.engine.position(fen);
    const searchResult = await this.engine.go({ 
      depth, 
      movetime: timeLimit 
    } as SearchOptions);

    console.log('Search result:', JSON.stringify(searchResult, null, 2));

    // Group info by multipv index to get the latest info for each line
    const pvInfoMap = new Map<number, EngineInfo>();
    searchResult.info.forEach((info: any) => {
      if (info.multipv && info.score) {
        pvInfoMap.set(info.multipv, {
          depth: info.depth,
          seldepth: info.seldepth,
          time: info.time,
          nodes: info.nodes,
          pv: Array.isArray(info.pv) ? info.pv : [],
          score: info.score,
          currmove: info.currmove,
          currmovenumber: info.currmovenumber
        });
      }
    });

    // Convert the search result to our expected format
    const moves: BestMove[] = Array.from(pvInfoMap.values())
      .filter((info: EngineInfo) => info.score && info.pv && info.pv.length > 0)
      .map((info: EngineInfo) => {
        const score = info.score!;
        return {
          move: info.pv![0],
          score: score.unit === 'cp' ? score.value / 100 : 0,
          mate: score.unit === 'mate' ? score.value : null,
          isDraw: false
        };
      });

    // If no moves were found but we have a bestmove, add it
    if (moves.length === 0 && searchResult.bestmove) {
      const lastInfo = searchResult.info[searchResult.info.length - 1] as EngineInfo;
      if (lastInfo && lastInfo.score) {
        moves.push({
          move: searchResult.bestmove,
          score: lastInfo.score.unit === 'cp' ? lastInfo.score.value / 100 : 0,
          mate: lastInfo.score.unit === 'mate' ? lastInfo.score.value : null,
          isDraw: false
        });
      }
    }

    const lastInfo = searchResult.info[searchResult.info.length - 1] as EngineInfo || {
      depth: depth,
      nodes: 0,
      time: 0
    };
    
    return {
      moves,
      position: fen,
      depth: lastInfo.depth || depth,
      nodes: lastInfo.nodes || 0,
      time: lastInfo.time || 0
    };
  }

  isReady(): boolean {
    return this.engineReady;
  }
}
