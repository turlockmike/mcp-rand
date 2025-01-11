import { generateStringHandler } from '../generate-string.handler.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;

describe('generateStringHandler', () => {
  it('should generate a string with default length and charset', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {}
      }
    };

    const result = await generateStringHandler(request);
    const str = result.content[0].text as string;
    
    expect(str.length).toBe(10); // Default length
    expect(str).toMatch(/^[A-Za-z0-9]+$/); // Default charset (alphanumeric)
  });

  it('should generate a string with specified length', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {
          length: 20
        }
      }
    };

    const result = await generateStringHandler(request);
    const str = result.content[0].text as string;
    
    expect(str.length).toBe(20);
    expect(str).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should generate a string with specified charset', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {
          charset: 'numeric'
        }
      }
    };

    const result = await generateStringHandler(request);
    const str = result.content[0].text as string;
    
    expect(str).toMatch(/^[0-9]+$/);
  });

  it('should generate different strings on subsequent calls', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {}
      }
    };

    const result1 = await generateStringHandler(request);
    const result2 = await generateStringHandler(request);

    expect(result1.content[0].text).not.toBe(result2.content[0].text);
  });

  it('should handle lowercase charset', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {
          charset: 'lowercase'
        }
      }
    };

    const result = await generateStringHandler(request);
    const str = result.content[0].text as string;
    
    expect(str).toMatch(/^[a-z]+$/);
  });

  it('should handle uppercase charset', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {
          charset: 'uppercase'
        }
      }
    };

    const result = await generateStringHandler(request);
    const str = result.content[0].text as string;
    
    expect(str).toMatch(/^[A-Z]+$/);
  });

  it('should handle special charset', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {
          charset: 'special'
        }
      }
    };

    const result = await generateStringHandler(request);
    const str = result.content[0].text as string;
    
    expect(str).toMatch(/^[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/);
  });

  it('should throw error for invalid length', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {
          length: -1
        }
      }
    };

    await expect(generateStringHandler(request)).rejects.toThrow('Length must be a positive number');
  });

  it('should throw error for invalid charset', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_string',
        arguments: {
          charset: 'invalid'
        }
      }
    };

    await expect(generateStringHandler(request)).rejects.toThrow('Invalid charset specified');
  });
});