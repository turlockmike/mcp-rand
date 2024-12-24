import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
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
    // Create transports first
    [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    
    // Create and connect the client
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    await client.connect(clientTransport);

    // Create and start the server last
    server = new ChessServer();
    
    // Set NODE_ENV to test to use mock server for components
    process.env.NODE_ENV = 'test';
    await server.run(serverTransport);
  }, 60000); // Increase timeout to 60 seconds

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (server) {
      await server.close();
    }
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

  it('should detect mate in one', async () => {
    // Scholar's mate position
    const mateInOne = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
    const result = await client.callTool({
      name: 'evaluate_chess_position',
      arguments: {
        fen: mateInOne,
        depth: 5,
      }
    }) as ToolResponse;

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('Mate in 1 moves for white');
    expect(result.isError).toBeFalsy();
  }, 15000);

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
    const content = result.content[0];
    expect(content.type).toBe('resource');
    expect(content.resource).toBeDefined();
    const resource = content.resource!;
    expect(resource.uri).toMatch(/^data:image\/png;base64,/);
    expect(resource.text).toBe('Chess position image');
    expect(result.isError).toBeFalsy();
  });
}); 