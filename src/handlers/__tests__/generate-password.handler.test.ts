import { generatePasswordHandler } from '../generate-password.handler.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;

describe('generatePasswordHandler', () => {
  it('should generate a password with default length', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_password',
        arguments: {}
      }
    };

    const result = await generatePasswordHandler(request);
    const password = result.content[0].text as string;
    
    expect(password.length).toBe(16); // Default length
    // Should contain at least one of each required character type
    expect(password).toMatch(/[A-Z]/); // uppercase
    expect(password).toMatch(/[a-z]/); // lowercase
    expect(password).toMatch(/[0-9]/); // number
    expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/); // special
  });

  it('should generate a password with specified length', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_password',
        arguments: {
          length: 24
        }
      }
    };

    const result = await generatePasswordHandler(request);
    const password = result.content[0].text as string;
    
    expect(password.length).toBe(24);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/);
  });

  it('should generate different passwords on subsequent calls', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_password',
        arguments: {}
      }
    };

    const result1 = await generatePasswordHandler(request);
    const result2 = await generatePasswordHandler(request);

    expect(result1.content[0].text).not.toBe(result2.content[0].text);
  });

  it('should throw error for length less than minimum', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'generate_password',
        arguments: {
          length: 7
        }
      }
    };

    await expect(generatePasswordHandler(request)).rejects.toThrow('Password length must be at least 8 characters');
  });

});