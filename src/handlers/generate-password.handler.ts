import { CallToolRequestSchema, CallToolResultSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;
type CallToolResult = typeof CallToolResultSchema._output;

const MIN_LENGTH = 8;
const DEFAULT_LENGTH = 16;

const charsets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '!@#$%^&*()_+-=[]{};\'"\\|,.<>/?'
};

export const toolSpec = {
  name: 'generate_password',
  description: 'Generate a strong password with a mix of character types. WARNING: While this password is generated locally on your machine, it is recommended to use a dedicated password manager for generating and storing passwords securely.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      length: {
        type: 'number',
        description: `Password length (minimum ${MIN_LENGTH}, default ${DEFAULT_LENGTH})`,
      }
    }
  }
};

function shuffleString(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
}

function generateStrongPassword(length: number): string {
  if (length < MIN_LENGTH) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Password length must be at least ${MIN_LENGTH} characters`
    );
  }

  // Ensure at least one character from each set
  let password = '';
  password += charsets.uppercase[Math.floor(Math.random() * charsets.uppercase.length)];
  password += charsets.lowercase[Math.floor(Math.random() * charsets.lowercase.length)];
  password += charsets.numbers[Math.floor(Math.random() * charsets.numbers.length)];
  password += charsets.special[Math.floor(Math.random() * charsets.special.length)];

  // Fill the rest with random characters from all sets
  const allChars = Object.values(charsets).join('');
  while (password.length < length) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle to avoid predictable pattern of character types
  return shuffleString(password);
}

export const generatePasswordHandler = async (
  request: CallToolRequest
): Promise<CallToolResult> => {
  const args = request.params.arguments as { length?: number };
  const length = args.length ?? DEFAULT_LENGTH;
  
  const password = generateStrongPassword(length);
  
  return {
    content: [
      {
        type: 'text',
        text: password
      }
    ]
  };
};