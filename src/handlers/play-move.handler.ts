import { CallToolRequest, ErrorCode, McpError, ImageContent } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';
import { ChessEngine, EvaluationResult, BestMovesResult } from '../chess-engine.js';
import { ChessImageService } from '../chess-image-service.js';

export const toolSpec = {
  name: 'play_chess_move',
  description: 'Play a chess move from a given position and optionally get evaluation and board image',
  inputSchema: {
    type: 'object',
    properties: {
      move: {
        type: 'string',
        description: 'Move in UCI format (e.g., "e2e4", "e7e8q")',
        pattern: '^[a-h][1-8][a-h][1-8][qrbnQRBN]?$'
      },
      fen: {
        type: 'string',
        description: 'Starting position in FEN notation (optional, defaults to starting position)'
      },
      pgn: {
        type: 'string',
        description: 'Starting position in PGN notation (optional)'
      },
      includeEvaluation: {
        type: 'boolean',
        description: 'Whether to include position evaluation after the move'
      },
      includeImage: {
        type: 'boolean',
        description: 'Whether to include an image of the resulting position'
      },
      depth: {
        type: 'number',
        description: 'Evaluation depth (1-20)',
        minimum: 1,
        maximum: 20
      }
    },
    required: ['move']
  }
};

export class PlayMoveHandler implements Handler<CallToolRequest> {
  constructor(
    private engine: ChessEngine,
    private imageService: ChessImageService
  ) {}

  async handle(request: CallToolRequest): Promise<any> {
    const { 
      fen, 
      move, 
      pgn,
      includeEvaluation = false,
      includeImage = false,
      depth = 15 
    } = request.params.arguments as {
      fen?: string;
      move: string;
      pgn?: string;
      includeEvaluation?: boolean;
      includeImage?: boolean;
      depth?: number;
    };

    try {
      const content: Array<any> = [];
      
      // Validate and play the move
      const moveResult = await this.engine.playMove(fen || pgn || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', move);
      
      if (!moveResult.isLegal) {
        return {
          content: [{
            type: 'text',
            text: `Move ${move} is illegal.`
          }],
          isError: true,
          errorCode: ErrorCode.InvalidRequest
        };
      }

      // Add move validation result
      content.push({
        type: 'text',
        text: `Move ${move} is legal. New position: ${moveResult.resultingFen}`
      });

      // Add evaluation if requested
      if (includeEvaluation) {
        const evaluation = await this.engine.evaluatePosition(moveResult.resultingFen, depth) as EvaluationResult;
        let evaluationText: string;
        
        if (evaluation.isMate && evaluation.moveNumber !== undefined) {
          evaluationText = `Mate in ${Math.abs(evaluation.moveNumber)} moves for ${evaluation.score > 0 ? 'white' : 'black'}`;
        } else {
          evaluationText = `Evaluation: ${evaluation.score} pawns`;
        }
        
        content.push({
          type: 'text',
          text: evaluationText
        });
      }

      // Add image if requested
      if (includeImage) {
        const imageBuffer = await this.imageService.generateImage(moveResult.resultingFen);
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
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true,
        errorCode: ErrorCode.InvalidRequest
      };
    }
  }
} 