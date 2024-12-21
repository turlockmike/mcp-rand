import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ChessServer } from '../index.js';

interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
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
    
    // Start the server with in-memory transport
    await server.run(serverTransport);
    
    // Create and connect the client
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    await client.connect(clientTransport);
  }, 30000);

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
}); 