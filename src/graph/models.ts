import { CssClass } from '../types/css-classes';
import { Cell, Edge, TableNode, Subgraph, TableSection, CellPosition, Style } from '../types/graph';

/**
 * Style implementation
 */
export class StyleImpl implements Style {
  classes: Set<CssClass>;
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  verticalAlign?: string;
  padding?: string;
  margin?: string;
  icon?: string;
  rounded: boolean = false;
  border?: number;

  constructor(init?: Partial<Style>) {
    this.classes = init?.classes || new Set();
    this.backgroundColor = init?.backgroundColor;
    this.color = init?.color;
    this.fontFamily = init?.fontFamily;
    this.fontSize = init?.fontSize;
    this.fontWeight = init?.fontWeight;
    this.textAlign = init?.textAlign;
    this.verticalAlign = init?.verticalAlign;
    this.padding = init?.padding;
    this.margin = init?.margin;
    this.icon = init?.icon;
    this.rounded = init?.rounded || false;
    this.border = init?.border;
  }
}
