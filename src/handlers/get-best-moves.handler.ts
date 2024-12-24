import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';
import { ChessEngine } from '../chess-engine.js';

export class GetBestMovesHandler implements Handler<CallToolRequest> {
  constructor(private engine: ChessEngine) {}

  async handle(request: CallToolRequest): Promise<any> {
    const { fen, depth, numMoves, timeLimit } = request.params.arguments as {
      fen: string;
      depth?: number;
      numMoves?: number;
      timeLimit?: number;
    };

    try {
      const result = await this.engine.getBestMoves(fen, {
        depth,
        numMoves,
        timeLimit,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
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
