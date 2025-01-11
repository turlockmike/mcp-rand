import { rollDiceHandler } from '../roll-dice.handler.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;

describe('rollDiceHandler', () => {
  it('should roll a single die', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['1d6']
        }
      }
    };

    const result = await rollDiceHandler(request);
    const roll = result.content[0].text as string;
    const parsed = JSON.parse(roll);
    
    expect(parsed).toHaveLength(1);
    expect(parsed[0].dice).toBe('1d6');
    expect(parsed[0].rolls).toHaveLength(1);
    expect(parsed[0].rolls[0]).toBeGreaterThanOrEqual(1);
    expect(parsed[0].rolls[0]).toBeLessThanOrEqual(6);
    expect(parsed[0].total).toBe(parsed[0].rolls[0]);
  });

  it('should roll multiple dice of the same type', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['3d6']
        }
      }
    };

    const result = await rollDiceHandler(request);
    const roll = result.content[0].text as string;
    const parsed = JSON.parse(roll);
    
    expect(parsed).toHaveLength(1);
    expect(parsed[0].dice).toBe('3d6');
    expect(parsed[0].rolls).toHaveLength(3);
    parsed[0].rolls.forEach((value: number) => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });
    expect(parsed[0].total).toBe(parsed[0].rolls.reduce((a: number, b: number) => a + b, 0));
  });

  it('should roll different types of dice', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['2d6', '1d20', '4d4']
        }
      }
    };

    const result = await rollDiceHandler(request);
    const roll = result.content[0].text as string;
    const parsed = JSON.parse(roll);
    
    expect(parsed).toHaveLength(3);
    
    // Check 2d6
    expect(parsed[0].dice).toBe('2d6');
    expect(parsed[0].rolls).toHaveLength(2);
    parsed[0].rolls.forEach((value: number) => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });
    
    // Check 1d20
    expect(parsed[1].dice).toBe('1d20');
    expect(parsed[1].rolls).toHaveLength(1);
    expect(parsed[1].rolls[0]).toBeGreaterThanOrEqual(1);
    expect(parsed[1].rolls[0]).toBeLessThanOrEqual(20);
    
    // Check 4d4
    expect(parsed[2].dice).toBe('4d4');
    expect(parsed[2].rolls).toHaveLength(4);
    parsed[2].rolls.forEach((value: number) => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(4);
    });

    // Check totals
    parsed.forEach((roll: { total: number; rolls: number[] }) => {
      expect(roll.total).toBe(roll.rolls.reduce((a: number, b: number) => a + b, 0));
    });
  });

  it('should throw error for invalid dice notation', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['invalid']
        }
      }
    };

    await expect(rollDiceHandler(request)).rejects.toThrow('Invalid dice notation');
  });

  it('should throw error for invalid number of dice', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['0d6']
        }
      }
    };

    await expect(rollDiceHandler(request)).rejects.toThrow('Number of dice must be positive');
  });

  it('should throw error for invalid die size', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['1d0']
        }
      }
    };

    await expect(rollDiceHandler(request)).rejects.toThrow('Die size must be positive');
  });

  it('should throw error if no dice specified', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: []
        }
      }
    };

    await expect(rollDiceHandler(request)).rejects.toThrow('Must specify at least one die to roll');
  });
});