import { DocumentSymbol, Position, CallHierarchyIncomingCall, CallHierarchyOutgoingCall, Location } from 'vscode';
import { CssClass } from './types/css-classes';
import { Cell, Edge, Subgraph, TableNode } from './types/graph';
import { getLanguage } from './lang';
import { DotGenerator } from './graph/dot';
import { FileOutline, SymbolLocation, callItemToLocationId } from './generator/types';
import path from 'path';

export class GraphGenerator {
  private files: Map<string, FileOutline>;
  private nextFileId: number;
  private incomingCalls: Map<string, CallHierarchyIncomingCall[]>;
  private outgoingCalls: Map<string, CallHierarchyOutgoingCall[]>;
  private interfaces: Map<string, Location[]>;
  private highlights: Map<number, Set<[number, number]>>;
  private dotGenerator: DotGenerator;
  private root: string;
  private language: string;

  constructor(root: string, language: string) {
    this.root = root;
    this.language = language;
    this.files = new Map();
    this.nextFileId = 1;
    this.incomingCalls = new Map();
    this.outgoingCalls = new Map();
    this.interfaces = new Map();
    this.highlights = new Map();
    this.dotGenerator = new DotGenerator();
  }

  shouldFilterOutFile(filePath: string): boolean {
    const lang = getLanguage(this.language);
    if (!lang) {
      return true;
    }
    return !lang.isValidFile(filePath);
  }

  addFile(filePath: string, symbols: DocumentSymbol[]): boolean {
    if (this.shouldFilterOutFile(filePath)) {
      return false;
    }

    // Convert URI to filesystem path if needed
    const fsPath = filePath.startsWith('file:') 
      ? decodeURIComponent(filePath.slice('file://'.length))
      : filePath;

    console.log('[Core Generator] Adding file:', fsPath);
    
    // Log symbol details
    console.log('[Core Generator] Processing symbols:', symbols.map(s => ({
      name: s.name,
      kind: s.kind,
      range: [s.selectionRange.start.line, s.selectionRange.start.character],
      hasChildren: !!s.children?.length
    })));
    
    if (this.files.has(fsPath)) {
      console.log('[Core Generator] File already exists:', fsPath);
      return false;
    }

    const file: FileOutline = {
      id: this.nextFileId++,
      path: fsPath,
      symbols
    };

    this.files.set(fsPath, file);
    console.log('[Core Generator] Added file with ID:', file.id);
    return true;
  }

  addIncomingCalls(filePath: string, position: Position, calls: CallHierarchyIncomingCall[]): void {
    console.log('[Core Generator] Adding incoming calls for:', filePath, 'at line:', position.line);
    const location = new SymbolLocation(filePath, position.line, position.character);
    const key = location.toString();
    console.log('[Core Generator] Using location key:', key);
    this.incomingCalls.set(key, calls);
  }

  addOutgoingCalls(filePath: string, position: Position, calls: CallHierarchyOutgoingCall[]): void {
    console.log('[Core Generator] Adding outgoing calls for:', filePath, 'at line:', position.line);
    const location = new SymbolLocation(filePath, position.line, position.character);
    const key = location.toString();
    console.log('[Core Generator] Using location key:', key);
    this.outgoingCalls.set(key, calls);
  }

  addInterfaceImplementations(filePath: string, position: Position, locations: Location[]): void {
    const location = new SymbolLocation(filePath, position.line, position.character);
    this.interfaces.set(location.toString(), locations);
  }

  highlight(filePath: string, position: Position): void {
    const file = this.files.get(filePath);
    if (!file) return;

    const cellPos: [number, number] = [position.line, position.character];
    let positions = this.highlights.get(file.id);
    
    if (!positions) {
      positions = new Set();
      this.highlights.set(file.id, positions);
    }
    
    positions.add(cellPos);
  }

