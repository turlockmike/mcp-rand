import { drawCardsHandler } from '../draw-cards.handler.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

interface DrawCardsResponse {
  drawnCards: Array<{ suit: string; value: string }>;
  remainingCount: number;
  deckState: string;
}

describe('drawCardsHandler', () => {
  const createRequest = (args: Record<string, unknown>) => ({
    method: 'tools/call',
    params: {
      name: 'draw_cards',
      arguments: args
    }
  } as typeof CallToolRequestSchema._output);

  it('should draw specified number of cards from a fresh deck', async () => {
    const request = createRequest({ count: 5 });
    const result = await drawCardsHandler(request);
    const response = JSON.parse(result.content[0].text as string) as DrawCardsResponse;

    expect(response.drawnCards).toHaveLength(5);
    expect(response.remainingCount).toBe(47);
    expect(response.deckState).toMatch(/^[A-Za-z0-9+/]+=*$/); // base64 pattern
    
    // Verify the deck state represents 47 cards by drawing remaining cards
    const remainingRequest = createRequest({ count: 47, deckState: response.deckState });
    const remainingResult = await drawCardsHandler(remainingRequest);
    const remainingResponse = JSON.parse(remainingResult.content[0].text as string) as DrawCardsResponse;
    expect(remainingResponse.drawnCards).toHaveLength(47);
  });

  it('should draw cards using provided deck state', async () => {
    // First draw 42 cards to get a deck with 10 cards remaining
    const initialRequest = createRequest({ count: 42 });
    const initialResult = await drawCardsHandler(initialRequest);
    const initialResponse = JSON.parse(initialResult.content[0].text as string) as DrawCardsResponse;
    
    // Now draw 3 from the remaining 10
    const request = createRequest({ count: 3, deckState: initialResponse.deckState });
    const result = await drawCardsHandler(request);
    const response = JSON.parse(result.content[0].text as string) as DrawCardsResponse;

    expect(response.drawnCards).toHaveLength(3);
    expect(response.remainingCount).toBe(7);
    expect(response.deckState).toMatch(/^[A-Za-z0-9+/]+=*$/); // base64 pattern
    
    // Verify we can draw the remaining 7 cards
    const finalRequest = createRequest({ count: 7, deckState: response.deckState });
    const finalResult = await drawCardsHandler(finalRequest);
    const finalResponse = JSON.parse(finalResult.content[0].text as string) as DrawCardsResponse;
    expect(finalResponse.drawnCards).toHaveLength(7);
  });

  it('should throw error when trying to draw too many cards', async () => {
    const request = createRequest({ count: 53 });
    await expect(drawCardsHandler(request)).rejects.toThrow('Cannot draw 53 cards');
  });

  it('should throw error when count is not positive', async () => {
    const request = createRequest({ count: 0 });
    await expect(drawCardsHandler(request)).rejects.toThrow('Must draw at least one card');
  });

  it('should throw error with invalid deck state', async () => {
    const request = createRequest({ count: 1, deckState: 'not-base64!' });
    await expect(drawCardsHandler(request)).rejects.toThrow('Invalid deck state: must be base64 encoded');
  });

  it('should validate drawn cards have valid suits and values', async () => {
    const request = createRequest({ count: 52 }); // Draw entire deck
    const result = await drawCardsHandler(request);
    const response = JSON.parse(result.content[0].text as string) as DrawCardsResponse;

    const validSuits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const validValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    // Check each card has valid suit and value
    response.drawnCards.forEach(card => {
      expect(validSuits).toContain(card.suit);
      expect(validValues).toContain(card.value);
    });

    // Verify we got all 52 unique cards
    const cardStrings = response.drawnCards.map(card => 
      `${card.value}-${card.suit}`
    );
    const uniqueCards = new Set(cardStrings);
    expect(uniqueCards.size).toBe(52);
  });
});