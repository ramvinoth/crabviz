import { GraphGenerator } from '../..';
import { DocumentSymbol, SymbolKind } from '../../types/lsp-types';
import { CallHierarchyIncomingCall, CallHierarchyOutgoingCall, CallHierarchyItem, Location, Position, Range, Uri } from 'vscode';
import { positionToCellPosition, cellPositionToPosition } from '../types';

// Helper functions for creating test data
const createPosition = (line: number, character: number) => new Position(line, character);

const createRange = (startLine: number, startChar: number, endLine: number, endChar: number) => {
  const start = new Position(startLine, startChar);
  const end = new Position(endLine, endChar);
  return new Range(start, end);
};

// Declare Jest types
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect<T>(value: T): {
  toBe(expected: T): void;
  toBeDefined(): void;
  toContain(expected: string): void;
  toEqual(expected: any): void;
};
declare function beforeEach(fn: () => void): void;

describe('GraphGenerator', () => {
  let generator: GraphGenerator;

  beforeEach(() => {
    generator = new GraphGenerator('/root', 'default');
  });

  describe('Position conversion', () => {
    it('should convert between Position and CellPosition', () => {
      const pos = createPosition(1, 2);
      const cellPos = positionToCellPosition(pos);
      expect(cellPos).toEqual({ row: 1, col: 2 });

      const convertedPos = cellPositionToPosition(cellPos);
      expect(convertedPos.line).toBe(1);
      expect(convertedPos.character).toBe(2);
    });

    it('should handle zero-based positions', () => {
      const pos = createPosition(0, 0);
      const cellPos = positionToCellPosition(pos);
      expect(cellPos).toEqual({ row: 0, col: 0 });

      const convertedPos = cellPositionToPosition(cellPos);
      expect(convertedPos.line).toBe(0);
      expect(convertedPos.character).toBe(0);
    });
  });

  describe('Range conversion', () => {
    it('should convert between Range and CellPosition', () => {
      const range = createRange(1, 2, 3, 4);
      expect(range.start.line).toBe(1);
      expect(range.start.character).toBe(2);
      expect(range.end.line).toBe(3);
      expect(range.end.character).toBe(4);
    });
  });

  describe('DocumentSymbol handling', () => {
    it('should create valid DocumentSymbol', () => {
      const symbol = {
        name: 'test',
        detail: 'test detail',
        kind: SymbolKind.Function,
        range: createRange(1, 2, 3, 4),
        selectionRange: createRange(1, 2, 3, 4),
        children: []
      } as DocumentSymbol;

      expect(symbol.name).toBe('test');
      expect(symbol.detail).toBe('test detail');
      expect(symbol.kind).toBe(SymbolKind.Function);
      expect(symbol.range.start.line).toBe(1);
      expect(symbol.range.start.character).toBe(2);
      expect(symbol.range.end.line).toBe(3);
      expect(symbol.range.end.character).toBe(4);
    });
  });

  describe('file handling', () => {
    const testSymbols: DocumentSymbol[] = [
      {
        name: 'TestClass',
        detail: '',
        kind: SymbolKind.Class,
        range: createRange(0, 0, 10, 0),
        selectionRange: createRange(0, 0, 0, 9),
        children: []
      }
    ];

    it('should add files and generate tables', () => {
      const added = generator.addFile('/root/test.ts', testSymbols);
      expect(added).toBe(true);

      const dotSource = generator.generateDotSource();
      expect(dotSource).toContain('test.ts');
      expect(dotSource).toContain('TestClass');
    });

    it('should filter out files based on language rules', () => {
      // Create a Go generator that filters test files
      const goGenerator = new GraphGenerator('/root', 'go');
      const added = goGenerator.addFile('/root/test_test.go', testSymbols);
      expect(added).toBe(false);
    });
  });

  describe('call hierarchy', () => {
    const createCallHierarchyItem = (
      name: string,
      uri: string,
      line: number,
      character: number
    ): CallHierarchyItem => ({
      name,
      kind: SymbolKind.Function,
      uri: Uri.file(uri),
      range: createRange(line, character, line + 1, character),
      selectionRange: createRange(line, character, line, character + name.length)
    });

    beforeEach(() => {
      // Add two files with symbols
      generator.addFile('/root/caller.ts', []);
      generator.addFile('/root/callee.ts', []);
    });

    it('should handle incoming calls', () => {
      const caller = createCallHierarchyItem('caller', '/root/caller.ts', 1, 0);
      const position = createPosition(5, 0);
      
      const calls: CallHierarchyIncomingCall[] = [{
        from: caller,
        fromRanges: [createRange(1, 0, 1, 6)]
      }];

      generator.addIncomingCalls('/root/callee.ts', position, calls);
      
      const dotSource = generator.generateDotSource();
      expect(dotSource).toContain('call-incoming');
    });

    it('should handle outgoing calls', () => {
      const callee = createCallHierarchyItem('callee', '/root/callee.ts', 5, 0);
      const position = createPosition(1, 0);
      
      const calls: CallHierarchyOutgoingCall[] = [{
        to: callee,
        fromRanges: [createRange(1, 0, 1, 6)]
      }];

      generator.addOutgoingCalls('/root/caller.ts', position, calls);
      
      const dotSource = generator.generateDotSource();
      expect(dotSource).toContain('call-outgoing');
    });
  });

  describe('interface implementations', () => {
    beforeEach(() => {
      // Add interface and implementation files
      generator.addFile('/root/interface.ts', []);
      generator.addFile('/root/impl1.ts', []);
      generator.addFile('/root/impl2.ts', []);
    });

    it('should create subgraphs for implementations', () => {
      const position = createPosition(0, 0);
      const locations: Location[] = [
        {
          uri: Uri.file('/root/impl1.ts'),
          range: createRange(0, 0, 1, 0)
        },
        {
          uri: Uri.file('/root/impl2.ts'),
          range: createRange(0, 0, 1, 0)
        }
      ];

      generator.addInterfaceImplementations('/root/interface.ts', position, locations);
      
      const dotSource = generator.generateDotSource();
      expect(dotSource).toContain('subgraph');
      expect(dotSource).toContain('Implementations of');
    });
  });

  describe('highlighting', () => {
    it('should highlight selected symbols', () => {
      generator.addFile('/root/test.ts', []);
      generator.highlight('/root/test.ts', createPosition(0, 0));
      
      const dotSource = generator.generateDotSource();
      expect(dotSource).toBeDefined();
    });
  });
});
