import { DocumentSymbol, SymbolKind } from 'vscode';
import { Style } from '../types/graph';
import { CssClass } from '../types/css-classes';
import { BaseLanguage } from './base';
import path from 'path';

/**
 * Implementation of Python language-specific processing
 */
export class PythonLanguage extends BaseLanguage {
    constructor() {
        super({
            id: 'python',
            name: 'Python',
            extensions: ['.py'],
            languageId: 'python',
            filePatterns: ['*.py']
        });
    }

  shouldFilterOutFile(filePath: string): boolean {
    try {
      if (!filePath) {
        throw new Error('Invalid file path: path is empty');
      }

      const fileName = path.basename(filePath).toLowerCase();
      return fileName.startsWith('test_') || 
             fileName.endsWith('_test.py') || 
             fileName === '__init__.py';
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw this.createLanguageError(
            'shouldFilterOutFile',
            'Failed to check file filter',
            error
        )
      } else {
        throw error;
      }
    }
  }

  getFileTitle(filePath: string): string {
    try {
      if (!filePath) {
        throw new Error('Invalid file path: path is empty');
      }
      return path.basename(filePath, '.py');
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw this.createLanguageError(
          'getFileTitle',
          'Failed to get file title',
          error
        );
      } else {
        throw error;
      }
    }
  }

  protected getSymbolStyle(kind: SymbolKind): Style {
    switch (kind) {
      case SymbolKind.Module:
        return {
          rounded: true,
          classes: new Set([CssClass.Cell, CssClass.Module])
        };
      case SymbolKind.Function:
        return {
          rounded: true,
          classes: new Set([CssClass.Cell, CssClass.Function, CssClass.Clickable])
        };
      case SymbolKind.Method:
        return {
          rounded: true,
          classes: new Set([CssClass.Cell, CssClass.Method, CssClass.Clickable])
        };
      case SymbolKind.Constructor:
        return {
          rounded: true,
          classes: new Set([CssClass.Cell, CssClass.Constructor, CssClass.Clickable])
        };
      case SymbolKind.Class:
        return {
          icon: 'C',
          classes: new Set([CssClass.Cell, CssClass.Type])
        };
      case SymbolKind.Property:
        return {
          icon: 'p',
          classes: new Set([CssClass.Cell, CssClass.Property])
        };
      default:
        return {
          rounded: true,
          classes: new Set([CssClass.Cell])
        };
    }
  }

  getSymbolTitle(symbol: DocumentSymbol): string {
    try {

      switch (symbol.kind) {
        case SymbolKind.Module:
          return symbol.name;
        case SymbolKind.Class:
          return `class ${symbol.name}`;
        case SymbolKind.Function:
          return `def ${symbol.name}`;
        case SymbolKind.Method:
          return `def ${symbol.name}`;
        case SymbolKind.Constructor:
          return `def __init__`;
        default:
          return symbol.name;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw this.createLanguageError(
          'getSymbolTitle',
          'Failed to get symbol title',
          error
        );
      } else {
        throw error;
      }
    }
  }

  filterSymbol(symbol: DocumentSymbol): boolean {
    try {

      switch (symbol.kind) {
        case SymbolKind.Variable:
        case SymbolKind.Constant:
        case SymbolKind.Field:
          return false;
        default:
          // Filter out test functions and classes
          if (symbol.kind === SymbolKind.Function || 
              symbol.kind === SymbolKind.Class || 
              symbol.kind === SymbolKind.Module) {
            return !symbol.name.toLowerCase().includes('test');
          }
          return true;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw this.createLanguageError(
          'filterSymbol',
          'Failed to filter symbol',
          error
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Get text content of a file
   */
  async getText(uri: string): Promise<string> {
    try {
      // In real implementation, this would use VS Code's workspace API
      return '';
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw this.createLanguageError(
          'getText',
          'Failed to read file content',
          error
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Extract symbols from Python source
   */
  protected async extractSymbols(document: { getText(): string }): Promise<DocumentSymbol[]> {
    try {
      const text = document.getText();
      // TODO: Implement Python parser
      return [];
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw this.createLanguageError(
          'extractSymbols',
          'Failed to parse Python file',
          error
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * @inheritdoc
   */
  async getSymbols(document: { getText(): string }): Promise<DocumentSymbol[]> {
    try {
      console.log('[Python Language] Extracting symbols from document');
      const symbols = await this.extractSymbols(document);
      console.log('[Python Language] Extracted symbols:', symbols.length);
      return symbols;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw this.createLanguageError(
          'getSymbols',
          'Failed to extract symbols from Python document',
          error
        );
      } else {
        throw error;
      }
    }
  }

  protected highlightCell(symbol: DocumentSymbol): void {
    try {
      console.log('[Python Language] Highlighting cell for symbol:', symbol.name);
      // Add Python-specific highlighting logic here
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw this.createLanguageError(
          'highlightCell',
          'Failed to highlight cell',
          error
        );
      } else {
        throw error;
      }
    }
  }
}