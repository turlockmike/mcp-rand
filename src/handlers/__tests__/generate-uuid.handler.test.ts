import { generateUuidHandler } from '../generate-uuid.handler.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;

describe('generateUuidHandler', () => {
  it('should generate a valid UUID v4', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_uuid',
        arguments: {}
      }
    };

    const result = await generateUuidHandler(request);
    
    // UUID v4 format: 8-4-4-4-12 characters
    expect(result.content[0].text).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should generate different UUIDs on subsequent calls', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_uuid',
        arguments: {}
      }
    };

    const result1 = await generateUuidHandler(request);
    const result2 = await generateUuidHandler(request);

    expect(result1.content[0].text).not.toBe(result2.content[0].text);
  });
});