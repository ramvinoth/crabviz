import { DocumentSymbol, Position, CallHierarchyItem } from '../../types/lsp-types';

/**
 * Represents a file outline in the codebase
 */
export interface FileOutline {
  id: number;
  path: string;
  symbols: DocumentSymbol[];
}

/**
 * Represents a location of a symbol in the codebase
 */
export class SymbolLocation {
  constructor(
    public readonly path: string,
    public readonly line: number,
    public readonly character: number
  ) {}

  /**
   * Create a SymbolLocation from a Position
   */
  static fromPosition(path: string, position: Position): SymbolLocation {
    return new SymbolLocation(path, position.line, position.character);
  }

  /**
   * Convert to a location ID tuple
   */
  toLocationId(files: Map<string, FileOutline>): [number, number, number] | undefined {
    const file = files.get(this.path);
    if (!file) return undefined;
    return [file.id, this.line, this.character];
  }
}

/**
 * Convert a CallHierarchyItem to a location ID tuple
 */
export function toLocationId(
  item: CallHierarchyItem,
  files: Map<string, FileOutline>
): [number, number, number] | undefined {
  const file = files.get(typeof item.uri === 'string' ? item.uri : item.uri.path);
  if (!file) return undefined;
  return [file.id, item.range.start.line, item.range.start.character];
}
