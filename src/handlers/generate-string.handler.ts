import { CallToolRequestSchema, CallToolResultSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;
type CallToolResult = typeof CallToolResultSchema._output;

type CharsetType = 'alphanumeric' | 'numeric' | 'lowercase' | 'uppercase' | 'special';

const charsets: Record<CharsetType, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  numeric: '0123456789',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  special: '!@#$%^&*()_+-=[]{};\'"\\|,.<>/?'
};

export const toolSpec = {
  name: 'generate_string',
  description: 'Generate a random string with specified length and character set',
  inputSchema: {
    type: 'object' as const,
    properties: {
      length: {
        type: 'number',
        description: 'Length of the string to generate. Defaults to 10.',
      },
      charset: {
        type: 'string',
        description: 'Character set to use (alphanumeric, numeric, lowercase, uppercase, special). Defaults to alphanumeric.',
        enum: ['alphanumeric', 'numeric', 'lowercase', 'uppercase', 'special']
      }
    }
  }
};

function generateRandomString(length: number, charset: string): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
}

export const generateStringHandler = async (
  request: CallToolRequest
): Promise<CallToolResult> => {
  const args = request.params.arguments as { length?: number; charset?: CharsetType };
  const length = args.length ?? 10;
  const charsetType = args.charset ?? 'alphanumeric';

  if (length <= 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Length must be a positive number'
    );
  }

  if (!Object.keys(charsets).includes(charsetType)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid charset specified'
    );
  }

  const randomString = generateRandomString(length, charsets[charsetType]);
  
  return {
    content: [
      {
        type: 'text',
        text: randomString
      }
    ]
  };
};