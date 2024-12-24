import { CallToolRequest, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';
import { ChessEngine } from '../chess-engine.js';

export class EvaluatePositionHandler implements Handler<CallToolRequest> {
  constructor(private engine: ChessEngine) {}

  async handle(request: CallToolRequest): Promise<any> {
    const { fen, depth = 15 } = request.params.arguments as { fen: string; depth?: number };

    try {
      const evaluation = await this.engine.evaluatePosition(fen, depth);
      let text: string;

      if (evaluation.isMate && evaluation.moveNumber !== undefined) {
        text = `Mate in ${Math.abs(evaluation.moveNumber)} moves for ${evaluation.score > 0 ? 'white' : 'black'}`;
      } else {
        text = `Evaluation: ${evaluation.score} pawns`;
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
