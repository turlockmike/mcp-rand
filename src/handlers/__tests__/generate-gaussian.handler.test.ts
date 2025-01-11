import { generateGaussianHandler } from '../generate-gaussian.handler.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;

describe('generateGaussianHandler', () => {
  it('should generate a number between 0 and 1', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_gaussian',
        arguments: {}
      }
    };

    const result = await generateGaussianHandler(request);
    const number = parseFloat(result.content[0].text as string);
    
    expect(number).toBeGreaterThanOrEqual(0);
    expect(number).toBeLessThanOrEqual(1);
  });

  it('should generate different numbers on subsequent calls', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_gaussian',
        arguments: {}
      }
    };

    const result1 = await generateGaussianHandler(request);
    const result2 = await generateGaussianHandler(request);

    expect(result1.content[0].text).not.toBe(result2.content[0].text);
  });

  it('should follow a normal distribution', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_gaussian',
        arguments: {}
      }
    };

    // Generate a large sample to test distribution properties
    const samples = [];
    for (let i = 0; i < 1000; i++) {
      const result = await generateGaussianHandler(request);
      samples.push(parseFloat(result.content[0].text as string));
    }

    // Calculate mean (should be close to 0.5)
    const mean = samples.reduce((a, b) => a + b) / samples.length;
    expect(mean).toBeGreaterThan(0.4);
    expect(mean).toBeLessThan(0.6);

    // Calculate standard deviation (should be reasonable for normalized distribution)
    const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    expect(stdDev).toBeGreaterThan(0.1);
    expect(stdDev).toBeLessThan(0.3);
  });
});