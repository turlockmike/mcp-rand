import { ListToolsRequestSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { toolSpec as generateUuidToolSpec } from './generate-uuid.handler.js';

type ListToolsRequest = typeof ListToolsRequestSchema._output;
type ListToolsResult = typeof ListToolsResultSchema._output;

export const ListToolsHandler = async (
  _request: ListToolsRequest
): Promise<ListToolsResult> => {
  return {
    tools: [
      generateUuidToolSpec
    ]
  };
};
