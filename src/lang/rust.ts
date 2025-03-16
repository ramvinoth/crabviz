import { DocumentSymbol, SymbolKind } from 'vscode';
import { Style } from '../types/graph';
import { CssClass } from '../types/css-classes';
import { BaseLanguage } from './base';
import path from 'path';
import { parseRustFile } from '../parser/rust';

/**
 * Implementation of Rust language-specific processing
 */
export class RustLanguage extends BaseLanguage {
  constructor() {
    super({
      id: 'rust',
      name: 'Rust',
      extensions: ['.rs'],
      languageId: 'rust',
      filePatterns: ['*.rs']
    });
  }

  /**
   * @inheritdoc
   */
  shouldFilterOutFile(filePath: string): boolean {
    try {
      if (!filePath) {
        throw new Error('Invalid file path: path is empty');
      }

      const fileName = path.basename(filePath).toLowerCase();
      return fileName.startsWith('test_') || fileName.endsWith('_test.rs') || fileName === 'lib.rs';
    } catch (error) {
      throw this.createLanguageError(
        'shouldFilterOutFile',
        'Failed to check file filter',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * @inheritdoc
   */
  getFileTitle(filePath: string): string {
    try {
      if (!filePath) {
        throw new Error('Invalid file path: path is empty');
      }

      return path.basename(filePath, '.rs');
    } catch (error) {
      throw this.createLanguageError(
        'getFileTitle',
        'Failed to get file title',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * @inheritdoc
   */
  getSymbolStyle(kind: SymbolKind): Style {
    try {
      // Base style with Cell class that all symbols should have
      const baseStyle: Style = {
        classes: new Set([CssClass.Cell]),
        rounded: false
      };

      switch (kind) {
        case SymbolKind.Module:
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
        case SymbolKind.Class:
          return {
            ...baseStyle,
            classes: new Set([CssClass.Cell, CssClass.Type]),
            icon: 'C'
          };
        default:
          return baseStyle;
      }
    } catch (error) {
      throw this.createLanguageError(
        'getSymbolStyle',
        'Failed to get symbol style',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * @inheritdoc
   */
  getSymbolTitle(symbol: DocumentSymbol): string {
    try {
      switch (symbol.kind) {
        case SymbolKind.Module:
          return `mod ${symbol.name}`;
        case SymbolKind.Struct:
          return `struct ${symbol.name}`;
        case SymbolKind.Enum:
          return `enum ${symbol.name}`;
        case SymbolKind.Interface:
        case SymbolKind.TypeParameter:
          return `type ${symbol.name}`;
        case SymbolKind.Function:
          return `fn ${symbol.name}`;
        case SymbolKind.Method:
          return `impl ${symbol.detail || ''} fn ${symbol.name}`;
        default:
          return symbol.name;
      }
    } catch (error) {
      throw this.createLanguageError(
        'getSymbolTitle',
        'Failed to get symbol title',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * @inheritdoc
   */
  filterSymbol(symbol: DocumentSymbol): boolean {
    try {

      switch (symbol.kind) {
        case SymbolKind.Constant:
        case SymbolKind.Variable:
        case SymbolKind.Field:
        case SymbolKind.EnumMember:
          return false;
        default:
          // Filter out test modules and functions
          if (symbol.kind === SymbolKind.Module || symbol.kind === SymbolKind.Function) {
            return !symbol.name.toLowerCase().includes('test');
          }
          return true;
      }
    } catch (error) {
      throw this.createLanguageError(
        'filterSymbol',
        'Failed to filter symbol',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * @inheritdoc
   */
  async getSymbols(document: { getText(): string }): Promise<DocumentSymbol[]> {
    try {
      const text = document.getText();
      const symbols = await this.extractSymbols(document);
      return symbols;
    } catch (error) {
      throw this.createLanguageError(
        'getSymbols',
        'Failed to extract symbols from Rust document',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get text content of a file
   */
  async getText(uri: string): Promise<string> {
    try {
      // In real implementation, this would use VS Code's workspace API
      return '';
    } catch (error) {
      throw this.createLanguageError(
        'getText',
        'Failed to read file content',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extract symbols from Rust source
   */
  protected async extractSymbols(document: { getText(): string }): Promise<DocumentSymbol[]> {
    try {
      const text = document.getText();
      const symbols = await parseRustFile(text);
      return symbols;
    } catch (error) {
      throw this.createLanguageError(
        'extractSymbols',
        'Failed to parse Rust file',
        error instanceof Error ? error : undefined
      );
    }
  }
}
