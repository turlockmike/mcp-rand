import { CallToolRequestSchema, CallToolResultSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;
type CallToolResult = typeof CallToolResultSchema._output;

export const toolSpec = {
  name: 'generate_random_number',
  description: 'Generate a random number within a specified range',
  inputSchema: {
    type: 'object' as const,
    properties: {
      min: {
        type: 'number',
        description: 'Minimum value (inclusive). Defaults to 0.',
      },
      max: {
        type: 'number',
        description: 'Maximum value (inclusive). Defaults to 100.',
      },
    },
  }
};

export const generateRandomNumberHandler = async (
  request: CallToolRequest
): Promise<CallToolResult> => {
  const args = request.params.arguments as { min?: number; max?: number };
  const min = args.min ?? 0;
  const max = args.max ?? 100;

  if (min > max) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Min value cannot be greater than max value'
    );
  }

  // Generate random number between min and max (inclusive)
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  
  return {
    content: [
      {
        type: 'text',
        text: randomNumber.toString()
      }
    ]
  };
};