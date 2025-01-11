import { ListToolsRequestSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { toolSpec as generateUuidToolSpec } from './generate-uuid.handler.js';
import { toolSpec as generateRandomNumberToolSpec } from './generate-random-number.handler.js';
import { toolSpec as generateGaussianToolSpec } from './generate-gaussian.handler.js';
import { toolSpec as generateStringToolSpec } from './generate-string.handler.js';
import { toolSpec as generatePasswordToolSpec } from './generate-password.handler.js';
import { toolSpec as rollDiceToolSpec } from './roll-dice.handler.js';
import { toolSpec as drawCardsToolSpec } from './draw-cards.handler.js';

type ListToolsRequest = typeof ListToolsRequestSchema._output;
type ListToolsResult = typeof ListToolsResultSchema._output;

export const ListToolsHandler = async (
  _request: ListToolsRequest
): Promise<ListToolsResult> => {
  return {
    tools: [
      generateUuidToolSpec,
      generateRandomNumberToolSpec,
      generateGaussianToolSpec,
      generateStringToolSpec,
      generatePasswordToolSpec,
      rollDiceToolSpec,
      drawCardsToolSpec
    ]
  };
};