  generateDotSource(): string {
    const lang = getLanguage(this.language);
    if (!lang) {
      throw new Error(`Language ${this.language} not supported`);
    }

    console.log('[Core Generator] Total files:', this.files.size);
    console.log('[Core Generator] Total incoming calls:', this.incomingCalls.size);
    console.log('[Core Generator] Total outgoing calls:', this.outgoingCalls.size);
    console.log('[Core Generator] Files in map:', Array.from(this.files.entries()).map(([k, v]) => `${k} -> ID ${v.id}`));

    // Generate tables for each file
    const tables = new Map<number, TableNode>();
    const cellIds = new Set<string>();

    for (const file of this.files.values()) {
      console.log('[Core Generator] Generating table for file:', file.path, 'with ID:', file.id);
      const table = lang.fileRepr(file);
      
      if (this.highlights.has(file.id)) {
        this.highlightCells(table, this.highlights.get(file.id)!);
      }
      
      tables.set(file.id, table);
      this.collectCellIds(file.id, table, cellIds);
    }

    console.log('[Core Generator] Generated tables:', tables.size);
    console.log('[Core Generator] Collected cell IDs:', Array.from(cellIds));

    // Generate edges from calls
    const edges = new Set<Edge>();
    
    // Add incoming call edges
    for (const [key, calls] of this.incomingCalls) {
      console.log('[Core Generator] Processing incoming calls for location:', key);
      const [filePath, line, char] = key.split(':');
      const toLocation = new SymbolLocation(filePath, parseInt(line), parseInt(char));
      const to = toLocation.locationId(this.files);
      
      if (to && cellIds.has(this.locationToId(to))) {
        console.log('[Core Generator] Found valid target location:', to);
        for (const call of calls) {
          const from = callItemToLocationId(call.from, this.files);
          if (from && cellIds.has(this.locationToId(from))) {
            console.log('[Core Generator] Adding edge from:', from, 'to:', to);
            edges.add({
              from,
              to,
              classes: new Set()
            });
          } else {
            console.log('[Core Generator] Invalid source location or cell ID not found. From:', call.from.uri.toString());
          }
        }
      } else {
        console.log('[Core Generator] Invalid target location or cell ID not found for:', filePath);
      }
    }

    // Add outgoing call edges
    for (const [key, calls] of this.outgoingCalls) {
      console.log('[Core Generator] Processing outgoing calls for location:', key);
      const [filePath, line, char] = key.split(':');
      const fromLocation = new SymbolLocation(filePath, parseInt(line), parseInt(char));
      const from = fromLocation.locationId(this.files);
      
      if (from && cellIds.has(this.locationToId(from))) {
        console.log('[Core Generator] Found valid source location:', from);
        for (const call of calls) {
          const to = callItemToLocationId(call.to, this.files);
          if (to && cellIds.has(this.locationToId(to))) {
            console.log('[Core Generator] Adding edge from:', from, 'to:', to);
            edges.add({
              from,
              to,
              classes: new Set()
            });
          } else {
            console.log('[Core Generator] Invalid target location or cell ID not found. To:', call.to.uri.toString());
          }
        }
      } else {
        console.log('[Core Generator] Invalid source location or cell ID not found for:', filePath);
      }
    }

    console.log('[Core Generator] Total edges created:', edges.size);

    // Add implementation edges
    for (const [key, implementations] of this.interfaces) {
      const [filePath, line, char] = key.split(':');
      const toLocation = new SymbolLocation(filePath, parseInt(line), parseInt(char));
      const to = toLocation.locationId(this.files);

      if (to && cellIds.has(this.locationToId(to))) {
        for (const location of implementations) {
          const from = new SymbolLocation(
            location.uri.toString(),
            location.range.start.line,
            location.range.start.character
          ).locationId(this.files);

          if (from && cellIds.has(this.locationToId(from))) {
            edges.add({
              from,
              to,
              classes: new Set([CssClass.Impl]) // Only impl edges get a class
            });
          }
        }
      }
    }

    // Generate subgraphs
    const subgraphs = this.generateSubgraphs();

    // Create graph structure
    const graph = {
      nodes: Array.from(tables.values()),
      edges: Array.from(edges),
      subgraphs,
      cssClass: CssClass.Graph
    };

    return DotGenerator.generateDotSource(graph);
  }

