import { SymbolKind, DocumentSymbol, CallHierarchyItem, CallHierarchyIncomingCall, CallHierarchyOutgoingCall, Location, LocationLink, Uri, Range as VSCodeRange, Position as VSCodePosition } from 'vscode';
export {CallHierarchyItem, CallHierarchyIncomingCall, CallHierarchyOutgoingCall, Location};
export { SymbolKind, DocumentSymbol };

/**
 * Type guard to ensure a number is non-negative
 */
function isNonNegative(n: number): boolean {
  return typeof n === 'number' && !isNaN(n) && n >= 0;
}

/**
 * Position in a text document
 */
export interface Position extends VSCodePosition {
  line: number;
  character: number;
}

/**
 * Type guard to check if an object is a valid Position
 */
export function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== 'object') return false;
  const pos = value as Position;
  return (
    isNonNegative(pos.line) &&
    isNonNegative(pos.character)
  );
}

/**
 * Create a new Position with validation
 * @throws {Error} If line or character is negative
 */
export function createPosition(line: number, character: number): Position {
  if (!isNonNegative(line)) {
    throw new Error(`Invalid line number: ${line}`);
  }
  if (!isNonNegative(character)) {
    throw new Error(`Invalid character number: ${character}`);
  }
  return new VSCodePosition(line, character);
}

/**
 * Range in a text document
 */
export interface Range extends VSCodeRange {
  start: Position;
  end: Position;
}

/**
 * Type guard to check if an object is a valid Range
 */
export function isRange(value: unknown): value is Range {
  if (!value || typeof value !== 'object') return false;
  const range = value as Range;
  return (
    isPosition(range.start) &&
    isPosition(range.end)
  );
}

/**
 * Create a new Range with validation
 * @throws {Error} If start or end positions are invalid
 */
export function createRange(start: Position, end: Position): Range {
  if (!isPosition(start)) {
    throw new Error('Invalid start position');
  }
  if (!isPosition(end)) {
    throw new Error('Invalid end position');
  }
  return new VSCodeRange(start, end);
}

/**
 * Type guard to check if a number is a valid SymbolKind
 */
export function isSymbolKind(value: number): value is SymbolKind {
  return Object.values(SymbolKind).includes(value);
}

/**
 * Symbol tags to provide extra metadata
 */
export enum SymbolTag {
  /** Render a symbol as obsolete, usually using a strike-out */
  Deprecated = 1
}

/**
 * Type guard to check if a number is a valid SymbolTag
 */
export function isSymbolTag(value: number): value is SymbolTag {
  return Object.values(SymbolTag).includes(value);
}

/**
 * Type guard to check if an object is a valid DocumentSymbol
 */
export function isDocumentSymbol(value: unknown): value is DocumentSymbol {
  if (!value || typeof value !== 'object') return false;
  const symbol = value as DocumentSymbol;
  return (
    typeof symbol.name === 'string' &&
    typeof symbol.detail === 'string' &&
    isSymbolKind(symbol.kind) &&
    isRange(symbol.range) &&
    isRange(symbol.selectionRange) &&
    (!symbol.children || Array.isArray(symbol.children) && symbol.children.every(isDocumentSymbol))
  );
}

/**
 * Type guard to check if a value is a valid Uri
 */
export function isUri(value: unknown): value is Uri | string {
  if (typeof value === 'string') return true;
  if (!value || typeof value !== 'object') return false;
  const uri = value as Uri;
  return typeof uri.path === 'string';
}

/**
 * Convert a string or Uri to a Uri object
 */
export function toUri(uri: string | Uri): Uri {
  if (typeof uri === 'string') {
    const uriObject = {
      scheme: 'file',
      authority: '',
      path: uri,
      query: '',
      fragment: '',
      fsPath: uri,
      toString: () => uri,
      toJSON: () => ({ scheme: 'file', path: uri }),
      with: function(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
        return toUri({
          scheme: change.scheme ?? this.scheme,
          authority: change.authority ?? this.authority,
          path: change.path ?? this.path,
          query: change.query ?? this.query,
          fragment: change.fragment ?? this.fragment,
          fsPath: change.path ?? this.fsPath,
          toString: this.toString,
          toJSON: this.toJSON,
          with: this.with
        });
      }
    };
    return uriObject;
  }
  return uri;
}

/**
 * Create a Uri from a string path
 */
export function createUri(path: string): Uri {
  return toUri(path);
}

/**
 * Type guard to check if an object is a valid Location
 */
export function isLocation(value: unknown): value is Location {
  if (!value || typeof value !== 'object') return false;
  const loc = value as Location;
  return isUri(loc.uri) && isRange(loc.range);
}

/**
 * Create a new Location with validation
 */
export function createLocation(uri: Uri | string, range: Range): Location {
  if (!isUri(uri)) throw new Error('Invalid URI');
  if (!isRange(range)) throw new Error('Invalid range');
  return { uri: toUri(uri), range };
}

/**
 * Type guard to check if an object is a valid LocationLink
 */
export function isLocationLink(value: unknown): value is LocationLink {
  if (!value || typeof value !== 'object') return false;
  const link = value as LocationLink;
  return (
    isUri(link.targetUri) &&
    isRange(link.targetRange) &&
    isRange(link.targetSelectionRange) &&
    (!link.originSelectionRange || isRange(link.originSelectionRange))
  );
}

/**
 * Create a CallHierarchyItem with proper URI handling
 */
export function createCallHierarchyItem(
  name: string,
  kind: SymbolKind,
  uri: Uri | string,
  range: Range,
  selectionRange: Range,
  detail?: string,
  tags?: SymbolTag[],
  data?: unknown
): CallHierarchyItem {
  return {
    name,
    kind,
    uri: toUri(uri),
    range,
    selectionRange,
    detail,
    tags
  };
}

/**
 * Utility type to extract the keys of an object type that have a specific type
 */
export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];

/**
 * Utility type to make all properties of a type required
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Utility type to make all properties of a type optional
 */
export type Optional<T> = {
  [P in keyof T]+?: T[P];
};

/**
 * Utility type to make all properties of a type readonly
 */
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
