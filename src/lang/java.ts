import { DocumentSymbol, SymbolKind } from 'vscode';
import { Style } from '../types/graph';
import { CssClass } from '../types/css-classes';
import { BaseLanguage } from './base';
import { LanguageConfig } from '../types/language';
import path from 'path';

/**
 * Implementation of Java language-specific processing
 */
export class JavaLanguage extends BaseLanguage {
    constructor() {
        super({
            id: 'java',
            name: 'Java',
            extensions: ['.java'],
            languageId: 'java',
            filePatterns: ['*.java']
        });
    }

  shouldFilterOutFile(filePath: string): boolean {
    try {
      if (!filePath) {
        throw new Error('Invalid file path: path is empty');
      }

      const fileName = path.basename(filePath).toLowerCase();
      return fileName.endsWith('test.java') || 
             fileName.endsWith('tests.java') || 
             fileName.endsWith('testcase.java') ||
             fileName.endsWith('suite.java') ||
             fileName === 'package-info.java' ||
             fileName === 'module-info.java';
    } catch (error) {
      throw this.createLanguageError(
        'shouldFilterOutFile',
        'Failed to check file filter',
        error instanceof Error ? error : undefined
      );
    }
  }

  getFileTitle(filePath: string): string {
    try {
      if (!filePath) {
        throw new Error('Invalid file path: path is empty');
      }

      const fileName = path.basename(filePath, '.java');
      const packageName = this.getPackageName(filePath);
      return packageName ? `${packageName}.${fileName}` : fileName;
    } catch (error) {
      throw this.createLanguageError(
        'getFileTitle',
        'Failed to get file title',
        error instanceof Error ? error : undefined
      );
    }
  }

  getSymbolStyle(kind: SymbolKind): Style {
    // Base style with Cell class that all symbols should have
    const baseStyle: Style = {
      classes: new Set([CssClass.Cell]),
      rounded: false
    };

    switch (kind) {
      case SymbolKind.Package:
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
          rounded: true,
          icon: 'I'
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
      case SymbolKind.Property:
        return {
          ...baseStyle,
          classes: new Set([CssClass.Cell, CssClass.Property, CssClass.Clickable])
        };
      default:
        return baseStyle;
    }
  }

  getSymbolTitle(symbol: DocumentSymbol): string {
    try {

      const accessModifier = this.getAccessModifier(symbol);
      const isStatic = this.isStatic(symbol);
      const isFinal = this.isFinal(symbol);
      const isAbstract = this.isAbstract(symbol);

      const modifiers = [
        accessModifier,
        isStatic ? 'static' : '',
        isFinal ? 'final' : '',
        isAbstract ? 'abstract' : ''
      ].filter(Boolean).join(' ');

      switch (symbol.kind) {
        case SymbolKind.Package:
          return `package ${symbol.name}`;
        case SymbolKind.Class:
          return `${modifiers} class ${symbol.name}`;
        case SymbolKind.Interface:
          return `${modifiers} interface ${symbol.name}`;
        case SymbolKind.Enum:
          return `${modifiers} enum ${symbol.name}`;
        case SymbolKind.Method:
          return `${modifiers} ${symbol.name}${symbol.detail || ''}`;
        case SymbolKind.Constructor:
          return `${accessModifier} ${symbol.name}${symbol.detail || ''}`;
        case SymbolKind.Field:
          return `${modifiers} ${symbol.name}`;
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

  filterSymbol(symbol: DocumentSymbol): boolean {
    try {
      // Filter out private members
      if (this.isPrivate(symbol)) {
        return false;
      }

      switch (symbol.kind) {
        case SymbolKind.Variable:
        case SymbolKind.Constant:
        case SymbolKind.EnumMember:
          return false;
        default:
          // Filter out test classes and methods
          if (symbol.kind === SymbolKind.Class || 
              symbol.kind === SymbolKind.Method) {
            const name = symbol.name.toLowerCase();
            return !name.includes('test') && !name.endsWith('suite');
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

  protected highlightCell(symbol: DocumentSymbol): void {
    try {
      // Add Java-specific highlighting logic here
    } catch (error) {
      throw this.createLanguageError(
        'highlightCell',
        'Failed to highlight cell',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extract package name from file path
   */
  private getPackageName(filePath: string): string | undefined {
    try {
      const parts = filePath.split(path.sep);
      const srcIndex = parts.findIndex(part => part === 'src' || part === 'main' || part === 'java');
      if (srcIndex >= 0) {
        return parts.slice(srcIndex + 1, -1).join('.');
      }
      return undefined;
    } catch (error) {
      throw this.createLanguageError(
        'getPackageName',
        'Failed to get package name',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if a symbol has private access
   */
  private isPrivate(symbol: DocumentSymbol): boolean {
    return symbol.detail?.includes('private') || false;
  }

  /**
   * Get access modifier for a symbol
   */
  private getAccessModifier(symbol: DocumentSymbol): string {
    if (symbol.detail?.includes('private')) return 'private';
    if (symbol.detail?.includes('protected')) return 'protected';
    if (symbol.detail?.includes('public')) return 'public';
    return '';
  }

  /**
   * Check if a symbol is static
   */
  private isStatic(symbol: DocumentSymbol): boolean {
    return symbol.detail?.includes('static') || false;
  }

  /**
   * Check if a symbol is final
   */
  private isFinal(symbol: DocumentSymbol): boolean {
    return symbol.detail?.includes('final') || false;
  }

  /**
   * Check if a symbol is abstract
   */
  private isAbstract(symbol: DocumentSymbol): boolean {
    return symbol.detail?.includes('abstract') || false;
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
   * Extract symbols from Java source
   */
  protected async extractSymbols(document: { getText(): string }): Promise<DocumentSymbol[]> {
    try {
      const text = document.getText();
      // TODO: Implement Java parser
      return [];
    } catch (error) {
      throw this.createLanguageError(
        'extractSymbols',
        'Failed to parse Java file',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * @inheritdoc
   */
  async getSymbols(document: { getText(): string }): Promise<DocumentSymbol[]> {
    try {
      // TODO: Implement Java-specific symbol extraction
      // This is part of the language support migration
      // For now, return empty array as we migrate the implementation
      return this.extractSymbols(document);
    } catch (error) {
      throw this.createLanguageError(
        'getSymbols',
        'Failed to extract symbols from Java document',
        error instanceof Error ? error : undefined
      );
    }
  }
}