  private generateSubgraphs(): Subgraph[] {
    const subgraphs: Subgraph[] = [];
    const dirMap = new Map<string, string[]>();

    // Group files by directory
    for (const file of this.files.values()) {
      const dir = path.normalize(path.dirname(file.path));
      let nodes = dirMap.get(dir);
      if (!nodes) {
        nodes = [];
        dirMap.set(dir, nodes);
      }
      nodes.push(file.id.toString());
    }

    // Create subgraphs
    for (const [dir, nodes] of dirMap) {
      // Skip root directory and current directory
      if (dir === '/' || dir === '.' || dir === this.root) {
        continue;
      }
      this.addSubgraphExact(dir, nodes, subgraphs);
    }

    return subgraphs;
  }

  private addSubgraphExact(dir: string, nodes: string[], subgraphs: Subgraph[]): void {
    const normalizedDir = path.normalize(dir).replace(/\\/g, '/');
    
    // Find the most specific ancestor that is a prefix of this directory
    let ancestor: Subgraph | undefined;
    let longestPrefix = '';
    
    for (const subgraph of subgraphs) {
      const normalizedTitle = path.normalize(subgraph.title).replace(/\\/g, '/');
      if (normalizedDir.startsWith(normalizedTitle + '/') && normalizedTitle.length > longestPrefix.length) {
        ancestor = subgraph;
        longestPrefix = normalizedTitle;
      }
    }

    if (!ancestor) {
      // No ancestor found, create new root subgraph
      const subgraph: Subgraph = {
        title: path.basename(dir), // Use basename instead of full path
        nodes,
        subgraphs: []
      };

      console.log('[Generator] Created root subgraph:', {
        title: subgraph.title,
        fullPath: dir,
        nodeCount: nodes.length
      });

      subgraphs.push(subgraph);
    } else {
      // Found ancestor, add as nested subgraph
      const relativeDir = normalizedDir.slice(longestPrefix.length + 1);
      const subgraph: Subgraph = {
        title: path.basename(relativeDir),
        nodes,
        subgraphs: []
      };

      console.log('[Generator] Created nested subgraph:', {
        title: subgraph.title,
        parent: ancestor.title,
        fullPath: dir,
        nodeCount: nodes.length
      });

      ancestor.subgraphs.push(subgraph);
    }
  }

  private locationToId(location: [number, number, number]): string {
    // Convert location tuple to string format matching Rust's (file_id, line, character)
    return `${location[0]}_${location[1]}_${location[2]}`;
  }

  private collectCellIds(tableId: number, table: TableNode, cellIds: Set<string>) {
    console.log('[Core Generator] Collecting cell IDs for table:', tableId);
    
    // Process all sections
    for (const section of table.sections) {
      // Process cells recursively
      const processCell = (cell: Cell) => {
        // Create cell ID from either source range or position
        let id: string;
        if (cell.range_start) {
          // Use source position for call mapping
          id = this.locationToId([
            tableId,
            cell.range_start[0],  // line
            cell.range_start[1]   // character
          ]);
          console.log('[Core Generator] Adding cell ID from source:', id, 'at line:', cell.range_start[0]);
        } else if (cell.position) {
          // Fallback to layout position
          id = this.locationToId([
            tableId,
            cell.position.row,
            cell.position.col
          ]);
          console.log('[Core Generator] Adding cell ID from layout:', id, 'at position:', cell.position.row, cell.position.col);
        } else {
          console.log('[Core Generator] Skipping cell without position:', cell.title);
          return;
        }
        
        cellIds.add(id);

        // Process children
        if (cell.children) {
          for (const child of cell.children) {
            processCell(child);
          }
        }
      };

      // Process each cell in the section
      for (const cell of section.cells) {
        processCell(cell);
      }
    }

    console.log('[Core Generator] Collected IDs for table:', tableId, ':', Array.from(cellIds));
  }

  private highlightCells(table: TableNode, positions: Set<[number, number]>): void {
    for (const section of table.sections) {
      for (const cell of section.cells) {
        for (const pos of positions) {
          if (this.isCellAtPosition(cell, pos)) {
            cell.style.classes.add(CssClass.Highlight);
          }
        }
      }
    }
  }

  private isCellAtPosition(cell: Cell, position: [number, number]): boolean {
    // First try to match by source position
    if (cell.range_start) {
      return cell.range_start[0] === position[0] && cell.range_start[1] === position[1];
    }
    
    // Fallback to layout position
    if (cell.position) {
      return cell.position.row === position[0] && cell.position.col === position[1];
    }

    return false;
  }
}