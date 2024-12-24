import { ListToolsRequest } from '@modelcontextprotocol/sdk/types.js';
import { Handler } from './types.js';
import { toolSpec as evaluatePositionToolSpec } from './evaluate-position.handler.js';
import { toolSpec as generateImageToolSpec } from './generate-image.handler.js';
import { toolSpec as playMoveToolSpec } from './play-move.handler.js';
import { toolSpec as mastersLookupToolSpec } from './masters-lookup.handler.js';

export class ListToolsHandler implements Handler<ListToolsRequest> {
  async handle(): Promise<{
    tools: Array<{
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          [key: string]: {
            type: string;
            description: string;
            minimum?: number;
            maximum?: number;
            pattern?: string;
          };
        };
        required: string[];
      };
    }>;
  }> {
    return {
      tools: [
        evaluatePositionToolSpec,
        generateImageToolSpec,
        playMoveToolSpec,
        mastersLookupToolSpec
      ],
    };
  }
}
