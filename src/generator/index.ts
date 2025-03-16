import { Cell, Edge, Style, TableNode, Graph, Subgraph } from '../types/graph';
import { CssClass } from '../types/css-classes';
import { Language } from '../types/language';
import { DocumentSymbol, Position } from '../types/lsp-types';
import { DotGenerator } from '../graph/dot';
import * as path from 'path';

/**
 * Generator options
 */
export interface GeneratorOptions {
  /** Language implementation */
  language: Language;
  /** File path */
  filePath: string;
  /** Document symbols */
  symbols: DocumentSymbol[];
}

/**
 * Generator result
 */
export interface GeneratorResult {
  /** Generated cells */
  cells: Cell[];
  /** Generated edges */
  edges: Edge[];
}

/**
 * Graph generator
 */
export class GraphGenerator {
  private readonly language: Language;
  private readonly filePath: string;
  private readonly symbols: DocumentSymbol[];
  private readonly edges: Edge[] = [];
  private readonly tables: Map<string, TableNode> = new Map();
  private readonly subgraphs: Map<string, Set<string>> = new Map();
  private readonly nodeLabels = new Map<string, string>();

  constructor(options: GeneratorOptions) {
    this.language = options.language;
    this.filePath = options.filePath;
    this.symbols = options.symbols;
  }

  /**
   * Generate graph from symbols
   */
  generate(): Graph {
    // Process symbols into tables
    this.processSymbols();

    // Build directory structure
    const subgraphs = this.buildDirectoryStructure();

    // Log graph structure
    console.log('[Generator] Generated graph:', {
      tables: this.tables.size,
      edges: this.edges.length,
      subgraphs: subgraphs.length
    });

    return {
      nodes: Array.from(this.tables.values()),
      edges: this.edges,
      subgraphs
    };
  }

  /**
   * Process symbols into tables
   */
  private processSymbols(): void {
    // Convert file to table
    const table = this.language.fileRepr({
      id: 1,  // Start with ID 1
      path: this.filePath,
      symbols: this.symbols
    });

    // Store table using its ID as key for consistency
    const tableId = String(table.id);
    this.tables.set(tableId, table);

    // Store the node label (filename without extension)
      const nodeLabel = this.language.getFileTitle(this.filePath);
    this.nodeLabels.set(tableId, nodeLabel);

    // Add to parent directory's subgraph using same ID
    const dirPath = path.dirname(this.filePath);
    this.addToSubgraph(dirPath, tableId);

    // Log table creation with both IDs for debugging
    console.log('[Generator] Created table:', {
      id: tableId,
      path: this.filePath,
      label: nodeLabel,
      symbolCount: this.symbols.length
    });
  }

  /**
   * Add a node to a subgraph
   */
  private addToSubgraph(dirPath: string, nodeId: string): void {
    let nodes = this.subgraphs.get(dirPath);
    if (!nodes) {
      nodes = new Set<string>();
      this.subgraphs.set(dirPath, nodes);
    }
    nodes.add(nodeId);

    // Add to parent directory's subgraph as well
    const parentDir = path.dirname(dirPath);
    if (parentDir !== dirPath) {  // Stop at root
      this.addToSubgraph(parentDir, nodeId);
    }
  }

  /**
   * Build directory structure as subgraphs
   */
  private buildDirectoryStructure(): Subgraph[] {
    const subgraphs: Subgraph[] = [];
    const rootDir = path.dirname(this.filePath);

    // Group files by directory like Rust's BTreeMap
    const dirMap = new Map<string, Set<string>>();
    for (const [dirPath, nodeIds] of this.subgraphs) {
      // Skip root directory like Rust
      if (dirPath === rootDir) {
        continue;
      }

      // Get path relative to root directory
      const relativeDir = path.relative(rootDir, dirPath);
      if (!relativeDir) {
        continue;
      }

      // Store node IDs for this directory
      dirMap.set(relativeDir, nodeIds);
    }

    // Create subgraphs like Rust implementation
    for (const [dir, nodeIds] of dirMap) {
      // Convert node IDs to labels (they're already table IDs)
      const nodes = Array.from(nodeIds);

      // Add subgraph recursively
      this.addSubgraphExact(dir, nodes, subgraphs);
    }

    return subgraphs;
  }

  private addSubgraphExact(dir: string, nodes: string[], subgraphs: Subgraph[]): void {
    // Find ancestor directory using exact prefix match like Rust
    const ancestor = subgraphs.find(g => {
      // Handle Windows paths
      const normalizedDir = dir.replace(/\\/g, '/');
      const normalizedTitle = g.title.replace(/\\/g, '/');
      return normalizedDir.startsWith(normalizedTitle + '/');
    });

    if (!ancestor) {
      // No ancestor found, create new root subgraph with full path
      const subgraph: Subgraph = {
        title: dir,
        nodes: nodes.map(id => this.nodeLabels.get(id) || id),
        subgraphs: []
      };

      // Log subgraph creation
      console.log('[Generator] Created subgraph:', {
        title: dir,
        nodeCount: nodes.length,
        nodeNames: subgraph.nodes,
        subgraphCount: 0
      });

      subgraphs.push(subgraph);
    } else {
      // Found ancestor, strip its prefix exactly like Rust
      const normalizedDir = dir.replace(/\\/g, '/');
      const normalizedTitle = ancestor.title.replace(/\\/g, '/');
      const relativeDir = normalizedDir.slice(normalizedTitle.length + 1);
      this.addSubgraphExact(relativeDir, nodes, ancestor.subgraphs);
    }
  }
}
