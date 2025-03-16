import { Language } from '../types/language';
export { BaseLanguage } from './base';
import { PythonLanguage } from './python';
import { JavaLanguage } from './java';
import { GoLanguage } from './go';
import { RustLanguage } from './rust';

/**
 * Language registry
 */
const languages = new Map<string, Language>();

/**
 * Register a language
 */
export function registerLanguage(name: string, language: Language): void {
  languages.set(name, language);
}

/**
 * Get language by name
 */
export function getLanguage(name: string): Language | undefined {
  return languages.get(name);
}

registerLanguage('Python', new PythonLanguage());
registerLanguage('Java', new JavaLanguage());
registerLanguage('Rust', new RustLanguage());