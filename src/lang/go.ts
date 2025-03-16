import { DocumentSymbol, SymbolKind, Location } from 'vscode';
import { BaseLanguage } from './base';
import { Language, LanguageConfig } from '../types/language';
import { Cell, Style } from '../types/graph';
import { CssClass } from '../types/css-classes';

/**
 * Go language implementation
 */
export class GoLanguage extends BaseLanguage implements Language {
  constructor(config: LanguageConfig) {
    super(config);
  }

  getConfig(): LanguageConfig {
    return {
      id: 'go',
      name: 'Go',
      extensions: ['.go'],
      languageId: 'go',
      filePatterns: ['*.go']
    };
  }

  async getText(uri: string): Promise<string> {
    try {
      // TODO: Implement Go-specific file reading
      return '';
    } catch (error) {
      throw this.createLanguageError(
        'getText',
        'Failed to read file content',
        error instanceof Error ? error : undefined
      );
    }
  }

  protected async extractSymbols(document: { getText(): string }): Promise<DocumentSymbol[]> {
    try {
      // TODO: Implement Go symbol extraction
      return [];
    } catch (error) {
      throw this.createLanguageError(
        'extractSymbols',
        'Failed to extract symbols',
        error instanceof Error ? error : undefined
      );
    }
  }

  getSymbolStyle(kind: SymbolKind): Style {
    const classes = new Set<CssClass>();

    switch (kind) {
      case 2: // SymbolKind.Module
        classes.add(CssClass.Module);
        break;
      case 5: // SymbolKind.Class
        classes.add(CssClass.Type);
        break;
      case 6: // SymbolKind.Interface
        classes.add(CssClass.Interface);
        break;
      case 12: // SymbolKind.Function
        classes.add(CssClass.Function);
        break;
      case 13: // SymbolKind.Variable
        classes.add(CssClass.Type);
        break;
      case 14: // SymbolKind.Constant
        classes.add(CssClass.Type);
        break;
    }

    return {
      classes,
      rounded: true,
      border: 1
    };
  }

  highlightCell(cell: Cell): Cell {
    const style = cell.style || { classes: new Set() };
    style.classes.add(CssClass.Highlight);
    return {
      ...cell,
      style
    };
  }

  shouldFilterOutFile(filePath: string): boolean {
    return filePath.endsWith('_test.go') || filePath.includes('vendor/');
  }

  async getImplementations(symbol: DocumentSymbol): Promise<Location[]> {
    try {
      // TODO: Implement Go-specific implementation finding
      return [];
    } catch (error) {
      throw this.createLanguageError(
        'getImplementations',
        'Failed to get implementations',
        error instanceof Error ? error : undefined
      );
    }
  }
}
