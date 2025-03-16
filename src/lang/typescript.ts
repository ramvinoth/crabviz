import { BaseLanguage } from './base';

/**
 * TypeScript language implementation
 */
class TypeScriptLanguage extends BaseLanguage {
  constructor() {
    super({
      id: 'typescript',
      name: 'TypeScript',
      extensions: ['.ts', '.tsx'],
      languageId: 'typescript',
      filePatterns: ['*.ts', '*.tsx']
    });
  }
}
