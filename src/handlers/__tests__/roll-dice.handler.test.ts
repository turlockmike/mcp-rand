import { rollDiceHandler } from '../roll-dice.handler.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;

describe('rollDiceHandler', () => {
  it('should roll a single die with no modifier', async () => {
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

  it('should handle positive modifiers', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['2d6+5']
        }
      }
    };

    const result = await rollDiceHandler(request);
    const roll = result.content[0].text as string;
    const parsed = JSON.parse(roll);
    
    expect(parsed).toHaveLength(1);
    expect(parsed[0].dice).toBe('2d6+5');
    expect(parsed[0].rolls).toHaveLength(2);
    parsed[0].rolls.forEach((value: number) => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });
    const rollSum = parsed[0].rolls.reduce((a: number, b: number) => a + b, 0);
    expect(parsed[0].modifier).toBe(5);
    expect(parsed[0].total).toBe(rollSum + 5);
  });

  it('should handle negative modifiers', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['3d4-2']
        }
      }
    };

    const result = await rollDiceHandler(request);
    const roll = result.content[0].text as string;
    const parsed = JSON.parse(roll);
    
    expect(parsed).toHaveLength(1);
    expect(parsed[0].dice).toBe('3d4-2');
    expect(parsed[0].rolls).toHaveLength(3);
    parsed[0].rolls.forEach((value: number) => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(4);
    });
    const rollSum = parsed[0].rolls.reduce((a: number, b: number) => a + b, 0);
    expect(parsed[0].modifier).toBe(-2);
    expect(parsed[0].total).toBe(rollSum - 2);
  });

  it('should handle multiple dice with modifiers', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['2d6+3', '1d20-1', '4d4+5']
        }
      }
    };

    const result = await rollDiceHandler(request);
    const roll = result.content[0].text as string;
    const parsed = JSON.parse(roll);
    
    expect(parsed).toHaveLength(3);
    
    // Check 2d6+3
    expect(parsed[0].dice).toBe('2d6+3');
    expect(parsed[0].rolls).toHaveLength(2);
    expect(parsed[0].modifier).toBe(3);
    const sum1 = parsed[0].rolls.reduce((a: number, b: number) => a + b, 0);
    expect(parsed[0].total).toBe(sum1 + 3);
    
    // Check 1d20-1
    expect(parsed[1].dice).toBe('1d20-1');
    expect(parsed[1].rolls).toHaveLength(1);
    expect(parsed[1].modifier).toBe(-1);
    expect(parsed[1].total).toBe(parsed[1].rolls[0] - 1);
    
    // Check 4d4+5
    expect(parsed[2].dice).toBe('4d4+5');
    expect(parsed[2].rolls).toHaveLength(4);
    expect(parsed[2].modifier).toBe(5);
    const sum3 = parsed[2].rolls.reduce((a: number, b: number) => a + b, 0);
    expect(parsed[2].total).toBe(sum3 + 5);
  });

  it('should throw error for invalid modifier format', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'roll_dice',
        arguments: {
          dice: ['2d6++5']
        }
      }
    };

    await expect(rollDiceHandler(request)).rejects.toThrow('Invalid dice notation');
  });
});