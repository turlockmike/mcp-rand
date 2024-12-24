import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ImageContent } from '@modelcontextprotocol/sdk/types.js';
import { ChessServer } from '../index.js';

interface ToolResponse {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mediaType?: string;
    resource?: {
      uri: string;
      text: string;
    };
  }>;
  isError?: boolean;
}

describe('ChessServer', () => {
  let server: ChessServer;
  let client: Client;
  let serverTransport: InMemoryTransport;
  let clientTransport: InMemoryTransport;

  beforeAll(async () => {
    server = new ChessServer();
    [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    await Promise.all([
      server.run(serverTransport),
      client.connect(clientTransport)
    ]);
  }, 60000);

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it('should list available tools', async () => {
    const tools = await client.listTools();
    expect(tools).toEqual({
      tools: [
        {
          name: 'evaluate_chess_position',
          description: 'Evaluate a chess position using Stockfish engine',
          inputSchema: {
            type: 'object',
            properties: {
              fen: {
                type: 'string',
                description: 'Chess position in FEN notation',
              },
              depth: {
                type: 'number',
                description: 'Search depth (1-20)',
                minimum: 1,
                maximum: 20,
              },
              numMoves: {
                type: 'number',
                description: 'Number of best moves to return',
                minimum: 0,
                maximum: 10,
              },
              timeLimit: {
                type: 'number',
                description: 'Time limit in milliseconds (default: 1000)',
                minimum: 100,
                maximum: 10000,
              },
              includeImage: {
                type: 'boolean',
                description: 'Whether to include an image of the position in the response',
              },
            },
            required: ['fen'],
          },
        },
        {
          name: 'generate_chess_position_image',
          description: 'Generate an image of a chess position',
          inputSchema: {
            type: 'object',
            properties: {
              fen: {
                type: 'string',
                description: 'Chess position in FEN notation',
              },
              size: {
                type: 'number',
                description: 'Size of the board in pixels (default: 400)',
                minimum: 200,
                maximum: 1000,
              },
              light: {
                type: 'string',
                description: 'Light square color in hex (default: #FFFFFF)',
                pattern: '^#[0-9a-fA-F]{6}$',
              },
              dark: {
                type: 'string',
                description: 'Dark square color in hex (default: #4B7399)',
                pattern: '^#[0-9a-fA-F]{6}$',
              },
            },
            required: ['fen'],
          },
        },
      ],
    });
  });

  it('should get best moves for a position', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await client.callTool({
      name: 'evaluate_chess_position',
      arguments: {
        fen: startingPosition,
        depth: 10,
        numMoves: 3,
        timeLimit: 1000
      }
    }) as ToolResponse;

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBeDefined();
    const moves = JSON.parse(result.content[0].text!);
    expect(moves).toHaveProperty('moves');
    expect(Array.isArray(moves.moves)).toBe(true);
    expect(moves.moves.length).toBeLessThanOrEqual(3);
    expect(result.isError).toBeFalsy();
  });

  it('should evaluate starting position', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await client.callTool({
      name: 'evaluate_chess_position',
      arguments: {
        fen: startingPosition,
        depth: 1,
      }
    }) as ToolResponse;

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/Evaluation: [-\d.]+ pawns/);
    expect(result.isError).toBeFalsy();
  }, 10000);

  it('should evaluate position with image', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await client.callTool({
      name: 'evaluate_chess_position',
      arguments: {
        fen: startingPosition,
        depth: 1,
        includeImage: true
      }
    }) as ToolResponse;

    expect(result.content).toHaveLength(2);
    // Check evaluation text
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/Evaluation: [-\d.]+ pawns/);
    // Check image
    const imageContent = result.content[1] as ImageContent;
    expect(imageContent.type).toBe('image');
    expect(imageContent.data).toBeDefined();
    expect(imageContent.mimeType).toBe('image/png');
    expect(imageContent.data).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
    expect(result.isError).toBeFalsy();
  }, 10000);

  it('should handle invalid FEN', async () => {
    const result = await client.callTool({
      name: 'evaluate_chess_position',
      arguments: {
        fen: 'invalid-fen',
      }
    }) as ToolResponse;

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/Error: Invalid FEN position/);
    expect(result.isError).toBeTruthy();
  });

  it('should handle invalid tool name', async () => {
    await expect(client.callTool({
      name: 'nonexistent_tool',
      arguments: {}
    })).rejects.toThrow('Unknown tool: nonexistent_tool');
  });

  it('should generate chess position image', async () => {
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await client.callTool({
      name: 'generate_chess_position_image',
      arguments: {
        fen: startingPosition,
      }
    }) as ToolResponse;

    expect(result.content).toHaveLength(1);
    const content = result.content[0] as ImageContent;
    expect(content.type).toBe('image');
    expect(content.data).toBeDefined();
    expect(content.mimeType).toBe('image/png');
    expect(content.data).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
    expect(result.isError).toBeFalsy();
  });
});
