import { TableNode, Edge, Subgraph, Cell, Graph, TableSection } from '../types/graph';
import { CssClass } from '../types/css-classes';
import type { Viz } from '@viz-js/viz';

const EMPTY_STRING = '';

export interface DotOutputOptions {
  outputPath?: string;
  filename?: string;
}

export class DotGenerator {
  private static vizInstance: Viz | null = null;

  public static setVizInstance(instance: Viz) {
    this.vizInstance = instance;
  }

  static async saveDotSource(dot: string, options?: DotOutputOptions): Promise<void> {
    // Skip if running in browser
    if (typeof window !== 'undefined') {
      console.log('[DOT Generator] Running in browser, skipping file save');
      return;
    }

    try {
      // Dynamic import fs/promises to avoid browser issues
      const { writeFile, mkdir } = await import('fs/promises');
      const { join, dirname } = await import('path');

      const outputPath = options?.outputPath || process.cwd();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options?.filename || `graph_${timestamp}.dot`;
      const fullPath = join(outputPath, filename);

      // Ensure directory exists
      await mkdir(dirname(fullPath), { recursive: true });

      // Write DOT file
      await writeFile(fullPath, dot, 'utf8');
      console.log(`[DOT Generator] Saved DOT source to: ${fullPath}`);
    } catch (error) {
      console.error('[DOT Generator] Failed to save DOT source:', error);
      throw error;
    }
  }

  static async renderToSvg(dot: string, options?: DotOutputOptions): Promise<string> {
    // Optionally save DOT source if options are provided
    if (options) {
      await this.saveDotSource(dot, options);
    }

    try {
      if (typeof window !== 'undefined' && window.Viz) {
        return await window.Viz.render(dot);
      } else if (this.vizInstance) {
        return await this.vizInstance.renderString(dot);
      } else {
        throw new Error('Viz.js is not available');
      }
    } catch (error) {
      console.error('Failed to render DOT to SVG:', error);
      throw error;
    }
  }

  static generateDotSource(graph: Graph): string {
    // Log graph structure before processing
    console.log('[DOT Generator] Processing graph:', {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      subgraphCount: graph.subgraphs.length
    });

    // Process tables first
    const tables = graph.nodes.map(table => {
      // Process sections in order
      const sections = table.sections
        .map(section => {
          // Log section processing
          console.log('[DOT Generator] Processing section:', {
            tableId: table.id,
            sectionId: section.id,
            cellCount: section.cells.length
          });
          
          // Process cells in order
          return section.cells.map(cell => this.generateCellDot(table.id, cell));
        })
        .flat()
        .join('\n');

      // Match Rust table format exactly
      return `
    "${table.id}" [id="${table.id}", label=<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="8" CELLPADDING="4">
        <TR><TD WIDTH="230" BORDER="0" CELLPADDING="6" HREF="remove_me_url.title">${this.escapeHtml(table.label || '')}</TD></TR>
        ${sections}
        <TR><TD CELLSPACING="0" HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE" STYLE="invis"></TD></TR>
        </TABLE>
    >];`;
    }).join('\n');

    // Match Rust's graph structure exactly
    return `digraph {
    graph [
        rankdir = "LR"
        ranksep = 2.0
        fontname = "Arial"
        compound = true
        newrank = true
    ];
    node [
        fontsize = "16"
        fontname = "Arial"
        shape = "plaintext"
        style = "rounded, filled"
    ];
    edge [
        label = " "
    ];

${tables}

${this.generateSubgraphsDot(graph.subgraphs)}

${this.processEdges(graph.edges)}
}`;
  }

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private static generateCellDot(tableId: number, cell: Cell): string {
    // Debug logging for cell data
    const styles = [
      cell.style.border !== undefined ? `BORDER="${cell.style.border}"` : '',
      cell.style.rounded ? 'STYLE="ROUNDED"' : ''
    ].filter(s => s).join(' ');

    // Match Rust's title generation exactly
    const title = `${cell.style.icon ? `<B>${cell.style.icon}</B>  ` : ''}${this.escapeHtml(cell.title || '')}`;
    
    // Generate port ID exactly like Rust
    const port = cell.range_start 
      ? `${cell.range_start[0]}_${cell.range_start[1]}`
      : `${cell.position?.row || 0}_${cell.position?.col || 0}`;

    // Log cell details before rendering
    console.log('[DOT Generator] Rendering cell:', {
      tableId,
      port,
      title,
      hasChildren: cell.children && cell.children.length > 0
    });

    // Handle leaf cells (no children)
    if (!cell.children || cell.children.length === 0) {
      const cellDot = `     <TR><TD PORT="${port}" ID="${tableId}:${port}" ${styles} ${this.css_classes_href(cell.style.classes)}>${title}</TD></TR>`;
      // Verify cell content
      console.log('[DOT Generator] Generated leaf cell:', {
        tableId,
        port,
        title,
        hasContent: !!cellDot.trim()
      });
      return cellDot;
    } 

    // Container cell with children - match Rust nested table format exactly
    const cellStyles = 'BORDER="0"';
    const tableStyles = styles;
    const dotCell = `     <TR><TD PORT="${port}" ${cellStyles} ${EMPTY_STRING}>${title}</TD></TR>`;

    // Process children in the same order as Rust
    const childrenDot = cell.children
      .map(child => this.generateCellDot(tableId, child))
      .join('\n');

    // Match Rust's nested table format exactly, including BGCOLOR
    const containerDot = `
            <TR><TD BORDER="0" CELLPADDING="0">
            <TABLE ID="${tableId}:${port}" CELLSPACING="8" CELLPADDING="4" CELLBORDER="1" ${tableStyles} BGCOLOR="green" ${this.css_classes_href(cell.style.classes)}>
            ${dotCell}
            ${childrenDot}
            </TABLE>
            </TD></TR>`;

    // Verify container content
    console.log('[DOT Generator] Generated container cell:', {
      tableId,
      port,
      hasChildren: true,
      hasContent: !!containerDot.trim()
    });

    return containerDot;
  }

