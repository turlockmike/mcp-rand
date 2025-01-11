import type { Request } from '@modelcontextprotocol/sdk/types.js';

export interface Handler<T extends Request = Request> {
  (request: T): Promise<unknown>;
}

export interface HandlerRegistry {
  register(method: string, handler: Handler): void;
  get(method: string): Handler | undefined;
}

export class SimpleHandlerRegistry implements HandlerRegistry {
  private handlers: Map<string, Handler> = new Map();

  register(method: string, handler: Handler): void {
    this.handlers.set(method, handler);
  }

  get(method: string): Handler | undefined {
    return this.handlers.get(method);
  }
}
