import { DocumentSymbol, SymbolKind } from 'vscode';
import { TableNode, TableSection, Cell, Style, CellPosition } from '../types/graph';
import { CssClass } from '../types/css-classes';
import { FileOutline } from '../generator/types';
import { Language, LanguageConfig } from '../types/language';
import path from 'path';

/**
 * Base language implementation
 */
export abstract class BaseLanguage implements Language {
  constructor(readonly config: LanguageConfig) {}

  /**
   * Create language error
   */
  createLanguageError(method: string, message: string, cause?: Error): Error {
    const fullMessage = `${this.config.name}.${method}: ${message}${cause ? ` (${cause.message})` : ''}`;
    const error = new Error(fullMessage);
    if (cause) {
      error.cause = cause;
    }
    return error;
  }

  /**
   * Check if file should be included in graph
   */
  isValidFile(filePath: string): boolean {
    try {
      return this.config.extensions.some(ext => filePath.endsWith(`${ext}`));
    } catch (error) {
      throw this.createLanguageError('isValidFile', 'Failed to check if file is valid', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get file title without extension
   */
  getFileTitle(filePath: string): string {
    // Get basename and remove extension to match Rust implementation
    const basename = path.basename(filePath);
    const extname = path.extname(basename);
    return path.basename(filePath, extname);
  }

  /**
   * Convert file to table representation
   */
  fileRepr(file: FileOutline): TableNode {
    const symbols = file.symbols.filter(symbol => this.filterSymbol(symbol));
    
    const sections: TableSection[] = [{
      id: `${file.id}_main`,
      label: 'Main',
      cells: symbols.map((symbol, idx) => this.symbolRepr(file.id, symbol, { row: idx, col: 0 }))
    }];

    return {
      id: file.id,
      label: this.getFileTitle(file.path),
      sections,
      cssClass: CssClass.Module
    };
  }

  /**
   * Convert symbol to cell representation
   */
  protected symbolRepr(fileId: number, symbol: DocumentSymbol, position: CellPosition): Cell {
    console.log('[Language] Creating cell for symbol:', {
      fileId,
      symbolName: symbol.name,
      symbolKind: symbol.kind,
      position,
      range: [symbol.selectionRange.start.line, symbol.selectionRange.start.character]
    });

    const style = this.getSymbolStyle(symbol.kind);
    const children = symbol.children
      ?.filter(s => symbol.kind === SymbolKind.Interface || this.filterSymbol(s))
      .map((s, idx) => this.symbolRepr(fileId, s, { row: idx, col: position.col + 1 })) ?? [];

    const cell: Cell = {
      title: symbol.name,  // Use raw symbol name as in Rust
      style,
      children,
      position,
      range_start: [symbol.selectionRange.start.line, symbol.selectionRange.start.character],
      range_end: [symbol.selectionRange.end.line, symbol.selectionRange.end.character]
    };

    // Log if we're creating a cell without a title
    if (!cell.title) {
      console.warn('[Language] Created cell without title:', {
        fileId,
        symbolKind: symbol.kind,
        position,
        range: cell.range_start
      });
    }

    return cell;
  }

  /**
   * Filter symbol
   */
  protected filterSymbol(symbol: DocumentSymbol): boolean {
    switch (symbol.kind) {
      case SymbolKind.Constant:
      case SymbolKind.Variable:
      case SymbolKind.Field:
      case SymbolKind.EnumMember:
        return false;
      default:
        return true;
    }
  }

  /**
   * Get style for symbol kind
   */
  protected getSymbolStyle(kind: SymbolKind): Style {
    // Base style with Cell class that all symbols should have
    const baseStyle: Style = {
      classes: new Set([CssClass.Cell]),
      rounded: false
    };

    switch (kind) {
      case SymbolKind.Module:
      case SymbolKind.Package:
      case SymbolKind.Namespace:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Module]),
          rounded: true
        };

      case SymbolKind.Interface:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Interface, CssClass.Clickable]),
          border: 0,
          rounded: true
        };

      case SymbolKind.Function:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Function, CssClass.Clickable]),
          rounded: true
        };

      case SymbolKind.Method:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Method, CssClass.Clickable]),
          rounded: true
        };

      case SymbolKind.Constructor:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Constructor, CssClass.Clickable]),
          rounded: true
        };

      case SymbolKind.Property:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Property, CssClass.Clickable])
        };

      case SymbolKind.Class:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Type]),
          icon: 'C'
        };

      case SymbolKind.Enum:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Type]),
          icon: 'E'
        };

      case SymbolKind.Struct:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Type]),
          icon: 'S'
        };

      default:
        return baseStyle;
    }
  }

  /**
   * Get symbol title
   */
  protected getSymbolTitle(symbol: DocumentSymbol): string {
    return symbol.name;  // Match Rust implementation exactly
  }
}