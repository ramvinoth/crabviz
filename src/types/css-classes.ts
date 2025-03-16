/**
 * CSS classes for styling graph elements
 */
export enum CssClass {
  // Node types
  /** Module */
  Module = 'module',
  /** Interface */
  Interface = 'interface',
  /** Type */
  Type = 'type',

  // Function types
  /** Function */
  Function = 'function',
  /** Method */
  Method = 'method',
  /** Constructor */
  Constructor = 'constructor',
  /** Property */
  Property = 'property',

  // Edge types
  /** Implementation edge */
  Impl = 'impl',

  // Utility classes
  /** Clickable */
  Clickable = 'clickable',
  /** Highlight */
  Highlight = 'highlight',
  /** Cell */
  Cell = 'cell',
  /** Graph */
  Graph = 'graph'
}

/**
 * A set of CSS classes
 */
export type CssClassSet = Set<CssClass>;

/**
 * Helper method to match Rust's to_str behavior
 */
export function cssClassToString(cssClass: CssClass): string {
  return cssClass.toString().toLowerCase();
}
