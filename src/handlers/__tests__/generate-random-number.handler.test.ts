import { generateRandomNumberHandler } from '../generate-random-number.handler.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;

describe('generateRandomNumberHandler', () => {
  it('should generate a random number within the specified range', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_random_number',
        arguments: {
          min: 1,
          max: 100
        }
      }
    };

    const result = await generateRandomNumberHandler(request);
    const number = parseInt(result.content[0].text as string);
    
    expect(number).toBeGreaterThanOrEqual(1);
    expect(number).toBeLessThanOrEqual(100);
  });

  it('should generate different numbers on subsequent calls', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_random_number',
        arguments: {
          min: 1,
          max: 1000000 // Large range to minimize chance of random same numbers
        }
      }
    };

    const result1 = await generateRandomNumberHandler(request);
    const result2 = await generateRandomNumberHandler(request);

    expect(result1.content[0].text).not.toBe(result2.content[0].text);
  });

  it('should handle default values when no arguments provided', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_random_number',
        arguments: {}
      }
    };

    const result = await generateRandomNumberHandler(request);
    const number = parseInt(result.content[0].text as string);
    
    expect(number).toBeGreaterThanOrEqual(0);
    expect(number).toBeLessThanOrEqual(100);
  });

  it('should throw error if min is greater than max', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_random_number',
        arguments: {
          min: 100,
          max: 1
        }
      }
    };

    await expect(generateRandomNumberHandler(request)).rejects.toThrow('Min value cannot be greater than max value');
  });
});