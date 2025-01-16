import type { Request } from '@modelcontextprotocol/sdk/types.js';

export interface Handler<T extends Request = Request> {
  (request: T): Promise<unknown>;
}

export interface HandlerRegistry {
  register(method: string, toolName: string, handler: Handler): void;
  get(method: string, toolName?: string): Handler | undefined;
}

export class SimpleHandlerRegistry implements HandlerRegistry {
  private handlers: Map<string, Map<string, Handler>> = new Map();

  register(method: string, toolName: string, handler: Handler): void {
    if (!this.handlers.has(method)) {
      this.handlers.set(method, new Map());
    }
    this.handlers.get(method)!.set(toolName, handler);
  }

  get(method: string, toolName?: string): Handler | undefined {
    const methodHandlers = this.handlers.get(method);
    if (!methodHandlers) return undefined;
    
    if (toolName) {
      return methodHandlers.get(toolName);
    }
    
    // For methods like 'tools/list' that don't need a specific tool name
    return methodHandlers.values().next().value;
  }
}
