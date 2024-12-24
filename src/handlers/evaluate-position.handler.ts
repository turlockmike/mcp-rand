import { CallToolRequest, ErrorCode, McpError, ImageContent } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';
import { ChessEngine, EvaluationResult, BestMovesResult } from '../chess-engine.js';
import { ChessImageService } from '../chess-image-service.js';

export class EvaluatePositionHandler implements Handler<CallToolRequest> {
  constructor(
    private engine: ChessEngine,
    private imageService: ChessImageService
  ) {}

  async handle(request: CallToolRequest): Promise<any> {
    const { fen, depth = 15, numMoves, timeLimit, includeImage } = request.params.arguments as {
      fen: string;
      depth?: number;
      numMoves?: number;
      timeLimit?: number;
      includeImage?: boolean;
    };

    try {
      const content: Array<any> = [];

      // Generate evaluation text
      let text: string;
      if (numMoves !== undefined && numMoves > 0) {
        const result = await this.engine.getBestMoves(fen, {
          depth,
          numMoves,
          timeLimit,
        });
        text = JSON.stringify(result, null, 2);
      } else {
        const result = await this.engine.evaluatePosition(fen, depth);
        if ('moves' in result) {
          const bestMove = result.moves[0];
          if (!bestMove) {
            text = 'No valid moves available';
          } else if (bestMove.mate !== null) {
            text = `Mate in ${Math.abs(bestMove.mate)} moves for ${bestMove.mate > 0 ? 'white' : 'black'}`;
          } else {
            text = `Evaluation: ${bestMove.score} pawns`;
          }
        } else {
          if (result.isMate && result.moveNumber !== undefined) {
            text = `Mate in ${Math.abs(result.moveNumber)} moves for ${result.score > 0 ? 'white' : 'black'}`;
          } else {
            text = `Evaluation: ${result.score} pawns`;
          }
        }
      }

      // Add evaluation text
      content.push({
        type: 'text',
        text,
      });

      // Add image if requested
      if (includeImage) {
        const imageBuffer = await this.imageService.generateImage(fen);
        const imageContent: ImageContent = {
          type: 'image',
          data: imageBuffer.toString('base64'),
          mimeType: 'image/png'
        };
        content.push(imageContent);
      }

      return { content };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
}
