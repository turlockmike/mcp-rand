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
    
    // Verify the tools array exists
    expect(tools).toHaveProperty('tools');
    expect(Array.isArray(tools.tools)).toBe(true);

    // Verify each tool has the required structure
    tools.tools.forEach(tool => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
      expect(tool.inputSchema).toHaveProperty('properties');
      expect(tool.inputSchema).toHaveProperty('required');
      expect(Array.isArray(tool.inputSchema.required)).toBe(true);
    });

    // Verify specific tools exist
    expect(tools.tools.find(t => t.name === 'evaluate_chess_position')).toBeDefined();
    expect(tools.tools.find(t => t.name === 'generate_chess_position_image')).toBeDefined();
    expect(tools.tools.find(t => t.name === 'play_chess_move')).toBeDefined();
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
