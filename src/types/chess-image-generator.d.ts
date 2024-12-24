declare module 'chess-image-generator' {
  export default class ChessImageGenerator {
    size: number;
    style: 'alpha';
    lightSquare: string;
    darkSquare: string;

    constructor();
    
    /**
     * Loads a chess position from FEN string
     */
    loadFEN(fen: string): Promise<void>;

    /**
     * Generates a buffer containing the chess board image
     */
    generateBuffer(): Promise<Buffer>;
  }
} 