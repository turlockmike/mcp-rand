import { CallToolRequest, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';

export const toolSpec = {
  name: 'lookup_masters_position',
  description: 'Look up a chess position in the Lichess masters database',
  inputSchema: {
    type: 'object',
    properties: {
      fen: {
        type: 'string',
        description: 'Chess position in FEN notation',
      },
      play: {
        type: 'string',
        description: 'Moves played in UCI format (e.g., "e2e4 e7e5")',
      },
      since: {
        type: 'number',
        description: 'Filter games by minimum date (year)',
        minimum: 1952,
        maximum: 2024,
      },
      until: {
        type: 'number',
        description: 'Filter games by maximum date (year)',
        minimum: 1952,
        maximum: 2024,
      },
      moves: {
        type: 'number',
        description: 'Number of most common moves to return',
        minimum: 1,
        maximum: 12,
      },
      topGames: {
        type: 'number',
        description: 'Number of top games to return',
        minimum: 0,
        maximum: 4,
      },
    },
    required: ['fen'],
  },
};

interface MastersResponse {
  white: number;
  draws: number;
  black: number;
  moves: Array<{
    uci: string;
    san: string;
    white: number;
    draws: number;
    black: number;
    averageRating: number;
  }>;
  topGames: Array<{
    id: string;
    year: number;
    month: string;
    white: { name: string; rating: number };
    black: { name: string; rating: number };
    winner: 'white' | 'black' | 'draw';
    speed: string;
    mode: string;
    uci: string;
  }>;
}

export class MastersLookupHandler implements Handler<CallToolRequest> {
  async handle(request: CallToolRequest): Promise<any> {
    const { 
      fen,
      play,
      since,
      until,
      moves = 5,
      topGames = 2
    } = request.params.arguments as {
      fen: string;
      play?: string;
      since?: number;
      until?: number;
      moves?: number;
      topGames?: number;
    };

    try {
      // Build query parameters
      const params = new URLSearchParams({
        fen,
        moves: moves.toString(),
        topGames: topGames.toString(),
      });

      if (play) params.append('play', play);
      if (since) params.append('since', since.toString());
      if (until) params.append('until', until.toString());

      // Make request to Lichess API
      const response = await fetch(`https://explorer.lichess.ovh/masters?${params}`);
      
      if (!response.ok) {
        throw new Error(`Lichess API error: ${response.statusText}`);
      }

      const data = await response.json() as MastersResponse;

      // Format the response
      const totalGames = data.white + data.draws + data.black;
      const content: Array<any> = [];

      // Add summary
      content.push({
        type: 'text',
        text: `Position found in ${totalGames} master games:\n` +
              `White wins: ${data.white} (${((data.white / totalGames) * 100).toFixed(1)}%)\n` +
              `Draws: ${data.draws} (${((data.draws / totalGames) * 100).toFixed(1)}%)\n` +
              `Black wins: ${data.black} (${((data.black / totalGames) * 100).toFixed(1)}%)`
      });

      // Add most common moves
      if (data.moves.length > 0) {
        const movesText = data.moves.map(move => {
          const total = move.white + move.draws + move.black;
          const winRate = ((move.white + move.draws * 0.5) / total * 100).toFixed(1);
          return `${move.san} (${total} games, ${winRate}% score, avg rating ${move.averageRating})`;
        }).join('\n');

        content.push({
          type: 'text',
          text: `\nMost common moves:\n${movesText}`
        });
      }

      // Add recent master games
      if (data.topGames.length > 0) {
        const gamesText = data.topGames.map(game => {
          const result = game.winner === 'white' ? '1-0' : (game.winner === 'black' ? '0-1' : '½-½');
          return `${game.white.name} (${game.white.rating}) vs ${game.black.name} (${game.black.rating}), ${game.year} - ${result}`;
        }).join('\n');

        content.push({
          type: 'text',
          text: `\nRecent master games:\n${gamesText}`
        });
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