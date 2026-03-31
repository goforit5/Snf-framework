declare module 'gremlin' {
  export namespace driver {
    class Client {
      constructor(url: string, options?: Record<string, unknown>);
      submit(query: string, bindings?: Record<string, unknown>): Promise<{ toArray(): Promise<unknown[]> }>;
      close(): Promise<void>;
    }
    class auth {
      static PlainTextSaslAuthenticator: new (username: string, password: string) => unknown;
    }
  }
  export namespace process {
    const t: Record<string, unknown>;
    const P: Record<string, unknown>;
    const order: Record<string, unknown>;
    const column: Record<string, unknown>;
  }
  export namespace structure {
    class Graph {}
  }
}
