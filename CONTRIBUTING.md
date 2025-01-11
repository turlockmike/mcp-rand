# Contributing to MCP Rand

We welcome contributions to MCP Rand! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-rand.git
cd mcp-rand
```

2. Install dependencies:
```bash
npm install
```

## Development Commands

```bash
# Build the project
npm run build

# Watch mode during development
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Start the server
npm start
```

## Adding New Tools

1. Create a new handler file in `src/handlers/`
2. Create corresponding test file in `src/handlers/__tests__/`
3. Add handler exports to `src/handlers/index.ts`
4. Register the tool in `src/index.ts`
5. Update documentation in README.md

## Code Style

- Use TypeScript for all new code
- Follow existing patterns for handler implementation
- Include comprehensive tests for all functionality
- Document all public interfaces and tools

## Testing

- Write tests for all new functionality
- Ensure all tests pass before submitting PR
- Include edge cases and error conditions
- Test files should be named `*.test.ts`

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Update documentation
4. Run tests
5. Submit PR with description of changes

## License

By contributing, you agree that your contributions will be licensed under the ISC License.