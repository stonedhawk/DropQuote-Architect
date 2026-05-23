declare module '@rahulmrx/game-ready-dictionary' {
  export class TrieEngine {
    constructor(data?: unknown);
    validate(word: string): boolean;
    isPrefix(prefix: string): boolean;
    getPrefixMatches(prefix: string, limit?: number): string[];
  }
}

declare module '@rahulmrx/game-ready-dictionary/data' {
  const content: unknown;
  export default content;
}
