import { CssClass } from './css-classes';
import { DocumentSymbol } from 'vscode';

/**
 * Style for graph elements
 */
export interface Style {
  /** CSS classes */
  classes: Set<CssClass>;
  /** Rounded corners */
  rounded?: boolean;
  /** Border width */
  border?: number;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  color?: string;
  /** Font family */
  fontFamily?: string;
  /** Font size */
  fontSize?: string;
  /** Font weight */
  fontWeight?: string;
  /** Text alignment */
  textAlign?: string;
  /** Vertical alignment */
  verticalAlign?: string;
  /** Padding */
  padding?: string;
  /** Margin */
  margin?: string;
  /** Icon */
  icon?: string;
}

/**
 * File information
 */
export interface FileInfo {
  /** File ID */
  id: number;
  /** File path */
  path: string;
  /** Document symbols */
  symbols: DocumentSymbol[];
}

/**
 * Cell position in the graph (for layout)
 */
export interface CellPosition {
  /** Row number (0-based) */
  row: number;
  /** Column number (0-based) */
  col: number;
}

/**
 * Source code position (for call mapping)
 */
export interface SourcePosition {
  /** Line number (0-based) */
  line: number;
  /** Character number (0-based) */
  character: number;
}

/**
 * Cell in a table
 */
export interface Cell {
  /** Cell title */
  title: string;
  /** Cell style */
  style: Style;
  /** Child cells */
  children?: Cell[];
  /** Cell position for layout */
  position?: CellPosition;
  /** Source range start [line, character] */
  range_start?: [number, number];
  /** Source range end [line, character] */
  range_end?: [number, number];
}

/**
 * Table section
 */
export interface TableSection {
  /** Section ID */
  id: string;
  /** Section label */
  label: string;
  /** Section cells */
  cells: Cell[];
  /** Section style */
  style?: Style;
  /** Section CSS class */
  cssClass?: string;
}

/**
 * Edge between nodes
 */
export interface Edge {
  /** Source position [node_id, row, col] */
  from: [number, number, number];
  /** Target position [node_id, row, col] */
  to: [number, number, number];
  /** Edge label */
  label?: string;
  /** Edge CSS classes */
  classes: Set<CssClass>;
}

/**
 * Table node
 */
export interface TableNode {
  /** Node ID */
  id: number;
  /** Node label */
  label: string;
  /** Table sections (cells) */
  sections: TableSection[];
  /** Node style */
  style?: Style;
  /** Node CSS class */
  cssClass?: CssClass;
}

/**
 * Subgraph
 */
export interface Subgraph {
  /** Subgraph title */
  title: string;
  /** Subgraph nodes */
  nodes: string[];
  /** Subgraph subgraphs */
  subgraphs: Subgraph[];
}

/**
 * Graph
 */
export interface Graph {
  /** Graph nodes */
  nodes: TableNode[];
  /** Graph edges */
  edges: Edge[];
  /** Graph subgraphs */
  subgraphs: Subgraph[];
  /** Graph style */
  style?: Style;
  /** Graph CSS class */
  cssClass?: string;
}

/**
 * Interface for generating SVG output from graph data
 */
export interface GenerateSVG {
  /**
   * Generates an SVG representation of the graph
   * @param tables Array of table nodes in the graph
   * @param edges Array of edges connecting nodes
   * @param subgraphs Array of subgraphs for grouping
   * @returns SVG string representation
   */
  generateSvg(
    tables: TableNode[],
    edges: Edge[],
    subgraphs: Subgraph[]
  ): string;
}
