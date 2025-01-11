import { CallToolRequestSchema, CallToolResultSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;
type CallToolResult = typeof CallToolResultSchema._output;

interface DiceRoll {
  dice: string;
  rolls: number[];
  total: number;
}

export const toolSpec = {
  name: 'roll_dice',
  description: 'Roll a set of dice using standard dice notation (e.g., "2d6" for two six-sided dice)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      dice: {
        type: 'array',
        items: {
          type: 'string',
          description: 'Dice notation (e.g., "2d6", "1d20", "4d4")'
        },
        description: 'Array of dice to roll'
      }
    },
    required: ['dice']
  }
};

function parseDiceNotation(notation: string): { count: number; sides: number } {
  const match = notation.toLowerCase().match(/^(\d+)d(\d+)$/);
  if (!match) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid dice notation'
    );
  }

  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);

  if (count <= 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Number of dice must be positive'
    );
  }

  if (sides <= 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Die size must be positive'
    );
  }

  return { count, sides };
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function rollDiceSet(notation: string): DiceRoll {
  const { count, sides } = parseDiceNotation(notation);
  const rolls = Array.from({ length: count }, () => rollDie(sides));
  const total = rolls.reduce((a, b) => a + b, 0);

  return {
    dice: notation,
    rolls,
    total
  };
}

export const rollDiceHandler = async (
  request: CallToolRequest
): Promise<CallToolResult> => {
  const args = request.params.arguments as { dice: string[] };
  
  if (!args.dice || args.dice.length === 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Must specify at least one die to roll'
    );
  }

  const results = args.dice.map(dice => rollDiceSet(dice));
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }
    ]
  };
};