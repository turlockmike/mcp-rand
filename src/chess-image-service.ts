import ChessImageGenerator from 'chess-image-generator';
import { Chess } from 'chess.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

type LogLevel = "error" | "debug" | "info" | "notice" | "warning" | "critical" | "alert" | "emergency";
type LoggingFunction = (params: { level: LogLevel; data: unknown; meta?: Record<string, unknown> }) => void | Promise<void>;

export interface ImageGenerationOptions {
  size?: number;
  light?: string;
  dark?: string;
}

export class ChessImageService {
  private generator: ChessImageGenerator;
  private sendLoggingMessage: LoggingFunction;

  constructor(sendLoggingMessage: LoggingFunction) {
    this.generator = new ChessImageGenerator();
    this.sendLoggingMessage = sendLoggingMessage;
    const msg = 'ChessImageService initialized';
    console.error(msg);
    this.sendLoggingMessage({
      level: "debug",
      data: msg
    });
  }

  async generateImage(fen: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    try {
      // Validate FEN
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

      // Apply options
      if (options.size) {
        this.generator.size = options.size;
      }
      if (options.light) {
        this.generator.lightSquare = options.light;
      }
      if (options.dark) {
        this.generator.darkSquare = options.dark;
      }

      const debugMsg = 'Generating chess position image';
      const debugMeta = { fen, options };
      console.error(debugMsg, debugMeta);
      this.sendLoggingMessage({
        level: "debug",
        data: debugMsg,
        meta: debugMeta
      });

      await this.generator.loadFEN(fen);
      const buffer = await this.generator.generateBuffer();

      const successMsg = 'Chess position image generated successfully';
      const meta = { fen };
      console.error(successMsg, meta);
      this.sendLoggingMessage({
        level: "debug",
        data: successMsg,
        meta
      });

      return buffer;
    } catch (error) {
      const errorMsg = 'Error generating chess position image';
      const meta = { 
        error: error instanceof Error ? error.message : 'Unknown error',
        fen,
        options
      };
      console.error(errorMsg, meta);
      this.sendLoggingMessage({
        level: "error",
        data: errorMsg,
        meta
      });
      throw error;
    }
  }
} 