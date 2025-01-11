import { randomUUID } from 'crypto';
import { CallToolRequestSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;
type CallToolResult = typeof CallToolResultSchema._output;

export const toolSpec = {
  name: 'generate_uuid',
  description: 'Generate a random UUID v4',
  inputSchema: {
    type: 'object' as const,
    properties: {},
  }
};

export const generateUuidHandler = async (
  _request: CallToolRequest
): Promise<CallToolResult> => {
  const uuid = randomUUID();
  
  return {
    content: [
      {
        type: 'text',
        text: uuid
      }
    ]
  };
};