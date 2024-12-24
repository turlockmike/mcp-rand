import { MastersLookupHandler } from '../masters-lookup.handler.js';
import { toolSpec } from '../masters-lookup.handler.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { jest } from '@jest/globals';

describe('MastersLookupHandler', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn() as unknown as typeof global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.resetAllMocks();
    });

    it('should handle successful masters position lookup', async () => {
        const mockResponse = {
            white: 100,
            draws: 50,
            black: 50,
            moves: [{
                uci: 'e2e4',
                san: 'e4',
                white: 40,
                draws: 20,
                black: 20,
                averageRating: 2500
            }],
            topGames: [{
                id: '123',
                year: 2023,
                month: 'January',
                white: { name: 'Player1', rating: 2700 },
                black: { name: 'Player2', rating: 2650 },
                winner: 'white',
                speed: 'classical',
                mode: 'rated',
                uci: 'e2e4'
            }]
        };

        const mockJsonPromise = Promise.resolve(mockResponse);
        const mockFetchPromise = Promise.resolve({
            ok: true,
            json: () => mockJsonPromise,
            statusText: 'OK'
        } as Response);
        (global.fetch as jest.Mock).mockReturnValue(mockFetchPromise);

        const handler = new MastersLookupHandler();
        const result = await handler.handle({
            method: 'tools/call',
            params: {
                name: toolSpec.name,
                arguments: {
                    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
                }
            }
        });

        const totalGames = mockResponse.white + mockResponse.draws + mockResponse.black;
        expect(result.content).toHaveLength(3);
        expect(result.content[0].text).toContain(`Position found in ${totalGames} master games`);
        expect(result.content[1].text).toContain('e4');
        expect(result.content[2].text).toContain('Player1');
    });

    it('should handle API error', async () => {
        const mockFetchPromise = Promise.resolve({
            ok: false,
            statusText: 'Not Found'
        } as Response);
        (global.fetch as jest.Mock).mockReturnValue(mockFetchPromise);

        const handler = new MastersLookupHandler();
        const result = await handler.handle({
            method: 'tools/call',
            params: {
                name: toolSpec.name,
                arguments: {
                    fen: 'invalid-fen'
                }
            }
        });

        expect(result.isError).toBe(true);
        expect(result.errorCode).toBe(ErrorCode.InvalidRequest);
        expect(result.content[0].text).toBe(`Error: Lichess API error: Not Found`);
    });

    it('should handle optional parameters', async () => {
        const mockJsonPromise = Promise.resolve({
            white: 100,
            draws: 50,
            black: 50,
            moves: [],
            topGames: []
        });
        const mockFetchPromise = Promise.resolve({
            ok: true,
            json: () => mockJsonPromise
        } as Response);
        (global.fetch as jest.Mock).mockReturnValue(mockFetchPromise);

        const handler = new MastersLookupHandler();
        await handler.handle({
            method: 'tools/call',
            params: {
                name: toolSpec.name,
                arguments: {
                    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                    since: 2000,
                    until: 2023,
                    moves: 10,
                    topGames: 4,
                    play: 'e2e4 e7e5'
                }
            }
        });

        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const url = fetchCalls[0][0] as string;
        expect(url).toMatch(/since=2000/);
        expect(url).toMatch(/until=2023/);
        expect(url).toMatch(/moves=10/);
        expect(url).toMatch(/topGames=4/);
        expect(url).toMatch(/play=e2e4\+e7e5/);
    });
}); 