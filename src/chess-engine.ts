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
  algebraic: string;
  score: number;
  mate: number | null;
  isDraw: boolean;
}

export interface BestMovesResult {
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

  async evaluatePosition(fen: string, depth: number = 15, returnMoves?: number): Promise<EvaluationResult | BestMovesResult> {
    const result = await this.getBestMoves(fen, {
      depth,
      numMoves: Math.max(returnMoves || 1, 1),
      timeLimit: 1000
    });

    if (returnMoves && returnMoves > 0) {
      return result;
    }

    // Convert to EvaluationResult format
    const bestMove = result.moves[0];
    if (!bestMove) {
      throw new Error('No evaluation available');
    }

    // Convert score to our convention (positive means White is winning)
    const score = bestMove.mate !== null ? 
      (bestMove.mate > 0 ? Infinity : -Infinity) : 
      bestMove.score;  // Keep UCI's White perspective

    return {
      score,
      isMate: bestMove.mate !== null,
      moveNumber: bestMove.mate !== null ? Math.abs(bestMove.mate) : undefined
    };
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
    await this.engine.isready(); // Wait for the engine to process the option
    
    await this.engine.position(fen);
    await this.engine.isready(); // Wait for position to be set
    
    const searchResult = await this.engine.go({ 
      depth, 
      movetime: timeLimit,
      multipv: numMoves
    } as SearchOptions);

    // Group info by multipv index to get the latest info for each line
    const pvInfoMap = new Map<number, EngineInfo>();
    searchResult.info.forEach((info: any) => {
      // Skip non-move info
      if (!info.pv || !info.score || info.string) {
        return;
      }
      
      const multipv = info.multipv || 1;  // Default to 1 if not specified
      // Only update if this is newer information for this line
      const existing = pvInfoMap.get(multipv);
      if (!existing || (info.depth && (!existing.depth || info.depth >= existing.depth))) {
        pvInfoMap.set(multipv, {
          depth: info.depth,
          seldepth: info.seldepth,
          time: info.time,
          nodes: info.nodes,
          pv: Array.isArray(info.pv) ? info.pv : [info.pv],
          score: info.score,
          currmove: info.currmove,
          currmovenumber: info.currmovenumber
        });
      }
    });

    // Convert the search result to our expected format
    const moves: BestMove[] = Array.from(pvInfoMap.entries())
      .sort(([a], [b]) => a - b)  // Sort by multipv index
      .map(([_, info]) => {
        const score = info.score!;
        const uciMove = info.pv![0].split(' ')[0]; // Only take the first move
        
        // Convert UCI move to algebraic notation
        // Create a new chess instance for each move to avoid state issues
        const tempChess = new Chess(fen);
        const move = tempChess.move({
          from: uciMove.slice(0, 2),
          to: uciMove.slice(2, 4),
          promotion: uciMove.length > 4 ? uciMove[4] : undefined
        });
        const algebraic = move ? move.san : uciMove;

        // Get the side to move from FEN
        const isBlackToMove = fen.split(' ')[1] === 'b';
        // Convert score to centipawns
        const scoreValue = score.unit === 'cp' ? score.value / 100 : 0;
        const mateValue = score.unit === 'mate' ? score.value : null;

        // UCI returns scores from the engine's perspective (positive means good for side to move)
        // We need to convert to White's perspective (positive means White is winning)
        return {
          move: uciMove,
          algebraic,
          score: isBlackToMove ? -scoreValue : scoreValue,  // Negate for Black's moves
          mate: mateValue,
          isDraw: false
        };
      });

    // If no moves were found but we have a bestmove, add it
    if (moves.length === 0 && searchResult.bestmove) {
      const lastInfo = searchResult.info[searchResult.info.length - 1] as EngineInfo;
      if (lastInfo && lastInfo.score) {
        const uciMove = searchResult.bestmove.split(' ')[0]; // Only take the first move
        
        // Convert UCI move to algebraic notation
        const tempChess = new Chess(fen);
        const move = tempChess.move({
          from: uciMove.slice(0, 2),
          to: uciMove.slice(2, 4),
          promotion: uciMove.length > 4 ? uciMove[4] : undefined
        });
        const algebraic = move ? move.san : uciMove;

        // Get the side to move from FEN
        const isBlackToMove = fen.split(' ')[1] === 'b';
        // Convert score to centipawns
        const scoreValue = lastInfo.score.unit === 'cp' ? lastInfo.score.value / 100 : 0;
        const mateValue = lastInfo.score.unit === 'mate' ? lastInfo.score.value : null;

        moves.push({
          move: uciMove,
          algebraic,
          score: isBlackToMove ? -scoreValue : scoreValue,  // Negate for Black's moves
          mate: mateValue,
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
