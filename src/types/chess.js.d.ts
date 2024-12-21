declare module 'chess.js' {
  export class Chess {
    constructor(fen?: string);
    ascii(): string;
    fen(): string;
    game_over(): boolean;
    get(square: string): { type: string; color: string } | null;
    in_check(): boolean;
    in_checkmate(): boolean;
    in_draw(): boolean;
    in_stalemate(): boolean;
    in_threefold_repetition(): boolean;
    insufficient_material(): boolean;
    move(move: string | { from: string; to: string; promotion?: string }): any;
    moves(options?: { square?: string; verbose?: boolean }): string[] | any[];
    pgn(options?: { max_width?: number; newline_char?: string }): string;
    put(piece: { type: string; color: string }, square: string): boolean;
    remove(square: string): { type: string; color: string } | null;
    reset(): void;
    turn(): string;
    validate_fen(fen: string): { valid: boolean; error_number: number; error: string };
  }
}
