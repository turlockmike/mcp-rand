import { CallToolRequestSchema, CallToolResultSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

type CallToolRequest = typeof CallToolRequestSchema._output;
type CallToolResult = typeof CallToolResultSchema._output;

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string; // '2' through '10', 'J', 'Q', 'K', 'A'
}

export const toolSpec = {
  name: 'draw_cards',
  description: 'Draw cards from a standard deck of playing cards',
  inputSchema: {
    type: 'object' as const,
    properties: {
      count: {
        type: 'number',
        description: 'Number of cards to draw',
      },
      deckState: {
        type: 'string',
        description: 'Optional base64 encoded string representing the current deck state',
      }
    },
    required: ['count']
  }
};

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getCardIndex(card: Card): number {
  const suitIndex = SUITS.indexOf(card.suit);
  const valueIndex = VALUES.indexOf(card.value);
  return suitIndex * VALUES.length + valueIndex;
}

function getDeckStateFromCards(availableCards: Card[]): string {
  // Create a binary array where 1 represents available cards
  const binaryArray = new Uint8Array(7); // 52 bits rounded up to bytes
  for (const card of availableCards) {
    const index = getCardIndex(card);
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    binaryArray[byteIndex] |= 1 << bitIndex;
  }
  return Buffer.from(binaryArray).toString('base64');
}

function getAvailableCardsFromState(deckState: string): Card[] {
  try {
    const binaryArray = Buffer.from(deckState, 'base64');
    if (binaryArray.length !== 7) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid deck state: incorrect length'
      );
    }

    const availableCards: Card[] = [];
    for (let i = 0; i < 52; i++) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = i % 8;
      if ((binaryArray[byteIndex] & (1 << bitIndex)) !== 0) {
        const suitIndex = Math.floor(i / VALUES.length);
        const valueIndex = i % VALUES.length;
        availableCards.push({
          suit: SUITS[suitIndex],
          value: VALUES[valueIndex]
        });
      }
    }
    return availableCards;
  } catch (error) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid deck state: must be base64 encoded'
    );
  }
}

export const drawCardsHandler = async (
  request: CallToolRequest
): Promise<CallToolResult> => {
  const args = request.params.arguments as { count: number; deckState?: string };
  
  if (args.count <= 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Must draw at least one card'
    );
  }

  // Validate and process deck state if provided
  let availableCards: Card[];
  if (args.deckState) {
    // Validate base64 format
    if (!/^[A-Za-z0-9+/]+=*$/.test(args.deckState)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid deck state: must be base64 encoded'
      );
    }
    availableCards = getAvailableCardsFromState(args.deckState);
  } else {
    availableCards = createDeck();
  }

  if (args.count > availableCards.length) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Cannot draw ${args.count} cards from deck with ${availableCards.length} cards remaining`
    );
  }

  // Shuffle the available cards
  const shuffledCards = shuffleArray(availableCards);
  
  // Draw the requested number of cards
  const drawnCards = shuffledCards.slice(0, args.count);
  
  // Calculate remaining cards and get their state
  const remainingCards = shuffledCards.slice(args.count);
  const newDeckState = getDeckStateFromCards(remainingCards);

  const result = {
    drawnCards,
    remainingCount: remainingCards.length,
    deckState: newDeckState
  };
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
};