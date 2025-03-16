import { FileOutline } from '../generator/types';
import { TableNode } from './graph';

/**
 * Language configuration
 */
export interface LanguageConfig {
  /** Language id */
  id: string;
  /** Language name */
  name: string;
  /** File extensions */
  extensions: string[];
  /** File patterns */
  patterns?: string[];
  /** Exclude patterns */
  excludes?: string[];
  /** Language id */
  languageId: string;
  /** File patterns */
  filePatterns: string[];
}

/**
 * Language interface
 */
export interface Language {
  /** Language configuration */
  config: LanguageConfig;

  /**
   * Check if file is valid for this language
   */
  isValidFile(filePath: string): boolean;
  
  /**
   * Create language error
   */
  createLanguageError(method: string, message: string, cause?: Error): Error;

  /**
   * Convert file to table representation
   */
  fileRepr(file: FileOutline): TableNode;

  /**
   * Get file title without extension
   */
  getFileTitle(filePath: string): string;
}
