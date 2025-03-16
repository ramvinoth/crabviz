import { DocumentSymbol, Position, CallHierarchyIncomingCall, CallHierarchyOutgoingCall, Location } from '../types/lsp-types';
import { GraphGenerator } from '../index';

declare global {
  interface Window {
    onerror: OnErrorEventHandler;
  }
}

type OnErrorEventHandler = ((event: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) => void) | null;

// Declare Node.js process for development mode check
declare const process: {
  env: {
    NODE_ENV: string;
  };
};

/**
 * WebAssembly interface for the graph generator
 * This class provides a TypeScript-friendly wrapper around the WebAssembly module
 */
export class GraphGeneratorWasm {
  private generator: GraphGenerator;

  /**
   * Initialize the graph generator
   * @param root Root directory path
   * @param lang Language identifier
   */
  constructor(root: string, lang: string) {
    this.generator = new GraphGenerator(root, lang);
    this.setupErrorHandling();
  }

  /**
   * Set up error handling for WebAssembly
   */
  private setupErrorHandling(): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.onerror = (event: string | Event, source?: string, line?: number, column?: number, error?: Error) => {
        const message = event instanceof Event ? event.type : event;
        console.error('WebAssembly Error:', {
          message,
          source,
          line,
          column,
          error
        });
      };
    }
  }

  /**
   * Check if a file should be filtered out
   */
  shouldFilterOutFile(filePath: string): boolean {
    try {
      return this.generator.shouldFilterOutFile(filePath);
    } catch (error) {
      console.error('Error in shouldFilterOutFile:', error);
      return false;
    }
  }

  /**
   * Add a file to the generator
   */
  addFile(filePath: string, symbols: DocumentSymbol[]): boolean {
    try {
      return this.generator.addFile(filePath, symbols);
    } catch (error) {
      console.error('Error in addFile:', error);
      return false;
    }
  }

  /**
   * Add incoming calls for a symbol
   */
  addIncomingCalls(
    filePath: string,
    position: Position,
    calls: CallHierarchyIncomingCall[]
  ): void {
    try {
      this.generator.addIncomingCalls(filePath, position, calls);
    } catch (error) {
      console.error('Error in addIncomingCalls:', error);
    }
  }

  /**
   * Add outgoing calls for a symbol
   */
  addOutgoingCalls(
    filePath: string,
    position: Position,
    calls: CallHierarchyOutgoingCall[]
  ): void {
    try {
      this.generator.addOutgoingCalls(filePath, position, calls);
    } catch (error) {
      console.error('Error in addOutgoingCalls:', error);
    }
  }

  /**
   * Add interface implementations for a symbol
   */
  addInterfaceImplementations(
    filePath: string,
    position: Position,
    locations: Location[]
  ): void {
    try {
      this.generator.addInterfaceImplementations(filePath, position, locations);
    } catch (error) {
      console.error('Error in addInterfaceImplementations:', error);
    }
  }

  /**
   * Highlight a symbol in the graph
   */
  highlight(filePath: string, position: Position): void {
    try {
      this.generator.highlight(filePath, position);
    } catch (error) {
      console.error('Error in highlight:', error);
    }
  }

  /**
   * Generate DOT source for the graph
   */
  generateDotSource(): string {
    try {
      return this.generator.generateDotSource();
    } catch (error) {
      console.error('Error in generateDotSource:', error);
      return '';
    }
  }
}

// Export the class as the default export for WebAssembly
export default GraphGeneratorWasm;
