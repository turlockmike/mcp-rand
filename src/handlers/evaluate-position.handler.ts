import { CallToolRequest, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';
import { ChessEngine, EvaluationResult, BestMovesResult } from '../chess-engine.js';

export class EvaluatePositionHandler implements Handler<CallToolRequest> {
  constructor(private engine: ChessEngine) {}

  async handle(request: CallToolRequest): Promise<any> {
    const { fen, depth = 15 } = request.params.arguments as { fen: string; depth?: number };

    try {
      const result = await this.engine.evaluatePosition(fen, depth);
      let text: string;

      // Check if it's a BestMovesResult
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
        // It's an EvaluationResult
        if (result.isMate && result.moveNumber !== undefined) {
          text = `Mate in ${Math.abs(result.moveNumber)} moves for ${result.score > 0 ? 'white' : 'black'}`;
        } else {
          text = `Evaluation: ${result.score} pawns`;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text,
          },
        ],
      };
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