  private static generateSubgraphsDot(subgraphs: Subgraph[]): string {
    // Log subgraph processing
    console.log('[DOT Generator] Processing subgraphs:', {
      count: subgraphs.length,
      titles: subgraphs.map(s => s.title)
    });

    return subgraphs.map(subgraph => {
      // Format node IDs to match Rust implementation
      const nodes = subgraph.nodes.map(n => `"${n}"`);
      
      // Log cluster generation
      console.log('[DOT Generator] Generating cluster:', {
        name: subgraph.title,
        nodeCount: nodes.length,
        nodeNames: nodes,  // Log actual node names for debugging
        subgraphCount: subgraph.subgraphs.length
      });

      // Match Rust's cluster format exactly
      return `
        subgraph "cluster_${this.escapeHtml(subgraph.title)}" {
            label = "${this.escapeHtml(subgraph.title)}";
            style = "rounded";
            bgcolor = "#f0f0f0";
            color = "#666666";
            fontcolor = "#333333";
            margin = "16";

            ${nodes.join('\n            ')}  // Proper indentation for readability

            ${this.generateSubgraphsDot(subgraph.subgraphs)}
        };`;
    }).join('\n');
  }

  private static processEdges(edges: Edge[]): string {
    return edges.map(edge => this.generateEdgeDot(edge)).join('\n');
  }

  private static generateEdgeDot(edge: Edge): string {
    const from = `${edge.from[0]}:"${edge.from[1]}_${edge.from[2]}"`;
    const to = `${edge.to[0]}:"${edge.to[1]}_${edge.to[2]}"`;
    const attrs = [
      `id="${edge.from[0]}:${edge.from[1]}_${edge.from[2]} -> ${edge.to[0]}:${edge.to[1]}_${edge.to[2]}"`,
      this.css_classes(edge.classes)
    ].filter(s => s).join(', ');

    return `    ${from} -> ${to} [${attrs}];`;
  }

  private static css_classes(classes: Set<CssClass>): string {
    if (!classes?.size) return '';
    return `class="${Array.from(classes).map(c => c.toString().toLowerCase().replace('cssclass.', '')).join(' ')}"`;
  }

  private static css_classes_href(classes: Set<CssClass>): string {
    if (!classes?.size) return '';
    return `href="remove_me_url.${Array.from(classes).map(c => c.toString().toLowerCase().replace('cssclass.', '')).join('.')}"`;
  }
}
