import { DocumentSymbol, Position, CallHierarchyItem } from 'vscode';

/**
 * File outline containing symbols and metadata
 */
export interface FileOutline {
  id: number;
  path: string;  // Always stored as filesystem path
  symbols: DocumentSymbol[];
}

/**
 * Symbol location in a file
 */
export class SymbolLocation {
  constructor(
    public readonly path: string,
    public readonly line: number,
    public readonly character: number
  ) {}

  /**
   * Convert to location ID tuple
   */
  locationId(files: Map<string, FileOutline>): [number, number, number] | undefined {
    // Convert URI to filesystem path if needed
    const fsPath = this.path.startsWith('file:') 
      ? decodeURIComponent(this.path.slice('file://'.length))
      : this.path;
    
    console.log('[SymbolLocation] Looking up file:', fsPath);
    const file = files.get(fsPath);
    if (!file) {
      console.log('[SymbolLocation] File not found. Available files:', Array.from(files.keys()));
      return undefined;
    }
    return [file.id, this.line, this.character];
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `${this.path}:${this.line}:${this.character}`;
  }
}

/**
 * Convert call hierarchy item to location ID
 */
export function callItemToLocationId(
  item: CallHierarchyItem,
  files: Map<string, FileOutline>
): [number, number, number] | undefined {
  const fsPath = item.uri.fsPath;  // Use fsPath which is already normalized
  console.log('[CallItem] Looking up file:', fsPath);
  const file = files.get(fsPath);
  if (!file) {
    console.log('[CallItem] File not found. Available files:', Array.from(files.keys()));
    return undefined;
  }
  return [file.id, item.range.start.line, item.range.start.character];
}
